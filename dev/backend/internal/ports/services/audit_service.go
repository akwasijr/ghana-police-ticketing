package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type AuditService interface {
	// Log creates a new audit entry (used by middleware and explicit calls).
	Log(ctx context.Context, entry *AuditEntry)
	GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error)
	List(ctx context.Context, filter models.AuditFilter, search string, p pagination.Params) ([]models.AuditLog, int, error)
	Stats(ctx context.Context, filter models.AuditFilter) (*models.AuditStats, error)
}

// AuditEntry is the input for creating an audit log.
type AuditEntry struct {
	UserID      *uuid.UUID
	UserName    string
	UserRole    string
	UserBadge   string
	Action      string
	EntityType  string
	EntityID    string
	EntityName  string
	Description string
	Severity    string
	Success     bool
	ErrorMsg    string
	IPAddress   string
	UserAgent   string
	StationID   *uuid.UUID
	StationName string
	RegionID    *uuid.UUID
	RegionName  string
}
