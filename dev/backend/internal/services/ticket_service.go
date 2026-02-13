package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

const dueDateDays = 14

type ticketService struct {
	ticketRepo    repositories.TicketRepository
	offenceRepo   repositories.OffenceRepository
	hierarchyRepo repositories.HierarchyRepository
	storage       portservices.StorageService
	logger        *zap.Logger
}

func NewTicketService(
	ticketRepo repositories.TicketRepository,
	offenceRepo repositories.OffenceRepository,
	hierarchyRepo repositories.HierarchyRepository,
	storage portservices.StorageService,
	logger *zap.Logger,
) portservices.TicketService {
	return &ticketService{
		ticketRepo:    ticketRepo,
		offenceRepo:   offenceRepo,
		hierarchyRepo: hierarchyRepo,
		storage:       storage,
		logger:        logger,
	}
}

// ---------------------------------------------------------------------------
// Jurisdiction filter (applied to list/search/stats)
// ---------------------------------------------------------------------------

func applyTicketJurisdiction(ctx context.Context, filter *models.TicketFilter) {
	role := middleware.GetUserRole(ctx)
	switch role {
	case "officer", "supervisor":
		stationID := middleware.GetStationID(ctx)
		if stationID != nil {
			filter.StationID = stationID
		}
	case "admin", "accountant":
		regionID := middleware.GetRegionID(ctx)
		if regionID != nil && filter.RegionID == nil {
			filter.RegionID = regionID
		}
	}
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

func (s *ticketService) Create(ctx context.Context, req *portservices.CreateTicketRequest) (*portservices.CreateTicketResult, error) {
	// Validation
	if req.Vehicle.RegistrationNumber == "" {
		return nil, apperrors.NewValidationError("Vehicle registration number is required", nil)
	}
	if req.Driver.FirstName == "" || req.Driver.LastName == "" {
		return nil, apperrors.NewValidationError("Driver first and last name are required", nil)
	}
	if len(req.Offences) == 0 {
		return nil, apperrors.NewValidationError("At least one offence is required", nil)
	}

	// Dedup check
	if req.ClientCreatedID != nil {
		existingID, err := s.ticketRepo.ClientCreatedIDExists(ctx, *req.ClientCreatedID)
		if err == nil && existingID != nil {
			return nil, apperrors.NewConflict("Ticket with this clientCreatedId already exists")
		}
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewInternal(err)
		}
	}

	// Get officer context
	officerID := middleware.GetOfficerID(ctx)
	stationID := middleware.GetStationID(ctx)
	regionID := middleware.GetRegionID(ctx)

	if officerID == nil || stationID == nil || regionID == nil {
		return nil, apperrors.NewValidationError("Officer context required (officerId, stationId, regionId)", nil)
	}

	// Get region code for ticket number
	region, err := s.hierarchyRepo.GetRegionByID(ctx, *regionID)
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("lookup region: %w", err))
	}

	// Resolve offences and calculate total fine
	offenceInputs, totalFine, err := s.resolveOffences(ctx, req.Offences)
	if err != nil {
		return nil, err
	}

	// Generate ticket number
	ticketNumber, paymentRef, err := s.ticketRepo.NextTicketNumber(ctx, region.Code)
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("generate ticket number: %w", err))
	}

	issuedAt := time.Now()
	if req.IssuedAt != nil {
		issuedAt = *req.IssuedAt
	}
	dueDate := issuedAt.AddDate(0, 0, dueDateDays)

	driverName := req.Driver.FirstName + " " + req.Driver.LastName

	// Look up station to get district/division
	station, err := s.hierarchyRepo.GetStationByID(ctx, *stationID)
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("lookup station: %w", err))
	}

	ticket := &models.Ticket{
		TicketNumber:      ticketNumber,
		Status:            "unpaid",
		VehicleRegNumber:  req.Vehicle.RegistrationNumber,
		VehicleType:       strPtr(req.Vehicle.Type),
		VehicleColor:      req.Vehicle.Color,
		VehicleMake:       req.Vehicle.Make,
		VehicleModel:      req.Vehicle.Model,
		DriverName:        &driverName,
		DriverLicense:     req.Driver.LicenseNumber,
		DriverPhone:       req.Driver.Phone,
		DriverAddress:     req.Driver.Address,
		LocationDesc:      req.Location.Address,
		LocationLatitude:  &req.Location.Latitude,
		LocationLongitude: &req.Location.Longitude,
		TotalFine:         totalFine,
		PaymentReference:  &paymentRef,
		OfficerID:         *officerID,
		StationID:         *stationID,
		DistrictID:        &station.DistrictID,
		DivisionID:        &station.DivisionID,
		RegionID:          *regionID,
		Notes:             req.Notes,
		SyncStatus:        "synced",
		ClientCreatedID:   req.ClientCreatedID,
		IssuedAt:          issuedAt,
		DueDate:           &dueDate,
	}

	_, err = s.ticketRepo.Create(ctx, ticket, offenceInputs)
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("create ticket: %w", err))
	}

	resp, err := s.ticketRepo.GetByID(ctx, ticket.ID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return &portservices.CreateTicketResult{
		Ticket: resp,
		PrintData: &portservices.PrintData{
			PaymentReference:    paymentRef,
			PaymentInstructions: fmt.Sprintf("Pay fine of GHS %.2f using reference %s at any Ghana Police payment point or via Mobile Money.", totalFine, paymentRef),
		},
	}, nil
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

func (s *ticketService) GetByID(ctx context.Context, ticketID uuid.UUID) (*models.TicketResponse, error) {
	resp, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}
	return resp, nil
}

