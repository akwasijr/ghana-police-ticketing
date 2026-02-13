package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type AuditRepository interface {
	Create(ctx context.Context, entry *models.AuditLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error)
	List(ctx context.Context, filter models.AuditFilter, search string, p pagination.Params) ([]models.AuditLog, int, error)
	GetStats(ctx context.Context, filter models.AuditFilter) (*models.AuditStats, error)
}
