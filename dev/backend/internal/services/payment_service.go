package services

import (
	"context"
	"errors"
	"fmt"
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

type paymentService struct {
	paymentRepo  repositories.PaymentRepository
	ticketRepo   repositories.TicketRepository
	providers    *portservices.ProviderRegistry
	logger       *zap.Logger
}

func NewPaymentService(
	paymentRepo repositories.PaymentRepository,
	ticketRepo repositories.TicketRepository,
	providers *portservices.ProviderRegistry,
	logger *zap.Logger,
) portservices.PaymentService {
	return &paymentService{
		paymentRepo: paymentRepo,
		ticketRepo:  ticketRepo,
		providers:   providers,
		logger:      logger,
	}
}

// ---------------------------------------------------------------------------
// Initiate Digital Payment
// ---------------------------------------------------------------------------

func (s *paymentService) InitiateDigital(ctx context.Context, req *portservices.InitiatePaymentRequest) (*portservices.InitiatePaymentResult, error) {
	if req.Method == "cash" {
		return nil, apperrors.NewValidationError("Cash payments must use the /payments/cash endpoint", nil)
	}

	provider := s.providers.Get(req.Method)
	if provider == nil {
		return nil, apperrors.NewValidationError(fmt.Sprintf("Unsupported payment method: %s", req.Method), nil)
	}

	// Get ticket
	ticket, err := s.ticketRepo.GetByID(ctx, req.TicketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}

	if ticket.Status != "unpaid" && ticket.Status != "overdue" {
		return nil, apperrors.NewValidationError("Ticket is not eligible for payment (status: "+ticket.Status+")", nil)
	}

	// Check for existing pending/completed payment
	exists, err := s.paymentRepo.HasPendingOrCompleted(ctx, req.TicketID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Ticket already has a pending or completed payment")
	}

	// Create payment record
	paymentRef := ""
	if ticket.PaymentReference != nil {
		paymentRef = *ticket.PaymentReference
	} else {
		paymentRef = fmt.Sprintf("PAY-%s", uuid.New().String()[:8])
	}

	expiresAt := time.Now().Add(30 * time.Minute)
	phone := ""
	if req.PhoneNumber != nil {
		phone = *req.PhoneNumber
	}

	// Initiate with provider
	providerResult, err := provider.Initiate(ctx, &portservices.ProviderInitiateRequest{
		Amount:           ticket.TotalFine,
		Currency:         "GHS",
		PaymentReference: paymentRef,
		PhoneNumber:      phone,
		PayerName:        derefStrOr(req.PayerName, "Unknown"),
		Description:      fmt.Sprintf("Fine payment for ticket %s", ticket.TicketNumber),
	})
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("provider initiate: %w", err))
	}

	userID := middleware.GetUserID(ctx)
	stationID := middleware.GetStationID(ctx)

	payment := &models.Payment{
		PaymentReference: paymentRef,
		TicketID:         req.TicketID,
		TicketNumber:     ticket.TicketNumber,
		Amount:           ticket.TotalFine,
		Currency:         "GHS",
		OriginalFine:     ticket.TotalFine,
		Method:           req.Method,
		PhoneNumber:      req.PhoneNumber,
		Status:           providerResult.Status,
		PayerName:        derefStrOr(req.PayerName, "Unknown"),
		PayerPhone:       req.PhoneNumber,
		PayerEmail:       req.PayerEmail,
		ProcessedByID:    &userID,
		StationID:        stationID,
		ExpiresAt:        &expiresAt,
		TransactionID:    strPtrIfNotEmpty(providerResult.ProviderRef),
	}

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("create payment: %w", err))
	}

	result := &portservices.InitiatePaymentResult{
		PaymentID:        payment.ID,
		PaymentReference: paymentRef,
		Amount:           ticket.TotalFine,
		Method:           req.Method,
		Instructions:     providerResult.Instructions,
	}
	if providerResult.RedirectURL != "" {
		result.RedirectURL = &providerResult.RedirectURL
	}
	if providerResult.USSDCode != "" {
		result.USSDCode = &providerResult.USSDCode
	}
	expStr := expiresAt.Format(time.RFC3339)
	result.ExpiresAt = &expStr

	return result, nil
}

// ---------------------------------------------------------------------------
// Record Cash Payment
// ---------------------------------------------------------------------------

