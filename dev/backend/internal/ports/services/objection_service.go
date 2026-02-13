package services

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type ObjectionService interface {
	File(ctx context.Context, req *FileObjectionRequest) (*FileObjectionResult, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.ObjectionResponse, error)
	List(ctx context.Context, filter models.ObjectionFilter, search string, p pagination.Params) ([]models.ObjectionResponse, int, error)
	Review(ctx context.Context, id uuid.UUID, req *ReviewObjectionRequest) (*models.ObjectionResponse, error)
	Stats(ctx context.Context, filter models.ObjectionFilter) (*models.ObjectionStats, error)
}

type FileObjectionRequest struct {
	TicketID     uuid.UUID `json:"ticketId"`
	Reason       string    `json:"reason"`
	Details      *string   `json:"details,omitempty"`
	ContactPhone string    `json:"contactPhone"`
	ContactEmail *string   `json:"contactEmail,omitempty"`
}

type FileObjectionResult struct {
	ObjectionID    uuid.UUID `json:"objectionId"`
	TicketNumber   string    `json:"ticketNumber"`
	Status         string    `json:"status"`
	FiledAt        time.Time `json:"filedAt"`
	ReviewDeadline time.Time `json:"reviewDeadline"`
}

type ReviewObjectionRequest struct {
	Decision    string   `json:"decision"`
	ReviewNotes string   `json:"reviewNotes"`
	AdjustedFine *float64 `json:"adjustedFine,omitempty"`
}
