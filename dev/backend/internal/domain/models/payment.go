package models

import (
	"time"

	"github.com/google/uuid"
)

// Payment is the database model for a payment record.
type Payment struct {
	ID               uuid.UUID  `json:"id"`
	PaymentReference string     `json:"paymentReference"`
	TicketID         uuid.UUID  `json:"ticketId"`
	TicketNumber     string     `json:"ticketNumber"`
	Amount           float64    `json:"amount"`
	Currency         string     `json:"currency"`
	OriginalFine     float64    `json:"originalFine"`
	LateFee          float64    `json:"lateFee"`
	Discount         float64    `json:"discount"`
	Method           string     `json:"method"`
	PhoneNumber      *string    `json:"phoneNumber,omitempty"`
	Network          *string    `json:"network,omitempty"`
	TransactionID    *string    `json:"transactionId,omitempty"`
	Status           string     `json:"status"`
	StatusMessage    *string    `json:"statusMessage,omitempty"`
	PayerName        string     `json:"payerName"`
	PayerPhone       *string    `json:"payerPhone,omitempty"`
	PayerEmail       *string    `json:"payerEmail,omitempty"`
	ReceiptNumber    *string    `json:"receiptNumber,omitempty"`
	ProcessedByID    *uuid.UUID `json:"processedById,omitempty"`
	ProcessedByName  *string    `json:"processedByName,omitempty"`
	StationID        *uuid.UUID `json:"stationId,omitempty"`
	ProviderResponse *string    `json:"providerResponse,omitempty"`
	ProcessedAt      *time.Time `json:"processedAt,omitempty"`
	CompletedAt      *time.Time `json:"completedAt,omitempty"`
	ExpiresAt        *time.Time `json:"expiresAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// PaymentFilter holds query parameters for payment listing.
type PaymentFilter struct {
	Status        *string
	Method        *string
	DateFrom      *time.Time
	DateTo        *time.Time
	MinAmount     *float64
	MaxAmount     *float64
	StationID     *uuid.UUID
	ProcessedByID *uuid.UUID
}

// PaymentStats holds aggregate payment statistics.
type PaymentStats struct {
	TotalPayments int              `json:"totalPayments"`
	TotalAmount   float64          `json:"totalAmount"`
	ByStatus      map[string]int   `json:"byStatus"`
	ByMethod      map[string]MethodStats `json:"byMethod"`
	TodayAmount   float64          `json:"todayAmount"`
	WeekAmount    float64          `json:"weekAmount"`
	MonthAmount   float64          `json:"monthAmount"`
}

// MethodStats holds per-method payment statistics.
type MethodStats struct {
	Count  int     `json:"count"`
	Amount float64 `json:"amount"`
}

// PaymentReceipt is the receipt response for a completed payment.
type PaymentReceipt struct {
	ReceiptNumber string     `json:"receiptNumber"`
	TicketNumber  string     `json:"ticketNumber"`
	VehicleReg    string     `json:"vehicleReg"`
	PayerName     string     `json:"payerName"`
	Amount        float64    `json:"amount"`
	Method        string     `json:"method"`
	TransactionID *string    `json:"transactionId,omitempty"`
	PaidAt        *time.Time `json:"paidAt"`
	ProcessedBy   *string    `json:"processedBy,omitempty"`
	StationName   string     `json:"stationName"`
}

// Valid payment methods.
var PaymentMethods = []string{"momo", "vodacash", "airteltigo", "bank", "card", "cash"}

// Valid payment statuses.
var PaymentStatuses = []string{"pending", "processing", "completed", "failed", "refunded"}