func (s *paymentService) RecordCash(ctx context.Context, req *portservices.RecordCashRequest) (*models.Payment, error) {
	if req.Amount <= 0 {
		return nil, apperrors.NewValidationError("Amount must be greater than 0", nil)
	}
	if req.PayerName == "" {
		return nil, apperrors.NewValidationError("Payer name is required", nil)
	}

	// Get ticket
	ticket, err := s.ticketRepo.GetByID(ctx, req.TicketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Ticket")
		}
		return nil, apperrors.NewInternal(err)
	}

	if ticket.Status != "unpaid" && ticket.Status != "overdue" {
		return nil, apperrors.NewValidationError("Ticket is not eligible for payment (status: "+ticket.Status+")", nil)
	}

	exists, err := s.paymentRepo.HasPendingOrCompleted(ctx, req.TicketID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Ticket already has a pending or completed payment")
	}

	// Generate receipt
	receiptNum, err := s.paymentRepo.NextReceiptNumber(ctx)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	paymentRef := ""
	if ticket.PaymentReference != nil {
		paymentRef = *ticket.PaymentReference
	} else {
		paymentRef = fmt.Sprintf("PAY-CASH-%s", uuid.New().String()[:8])
	}

	now := time.Now()
	userID := middleware.GetUserID(ctx)
	stationID := middleware.GetStationID(ctx)

	payment := &models.Payment{
		PaymentReference: paymentRef,
		TicketID:         req.TicketID,
		TicketNumber:     ticket.TicketNumber,
		Amount:           req.Amount,
		Currency:         "GHS",
		OriginalFine:     ticket.TotalFine,
		Method:           "cash",
		Status:           "completed",
		PayerName:        req.PayerName,
		PayerPhone:       req.PayerPhone,
		ReceiptNumber:    &receiptNum,
		ProcessedByID:    &userID,
		StationID:        stationID,
		ProcessedAt:      &now,
		CompletedAt:      &now,
		TransactionID:    strPtrIfNotEmpty(fmt.Sprintf("CASH-%s", paymentRef)),
	}

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("create cash payment: %w", err))
	}

	// Complete: update ticket to paid
	if err := s.paymentRepo.Complete(ctx, payment.ID, payment.TransactionID, receiptNum); err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("complete cash payment: %w", err))
	}

	return s.paymentRepo.GetByID(ctx, payment.ID)
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

func (s *paymentService) Verify(ctx context.Context, req *portservices.VerifyPaymentRequest) (*portservices.VerifyPaymentResult, error) {
	payment, err := s.paymentRepo.GetByReference(ctx, req.PaymentReference)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Payment")
		}
		return nil, apperrors.NewInternal(err)
	}

	if payment.Status == "completed" || payment.Status == "refunded" {
		// Already final
		ticket, _ := s.ticketRepo.GetByID(ctx, payment.TicketID)
		ticketStatus := ""
		if ticket != nil {
			ticketStatus = ticket.Status
		}
		return &portservices.VerifyPaymentResult{
			Payment: payment,
			Ticket: &portservices.VerifyTicketInfo{
				ID:           payment.TicketID,
				TicketNumber: payment.TicketNumber,
				Status:       ticketStatus,
			},
		}, nil
	}

	provider := s.providers.Get(payment.Method)
	if provider == nil {
		return nil, apperrors.NewInternal(fmt.Errorf("no provider for method %s", payment.Method))
	}

	providerRef := ""
	if payment.TransactionID != nil {
		providerRef = *payment.TransactionID
	}

	verifyResult, err := provider.Verify(ctx, providerRef)
	if err != nil {
		return nil, apperrors.NewInternal(fmt.Errorf("provider verify: %w", err))
	}

	rawResp := strPtrIfNotEmpty(verifyResult.RawResponse)

	if verifyResult.Status == "completed" {
		receiptNum, err := s.paymentRepo.NextReceiptNumber(ctx)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		txID := strPtrIfNotEmpty(verifyResult.TransactionID)
		if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, "completed", txID, &verifyResult.StatusMessage, rawResp); err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if err := s.paymentRepo.Complete(ctx, payment.ID, txID, receiptNum); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	} else {
		if err := s.paymentRepo.UpdateStatus(ctx, payment.ID, verifyResult.Status, strPtrIfNotEmpty(verifyResult.TransactionID), &verifyResult.StatusMessage, rawResp); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	}

	// Re-fetch
	payment, _ = s.paymentRepo.GetByID(ctx, payment.ID)
	ticket, _ := s.ticketRepo.GetByID(ctx, payment.TicketID)
	ticketStatus := ""
	if ticket != nil {
		ticketStatus = ticket.Status
	}

	return &portservices.VerifyPaymentResult{
		Payment: payment,
		Ticket: &portservices.VerifyTicketInfo{
			ID:           payment.TicketID,
			TicketNumber: payment.TicketNumber,
			Status:       ticketStatus,
		},
	}, nil
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

func (s *paymentService) GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	payment, err := s.paymentRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Payment")
		}
		return nil, apperrors.NewInternal(err)
	}
	return payment, nil
}

func (s *paymentService) List(ctx context.Context, filter models.PaymentFilter, search string, p pagination.Params) ([]models.Payment, int, error) {
	return s.paymentRepo.List(ctx, filter, search, p)
}

func (s *paymentService) Stats(ctx context.Context, filter models.PaymentFilter) (*models.PaymentStats, error) {
	return s.paymentRepo.GetStats(ctx, filter)
}

func (s *paymentService) Receipt(ctx context.Context, id uuid.UUID) (*models.PaymentReceipt, error) {
	receipt, err := s.paymentRepo.GetReceipt(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Payment receipt")
		}
		return nil, apperrors.NewInternal(err)
	}
	return receipt, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func derefStrOr(s *string, fallback string) string {
	if s != nil && *s != "" {
		return *s
	}
	return fallback
}

func strPtrIfNotEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
