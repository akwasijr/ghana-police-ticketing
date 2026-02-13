package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type PaymentRepository interface {
	// Create inserts a new payment record.
	Create(ctx context.Context, payment *models.Payment) error

	// GetByID returns a payment by its ID.
	GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error)

	// GetByReference returns a payment by payment reference.
	GetByReference(ctx context.Context, ref string) (*models.Payment, error)

	// List returns paginated payments with filters.
	List(ctx context.Context, filter models.PaymentFilter, search string, p pagination.Params) ([]models.Payment, int, error)

	// UpdateStatus updates payment status and related fields.
	UpdateStatus(ctx context.Context, id uuid.UUID, status string, transactionID, statusMessage, providerResponse *string) error

	// Complete marks a payment as completed and updates the ticket.
	Complete(ctx context.Context, id uuid.UUID, transactionID *string, receiptNumber string) error

	// GetStats returns aggregate payment statistics.
	GetStats(ctx context.Context, filter models.PaymentFilter) (*models.PaymentStats, error)

	// GetReceipt returns receipt data for a completed payment.
	GetReceipt(ctx context.Context, id uuid.UUID) (*models.PaymentReceipt, error)

	// HasPendingOrCompleted checks if a ticket already has a pending or completed payment.
	HasPendingOrCompleted(ctx context.Context, ticketID uuid.UUID) (bool, error)

	// NextReceiptNumber generates the next receipt number.
	NextReceiptNumber(ctx context.Context) (string, error)
}
