package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

const (
	maxBatchSize  = 50
	maxPhotoBytes = 5 * 1024 * 1024 // 5 MB
)

type syncService struct {
	syncRepo      repositories.SyncRepository
	ticketRepo    repositories.TicketRepository
	offenceRepo   repositories.OffenceRepository
	hierarchyRepo repositories.HierarchyRepository
	storage       portservices.StorageService
	logger        *zap.Logger
}

func NewSyncService(
	syncRepo repositories.SyncRepository,
	ticketRepo repositories.TicketRepository,
	offenceRepo repositories.OffenceRepository,
	hierarchyRepo repositories.HierarchyRepository,
	storage portservices.StorageService,
	logger *zap.Logger,
) portservices.SyncService {
	return &syncService{
		syncRepo:      syncRepo,
		ticketRepo:    ticketRepo,
		offenceRepo:   offenceRepo,
		hierarchyRepo: hierarchyRepo,
		storage:       storage,
		logger:        logger,
	}
}

// ---------------------------------------------------------------------------
// BatchSync
// ---------------------------------------------------------------------------

func (s *syncService) BatchSync(ctx context.Context, req *models.SyncRequest, deviceID string) (*models.SyncResponse, error) {
	totalItems := len(req.Tickets) + len(req.Photos)
	if totalItems > maxBatchSize {
		return nil, apperrors.NewValidationError(
			fmt.Sprintf("Maximum batch size of %d items exceeded (got %d)", maxBatchSize, totalItems), nil)
	}

	if deviceID == "" {
		return nil, apperrors.NewValidationError("Device ID is required (X-Device-ID header)", nil)
	}

	syncTimestamp := time.Now().UTC()
	userID := middleware.GetUserID(ctx)

	// Process tickets
	ticketResults := make([]models.SyncTicketResult, 0, len(req.Tickets))
	// Map local ticket IDs → server IDs for photo resolution
	localToServerID := make(map[string]uuid.UUID)

	for _, item := range req.Tickets {
		result := s.processTicketItem(ctx, item)
		ticketResults = append(ticketResults, result)

		if result.Status == "success" && result.ServerID != "" {
			serverUUID, err := uuid.Parse(result.ServerID)
			if err == nil {
				localToServerID[item.ID] = serverUUID
			}
		}
	}

	// Process photos
	photoResults := make([]models.SyncPhotoResult, 0, len(req.Photos))
	for _, item := range req.Photos {
		result := s.processPhotoItem(ctx, item, localToServerID)
		photoResults = append(photoResults, result)
	}

	// Get server updates since lastSyncTimestamp
	stationID := middleware.GetStationID(ctx)
	regionID := middleware.GetRegionID(ctx)
	serverTickets, err := s.syncRepo.GetTicketsUpdatedSince(ctx, req.LastSyncTimestamp, stationID, regionID, 200)
	if err != nil {
		s.logger.Error("failed to get server updates", zap.Error(err))
		serverTickets = []models.ServerTicketUpdate{}
	}

	// Update device sync record
	if err := s.syncRepo.UpsertDeviceSync(ctx, userID, deviceID, syncTimestamp, totalItems); err != nil {
		s.logger.Error("failed to update device sync", zap.Error(err))
	}

	return &models.SyncResponse{
		SyncTimestamp: syncTimestamp,
		Results: models.SyncResults{
			Tickets: ticketResults,
			Photos:  photoResults,
		},
		ServerUpdates: models.ServerUpdates{
			Tickets: serverTickets,
		},
	}, nil
}

// ---------------------------------------------------------------------------
// Process individual ticket
// ---------------------------------------------------------------------------

func (s *syncService) processTicketItem(ctx context.Context, item models.SyncTicketItem) models.SyncTicketResult {
	switch item.Action {
	case "create":
		return s.processTicketCreate(ctx, item)
	case "update":
		return s.processTicketUpdate(ctx, item)
	default:
		errMsg := fmt.Sprintf("invalid action: %s", item.Action)
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}
}

