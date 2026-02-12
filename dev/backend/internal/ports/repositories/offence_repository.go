package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/google/uuid"
)

type OffenceRepository interface {
	List(ctx context.Context, category *string, isActive *bool, search string) ([]models.Offence, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Offence, error)
	Create(ctx context.Context, offence *models.Offence) error
	Update(ctx context.Context, offence *models.Offence) error
	Deactivate(ctx context.Context, id uuid.UUID) error
	SetActive(ctx context.Context, id uuid.UUID, active bool) (*models.Offence, error)
	CodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error)
	IsReferencedByTickets(ctx context.Context, offenceID uuid.UUID) (bool, error)
	HasActiveTickets(ctx context.Context, offenceID uuid.UUID) (bool, error)
}
