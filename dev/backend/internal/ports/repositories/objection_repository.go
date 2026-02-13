package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type ObjectionRepository interface {
	Create(ctx context.Context, o *models.Objection) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.ObjectionResponse, error)
	List(ctx context.Context, filter models.ObjectionFilter, search string, p pagination.Params) ([]models.ObjectionResponse, int, error)
	Review(ctx context.Context, id uuid.UUID, status string, reviewedByID uuid.UUID, reviewNotes string, adjustedFine *float64) error
	GetStats(ctx context.Context, filter models.ObjectionFilter) (*models.ObjectionStats, error)
	HasActiveObjection(ctx context.Context, ticketID uuid.UUID) (bool, error)
	GetAttachments(ctx context.Context, objectionID uuid.UUID) ([]models.ObjectionAttachment, error)
}
