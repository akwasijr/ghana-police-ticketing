package services

import (
	"context"
	"errors"
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

const objectionDeadlineDays = 7
const reviewDeadlineDays = 14

type objectionService struct {
	objectionRepo repositories.ObjectionRepository
	ticketRepo    repositories.TicketRepository
	logger        *zap.Logger
}

func NewObjectionService(
	objectionRepo repositories.ObjectionRepository,
	ticketRepo repositories.TicketRepository,
	logger *zap.Logger,
) portservices.ObjectionService {
	return &objectionService{
		objectionRepo: objectionRepo,
		ticketRepo:    ticketRepo,
		logger:        logger,
	}
}

// ---------------------------------------------------------------------------
// File Objection
// ---------------------------------------------------------------------------

func (s *objectionService) File(ctx context.Context, req *portservices.FileObjectionRequest) (*portservices.FileObjectionResult, error) {
	// Validate
	if req.TicketID == uuid.Nil {
		return nil, apperrors.NewValidationError("Ticket ID is required", nil)
	}
	if len(req.Reason) < 10 {
		return nil, apperrors.NewValidationError("Reason must be at least 10 characters", nil)
	}
	if req.ContactPhone == "" {
		return nil, apperrors.NewValidationError("Contact phone is required", nil)
	}

	// Get ticket
	ticket, err := s.ticketRepo.GetByID(ctx, req.TicketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}

	// Check ticket status — only unpaid or overdue can be objected
	if ticket.Status != "unpaid" && ticket.Status != "overdue" {
		return nil, apperrors.NewValidationError("Ticket is not eligible for objection (status: "+ticket.Status+")", nil)
	}

	// Check 7-day deadline
	deadline := ticket.IssuedAt.AddDate(0, 0, objectionDeadlineDays)
	if time.Now().After(deadline) {
		return nil, apperrors.NewValidationError("Objection deadline has passed (must be filed within 7 days of ticket issuance)", nil)
	}

	// Check for existing active objection
	exists, err := s.objectionRepo.HasActiveObjection(ctx, req.TicketID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("An active objection already exists for this ticket")
	}

	// Build offence type string from ticket offences
	offenceType := "Unknown"
	if len(ticket.Offences) > 0 {
		names := make([]string, len(ticket.Offences))
		for i, o := range ticket.Offences {
			names[i] = o.Name
		}
		offenceType = joinStrings(names, ", ")
	}

	// Get driver name from ticket
	driverName := ""
	if ticket.Driver.FirstName != "" {
		driverName = ticket.Driver.FirstName + " " + ticket.Driver.LastName
	}

	now := time.Now()
	reviewDeadline := now.AddDate(0, 0, reviewDeadlineDays)

	objection := &models.Objection{
		TicketID:       req.TicketID,
		TicketNumber:   ticket.TicketNumber,
		VehicleReg:     ticket.Vehicle.RegistrationNumber,
		OffenceType:    offenceType,
		FineAmount:     ticket.TotalFine,
		Reason:         req.Reason,
		Details:        req.Details,
		DriverName:     driverName,
		DriverPhone:    req.ContactPhone,
		DriverEmail:    req.ContactEmail,
		Status:         models.ObjectionStatusPending,
		SubmittedAt:    now,
		ReviewDeadline: reviewDeadline,
		StationID:      &ticket.StationID,
		RegionID:       &ticket.RegionID,
	}

	if err := s.objectionRepo.Create(ctx, objection); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Update ticket status to 'objection'
	if err := s.ticketRepo.UpdateStatus(ctx, req.TicketID, "objection"); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return &portservices.FileObjectionResult{
		ObjectionID:    objection.ID,
		TicketNumber:   objection.TicketNumber,
		Status:         objection.Status,
		FiledAt:        objection.SubmittedAt,
		ReviewDeadline: reviewDeadline,
	}, nil
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

func (s *objectionService) GetByID(ctx context.Context, id uuid.UUID) (*models.ObjectionResponse, error) {
	resp, err := s.objectionRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Objection")
		}
		return nil, apperrors.NewInternal(err)
	}
	return resp, nil
}

func (s *objectionService) List(ctx context.Context, filter models.ObjectionFilter, search string, p pagination.Params) ([]models.ObjectionResponse, int, error) {
	return s.objectionRepo.List(ctx, filter, search, p)
}

func (s *objectionService) Stats(ctx context.Context, filter models.ObjectionFilter) (*models.ObjectionStats, error) {
	return s.objectionRepo.GetStats(ctx, filter)
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

func (s *objectionService) Review(ctx context.Context, id uuid.UUID, req *portservices.ReviewObjectionRequest) (*models.ObjectionResponse, error) {
	// Validate
	if req.Decision != models.ObjectionStatusApproved && req.Decision != models.ObjectionStatusRejected {
		return nil, apperrors.NewValidationError("Decision must be 'approved' or 'rejected'", nil)
	}
	if len(req.ReviewNotes) < 10 {
		return nil, apperrors.NewValidationError("Review notes must be at least 10 characters", nil)
	}
	if req.AdjustedFine != nil && *req.AdjustedFine < 0 {
		return nil, apperrors.NewValidationError("Adjusted fine cannot be negative", nil)
	}

	// Get current objection
	objection, err := s.objectionRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Objection")
		}
		return nil, apperrors.NewInternal(err)
	}

	if objection.Status != models.ObjectionStatusPending {
		return nil, apperrors.NewValidationError("Only pending objections can be reviewed", nil)
	}

	reviewerID := middleware.GetUserID(ctx)

	// Update objection status
	if err := s.objectionRepo.Review(ctx, id, req.Decision, reviewerID, req.ReviewNotes, req.AdjustedFine); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Update ticket status based on decision
	if req.Decision == models.ObjectionStatusApproved {
		if req.AdjustedFine != nil {
			// Fine adjusted — revert ticket to unpaid with new fine
			if err := s.ticketRepo.UpdateStatus(ctx, objection.TicketID, "unpaid"); err != nil {
				return nil, apperrors.NewInternal(err)
			}
		} else {
			// Full approval — cancel the ticket
			if err := s.ticketRepo.UpdateStatus(ctx, objection.TicketID, "cancelled"); err != nil {
				return nil, apperrors.NewInternal(err)
			}
		}
	} else {
		// Rejected — revert to unpaid (or overdue based on due date)
		newStatus := "unpaid"
		ticket, ticketErr := s.ticketRepo.GetByID(ctx, objection.TicketID)
		if ticketErr == nil && ticket.DueDate != nil && time.Now().After(*ticket.DueDate) {
			newStatus = "overdue"
		}
		if err := s.ticketRepo.UpdateStatus(ctx, objection.TicketID, newStatus); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	}

	// Return updated objection
	return s.objectionRepo.GetByID(ctx, id)
}

func joinStrings(ss []string, sep string) string {
	if len(ss) == 0 {
		return ""
	}
	result := ss[0]
	for _, s := range ss[1:] {
		result += sep + s
	}
	return result
}