func (s *ticketService) GetByNumber(ctx context.Context, ticketNumber string) (*models.TicketResponse, error) {
	resp, err := s.ticketRepo.GetByNumber(ctx, ticketNumber)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}
	return resp, nil
}

func (s *ticketService) List(ctx context.Context, filter models.TicketFilter, search string, p pagination.Params) ([]models.TicketListItem, int, error) {
	applyTicketJurisdiction(ctx, &filter)
	return s.ticketRepo.List(ctx, filter, search, p)
}

func (s *ticketService) Search(ctx context.Context, query string) ([]models.TicketListItem, error) {
	if len(strings.TrimSpace(query)) < 2 {
		return nil, apperrors.NewValidationError("Search query must be at least 2 characters", nil)
	}
	var filter models.TicketFilter
	applyTicketJurisdiction(ctx, &filter)
	return s.ticketRepo.Search(ctx, query, filter)
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

func (s *ticketService) Update(ctx context.Context, ticketID uuid.UUID, req *portservices.UpdateTicketRequest) (*models.TicketResponse, error) {
	existing, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}

	if existing.Status == "paid" || existing.Status == "cancelled" {
		return nil, apperrors.NewValidationError("Cannot edit a ticket that is "+existing.Status, nil)
	}

	if req.Status != nil {
		if !isValidStatusTransition(existing.Status, *req.Status) {
			return nil, apperrors.NewValidationError(
				fmt.Sprintf("Cannot transition from %s to %s", existing.Status, *req.Status), nil)
		}
		if err := s.ticketRepo.UpdateStatus(ctx, ticketID, *req.Status); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	}

	if len(req.Offences) > 0 {
		offenceInputs, _, err := s.resolveOffences(ctx, req.Offences)
		if err != nil {
			return nil, err
		}
		if _, err := s.ticketRepo.ReplaceOffences(ctx, ticketID, offenceInputs); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	}

	if req.Notes != nil && *req.Notes != "" {
		officerID := middleware.GetOfficerID(ctx)
		if officerID == nil {
			return nil, apperrors.NewValidationError("Only officers can add notes to tickets", nil)
		}
		if err := s.ticketRepo.AppendNote(ctx, ticketID, *officerID, *req.Notes); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	}

	return s.ticketRepo.GetByID(ctx, ticketID)
}

