package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type OfficerRepository interface {
	List(ctx context.Context, filter models.OfficerFilter, search string, p pagination.Params) ([]models.OfficerResponse, int, error)
	GetByID(ctx context.Context, officerID uuid.UUID) (*models.OfficerResponse, error)
	Create(ctx context.Context, user *models.User, officer *models.Officer) error
	Update(ctx context.Context, user *models.User, officer *models.Officer) error
	Deactivate(ctx context.Context, officerID uuid.UUID) error
	GetStats(ctx context.Context, officerID uuid.UUID) (*models.OfficerStats, error)
	BadgeNumberExists(ctx context.Context, badge string, excludeOfficerID *uuid.UUID) (bool, error)
	EmailExists(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error)
	GetUserIDByOfficerID(ctx context.Context, officerID uuid.UUID) (uuid.UUID, error)
}
