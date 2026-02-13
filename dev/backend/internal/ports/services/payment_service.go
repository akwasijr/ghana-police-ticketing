package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type PaymentService interface {
	InitiateDigital(ctx context.Context, req *InitiatePaymentRequest) (*InitiatePaymentResult, error)
	RecordCash(ctx context.Context, req *RecordCashRequest) (*models.Payment, error)
	Verify(ctx context.Context, req *VerifyPaymentRequest) (*VerifyPaymentResult, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error)
	List(ctx context.Context, filter models.PaymentFilter, search string, p pagination.Params) ([]models.Payment, int, error)
	Stats(ctx context.Context, filter models.PaymentFilter) (*models.PaymentStats, error)
	Receipt(ctx context.Context, id uuid.UUID) (*models.PaymentReceipt, error)
}

type InitiatePaymentRequest struct {
	TicketID    uuid.UUID `json:"ticketId"`
	Method      string    `json:"method"`
	PhoneNumber *string   `json:"phoneNumber,omitempty"`
	PayerName   *string   `json:"payerName,omitempty"`
	PayerEmail  *string   `json:"payerEmail,omitempty"`
}

type InitiatePaymentResult struct {
	PaymentID        uuid.UUID `json:"paymentId"`
	PaymentReference string    `json:"paymentReference"`
	Amount           float64   `json:"amount"`
	Method           string    `json:"method"`
	RedirectURL      *string   `json:"redirectUrl,omitempty"`
	USSDCode         *string   `json:"ussdCode,omitempty"`
	Instructions     string    `json:"instructions"`
	ExpiresAt        *string   `json:"expiresAt,omitempty"`
}

type RecordCashRequest struct {
	TicketID  uuid.UUID `json:"ticketId"`
	Amount    float64   `json:"amount"`
	PayerName string    `json:"payerName"`
	PayerPhone *string  `json:"payerPhone,omitempty"`
	Notes     *string   `json:"notes,omitempty"`
}

type VerifyPaymentRequest struct {
	PaymentReference string  `json:"paymentReference"`
	TransactionID    *string `json:"transactionId,omitempty"`
}

type VerifyPaymentResult struct {
	Payment *models.Payment `json:"payment"`
	Ticket  *VerifyTicketInfo `json:"ticket"`
}

type VerifyTicketInfo struct {
	ID           uuid.UUID `json:"id"`
	TicketNumber string    `json:"ticketNumber"`
	Status       string    `json:"status"`
}
