package services

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type TicketService interface {
	Create(ctx context.Context, req *CreateTicketRequest) (*CreateTicketResult, error)
	GetByID(ctx context.Context, ticketID uuid.UUID) (*models.TicketResponse, error)
	GetByNumber(ctx context.Context, ticketNumber string) (*models.TicketResponse, error)
	List(ctx context.Context, filter models.TicketFilter, search string, p pagination.Params) ([]models.TicketListItem, int, error)
	Search(ctx context.Context, query string) ([]models.TicketListItem, error)
	Update(ctx context.Context, ticketID uuid.UUID, req *UpdateTicketRequest) (*models.TicketResponse, error)
	Void(ctx context.Context, ticketID uuid.UUID, reason string) (*models.TicketResponse, error)
	Stats(ctx context.Context, filter models.TicketFilter) (*models.TicketStats, error)
	UploadPhoto(ctx context.Context, ticketID uuid.UUID, photoType string, fileData []byte, filename, mimeType string) (*PhotoUploadResult, error)
}

type CreateTicketRequest struct {
	Vehicle         models.VehicleInfo `json:"vehicle"`
	Driver          models.DriverInfo  `json:"driver"`
	Offences        []OffenceInput     `json:"offences"`
	Location        models.GeoLocation `json:"location"`
	Notes           *string            `json:"notes,omitempty"`
	ClientCreatedID *uuid.UUID         `json:"clientCreatedId,omitempty"`
	IssuedAt        *time.Time         `json:"issuedAt,omitempty"`
}

type OffenceInput struct {
	ID        uuid.UUID `json:"id"`
	Notes     *string   `json:"notes,omitempty"`
	CustomFine *float64 `json:"customFine,omitempty"`
}

type CreateTicketResult struct {
	Ticket *models.TicketResponse `json:"ticket"`
	PrintData *PrintData          `json:"printData,omitempty"`
}

type PrintData struct {
	PaymentReference    string `json:"paymentReference"`
	PaymentInstructions string `json:"paymentInstructions"`
}

type UpdateTicketRequest struct {
	Status   *string        `json:"status,omitempty"`
	Notes    *string        `json:"notes,omitempty"`
	Offences []OffenceInput `json:"offences,omitempty"`
}

type PhotoUploadResult struct {
	PhotoID      uuid.UUID `json:"photoId"`
	URL          string    `json:"url"`
	ThumbnailURL string    `json:"thumbnailUrl"`
}