// ---------------------------------------------------------------------------
// Void
// ---------------------------------------------------------------------------

func (s *ticketService) Void(ctx context.Context, ticketID uuid.UUID, reason string) (*models.TicketResponse, error) {
	existing, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}

	if existing.Status == "paid" || existing.Status == "cancelled" {
		return nil, apperrors.NewValidationError("Cannot void a ticket that is "+existing.Status, nil)
	}

	if len(strings.TrimSpace(reason)) < 10 {
		return nil, apperrors.NewValidationError("Void reason must be at least 10 characters", nil)
	}

	userID := middleware.GetUserID(ctx)
	if err := s.ticketRepo.VoidTicket(ctx, ticketID, userID, reason); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return s.ticketRepo.GetByID(ctx, ticketID)
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

func (s *ticketService) Stats(ctx context.Context, filter models.TicketFilter) (*models.TicketStats, error) {
	applyTicketJurisdiction(ctx, &filter)
	stats, err := s.ticketRepo.GetStats(ctx, filter)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return stats, nil
}

// ---------------------------------------------------------------------------
// Photo upload
// ---------------------------------------------------------------------------

func (s *ticketService) UploadPhoto(ctx context.Context, ticketID uuid.UUID, photoType string, fileData []byte, filename, mimeType string) (*portservices.PhotoUploadResult, error) {
	// Verify ticket exists
	_, err := s.ticketRepo.GetByID(ctx, ticketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}

	// Validate
	if mimeType != "image/jpeg" && mimeType != "image/png" {
		return nil, apperrors.NewValidationError("Only JPEG and PNG images are allowed", nil)
	}
	if len(fileData) > 5*1024*1024 {
		return nil, apperrors.NewValidationError("File size must not exceed 5MB", nil)
	}

	photoID := uuid.New()
	dir := fmt.Sprintf("tickets/%s", ticketID.String())
	storedName := fmt.Sprintf("%s_%s", photoID.String()[:8], filename)

	storagePath, err := s.storage.SaveFile(fileData, dir, storedName)
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("save photo: %w", err))
	}

	photo := &models.TicketPhoto{
		Type: photoType,
	}
	if err := s.ticketRepo.SavePhoto(ctx, photo, ticketID, storagePath, storagePath, mimeType, len(fileData)); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return &portservices.PhotoUploadResult{
		PhotoID:      photo.ID,
		URL:          s.storage.FileURL(storagePath),
		ThumbnailURL: s.storage.FileURL(storagePath),
	}, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (s *ticketService) resolveOffences(ctx context.Context, inputs []portservices.OffenceInput) ([]repositories.TicketOffenceInput, float64, error) {
	var offenceInputs []repositories.TicketOffenceInput
	var totalFine float64

	for _, inp := range inputs {
		offence, err := s.offenceRepo.GetByID(ctx, inp.ID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, 0, apperrors.NewValidationError(fmt.Sprintf("Offence %s not found", inp.ID), nil)
			}
			return nil, 0, apperrors.NewInternal(err)
		}

		fine := offence.DefaultFine
		if inp.CustomFine != nil {
			if *inp.CustomFine < offence.MinFine || *inp.CustomFine > offence.MaxFine {
				return nil, 0, apperrors.NewValidationError(
					fmt.Sprintf("Custom fine for %s must be between %.2f and %.2f", offence.Code, offence.MinFine, offence.MaxFine), nil)
			}
			fine = *inp.CustomFine
		}

		offenceInputs = append(offenceInputs, repositories.TicketOffenceInput{
			OffenceID: inp.ID,
			Fine:      fine,
			Notes:     inp.Notes,
		})
		totalFine += fine
	}

	return offenceInputs, totalFine, nil
}

func isValidStatusTransition(from, to string) bool {
	valid := map[string][]string{
		"unpaid":    {"paid", "overdue", "objection", "cancelled"},
		"overdue":   {"paid", "objection", "cancelled"},
		"objection": {"unpaid", "cancelled"},
	}
	allowed, ok := valid[from]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