func (s *syncService) processTicketCreate(ctx context.Context, item models.SyncTicketItem) models.SyncTicketResult {
	var data models.SyncTicketData
	if err := json.Unmarshal(item.Data, &data); err != nil {
		errMsg := fmt.Sprintf("invalid ticket data: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	// Dedup check via clientCreatedId
	if data.ClientCreatedID != nil {
		existingID, err := s.ticketRepo.ClientCreatedIDExists(ctx, *data.ClientCreatedID)
		if err == nil && existingID != nil {
			// Already exists — return existing server ID (idempotent)
			return models.SyncTicketResult{
				LocalID:  item.ID,
				ServerID: existingID.String(),
				Status:   "success",
			}
		}
	}

	// Get officer context
	officerID := middleware.GetOfficerID(ctx)
	stationID := middleware.GetStationID(ctx)
	regionID := middleware.GetRegionID(ctx)

	if officerID == nil || stationID == nil || regionID == nil {
		errMsg := "officer context required (officerId, stationId, regionId)"
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	// Get region code for ticket number
	region, err := s.hierarchyRepo.GetRegionByID(ctx, *regionID)
	if err != nil {
		errMsg := fmt.Sprintf("lookup region: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	// Resolve offences
	offenceInputs, totalFine, err := s.resolveOffenceIDs(ctx, data.OffenceIds)
	if err != nil {
		errMsg := fmt.Sprintf("resolve offences: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	// Generate ticket number
	ticketNumber, paymentRef, err := s.ticketRepo.NextTicketNumber(ctx, region.Code)
	if err != nil {
		errMsg := fmt.Sprintf("generate ticket number: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	issuedAt := item.Timestamp
	if data.IssuedAt != nil {
		issuedAt = *data.IssuedAt
	}
	dueDate := issuedAt.AddDate(0, 0, 14)

	driverName := data.DriverFirstName + " " + data.DriverLastName

	station, err := s.hierarchyRepo.GetStationByID(ctx, *stationID)
	if err != nil {
		errMsg := fmt.Sprintf("lookup station: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	ticket := &models.Ticket{
		TicketNumber:      ticketNumber,
		Status:            "unpaid",
		VehicleRegNumber:  data.VehicleRegistration,
		VehicleType:       data.VehicleType,
		VehicleColor:      data.VehicleColor,
		VehicleMake:       data.VehicleMake,
		VehicleModel:      data.VehicleModel,
		DriverName:        &driverName,
		DriverLicense:     data.DriverLicense,
		DriverPhone:       data.DriverPhone,
		DriverAddress:     data.DriverAddress,
		LocationDesc:      &data.Location,
		LocationLatitude:  data.LocationLatitude,
		LocationLongitude: data.LocationLongitude,
		TotalFine:         totalFine,
		PaymentReference:  &paymentRef,
		OfficerID:         *officerID,
		StationID:         *stationID,
		DistrictID:        &station.DistrictID,
		DivisionID:        &station.DivisionID,
		RegionID:          *regionID,
		Notes:             data.Notes,
		SyncStatus:        "synced",
		ClientCreatedID:   data.ClientCreatedID,
		IssuedAt:          issuedAt,
		DueDate:           &dueDate,
	}

	_, err = s.ticketRepo.Create(ctx, ticket, offenceInputs)
	if err != nil {
		errMsg := fmt.Sprintf("create ticket: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	return models.SyncTicketResult{
		LocalID:  item.ID,
		ServerID: ticket.ID.String(),
		Status:   "success",
	}
}

func (s *syncService) processTicketUpdate(ctx context.Context, item models.SyncTicketItem) models.SyncTicketResult {
	var data models.SyncTicketUpdateData
	if err := json.Unmarshal(item.Data, &data); err != nil {
		errMsg := fmt.Sprintf("invalid update data: %s", err.Error())
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	if data.ID == uuid.Nil {
		errMsg := "server ticket ID required for updates"
		return models.SyncTicketResult{LocalID: item.ID, Status: "error", Error: &errMsg}
	}

	// Check server version — server-wins conflict resolution
	existing, err := s.ticketRepo.GetByID(ctx, data.ID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			errMsg := "ticket not found"
			return models.SyncTicketResult{LocalID: item.ID, ServerID: data.ID.String(), Status: "error", Error: &errMsg}
		}
		errMsg := err.Error()
		return models.SyncTicketResult{LocalID: item.ID, ServerID: data.ID.String(), Status: "error", Error: &errMsg}
	}

	// Server-wins: if the server version was updated after the device's change timestamp, report conflict
	if existing.UpdatedAt.After(item.Timestamp) {
		errMsg := "server version is newer — server-wins conflict resolution applied"
		return models.SyncTicketResult{LocalID: item.ID, ServerID: data.ID.String(), Status: "conflict", Error: &errMsg}
	}

	// Apply updates
	if data.Notes != nil && *data.Notes != "" {
		officerID := middleware.GetOfficerID(ctx)
		if officerID != nil {
			_ = s.ticketRepo.AppendNote(ctx, data.ID, *officerID, *data.Notes)
		}
	}

	return models.SyncTicketResult{
		LocalID:  item.ID,
		ServerID: data.ID.String(),
		Status:   "success",
	}
}

// ---------------------------------------------------------------------------
// Process individual photo
// ---------------------------------------------------------------------------

func (s *syncService) processPhotoItem(ctx context.Context, item models.SyncPhotoItem, localToServerID map[string]uuid.UUID) models.SyncPhotoResult {
	// Validate photo type
	validTypes := map[string]bool{"vehicle": true, "plate": true, "evidence": true, "other": true}
	if !validTypes[item.Type] {
		return models.SyncPhotoResult{LocalID: item.PhotoID, Status: "error"}
	}

	// Decode base64 data
	photoData, err := base64.StdEncoding.DecodeString(item.Data)
	if err != nil {
		return models.SyncPhotoResult{LocalID: item.PhotoID, Status: "error"}
	}

	if len(photoData) > maxPhotoBytes {
		return models.SyncPhotoResult{LocalID: item.PhotoID, Status: "error"}
	}

	// Resolve ticket ID (could be local ID mapped to server ID, or already a server UUID)
	ticketID, err := s.resolveTicketID(item.TicketID, localToServerID)
	if err != nil {
		return models.SyncPhotoResult{LocalID: item.PhotoID, Status: "error"}
	}

	// Save file
	photoID := uuid.New()
	dir := fmt.Sprintf("tickets/%s", ticketID.String())
	filename := fmt.Sprintf("%s_sync.jpg", photoID.String()[:8])

	storagePath, err := s.storage.SaveFile(photoData, dir, filename)
	if err != nil {
		return models.SyncPhotoResult{LocalID: item.PhotoID, Status: "error"}
	}

	// Save photo record
	photo := &models.TicketPhoto{Type: item.Type}
	if err := s.ticketRepo.SavePhoto(ctx, photo, ticketID, storagePath, storagePath, "image/jpeg", len(photoData)); err != nil {
		return models.SyncPhotoResult{LocalID: item.PhotoID, Status: "error"}
	}

	return models.SyncPhotoResult{
		LocalID:  item.PhotoID,
		ServerID: photo.ID.String(),
		Status:   "success",
		URL:      s.storage.FileURL(storagePath),
	}
}

// ---------------------------------------------------------------------------
// GetStatus
// ---------------------------------------------------------------------------

func (s *syncService) GetStatus(ctx context.Context, deviceID string) (*models.SyncStatus, error) {
	if deviceID == "" {
		return nil, apperrors.NewValidationError("Device ID is required", nil)
	}

	userID := middleware.GetUserID(ctx)
	stationID := middleware.GetStationID(ctx)
	regionID := middleware.GetRegionID(ctx)

	status := &models.SyncStatus{DeviceID: deviceID}

	ds, err := s.syncRepo.GetDeviceSync(ctx, userID, deviceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// No sync record — return zero state
			status.PendingServerUpdates = 0
			return status, nil
		}
		return nil, apperrors.NewInternal(err)
	}

	status.LastSyncTimestamp = &ds.LastSyncTimestamp

	// Count pending updates since last sync
	count, err := s.syncRepo.CountTicketsUpdatedSince(ctx, ds.LastSyncTimestamp, stationID, regionID)
	if err != nil {
		s.logger.Error("failed to count pending updates", zap.Error(err))
	}
	status.PendingServerUpdates = count

	return status, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (s *syncService) resolveOffenceIDs(ctx context.Context, offenceIDs []uuid.UUID) ([]repositories.TicketOffenceInput, float64, error) {
	var inputs []repositories.TicketOffenceInput
	var totalFine float64

	for _, oid := range offenceIDs {
		offence, err := s.offenceRepo.GetByID(ctx, oid)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, 0, fmt.Errorf("offence %s not found", oid)
			}
			return nil, 0, err
		}
		inputs = append(inputs, repositories.TicketOffenceInput{
			OffenceID: oid,
			Fine:      offence.DefaultFine,
		})
		totalFine += offence.DefaultFine
	}

	return inputs, totalFine, nil
}

func (s *syncService) resolveTicketID(ticketRef string, localToServerID map[string]uuid.UUID) (uuid.UUID, error) {
	// Check if it's a local ID mapped from this sync batch
	if serverID, ok := localToServerID[ticketRef]; ok {
		return serverID, nil
	}
	// Try parsing as UUID directly
	id, err := uuid.Parse(ticketRef)
	if err != nil {
		return uuid.Nil, fmt.Errorf("cannot resolve ticket ID: %s", ticketRef)
	}
	return id, nil
}
