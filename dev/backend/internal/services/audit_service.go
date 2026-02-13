package services

import (
	"context"
	"errors"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

type auditService struct {
	repo   repositories.AuditRepository
	logger *zap.Logger
}

func NewAuditService(repo repositories.AuditRepository, logger *zap.Logger) portservices.AuditService {
	return &auditService{repo: repo, logger: logger}
}

// Log creates an audit entry asynchronously (fire-and-forget).
func (s *auditService) Log(ctx context.Context, entry *portservices.AuditEntry) {
	if entry == nil {
		return
	}

	severity := entry.Severity
	if severity == "" {
		severity = "info"
	}

	log := &models.AuditLog{
		UserID:   entry.UserID,
		UserName: entry.UserName,
		UserRole: entry.UserRole,
		Action:      entry.Action,
		EntityType:  entry.EntityType,
		Description: entry.Description,
		Severity:    severity,
		Success:     entry.Success,
	}

	if entry.UserBadge != "" {
		log.UserBadgeNumber = &entry.UserBadge
	}
	if entry.EntityID != "" {
		log.EntityID = &entry.EntityID
	}
	if entry.EntityName != "" {
		log.EntityName = &entry.EntityName
	}
	if entry.ErrorMsg != "" {
		log.ErrorMessage = &entry.ErrorMsg
	}
	if entry.IPAddress != "" {
		log.IPAddress = &entry.IPAddress
	}
	if entry.UserAgent != "" {
		log.UserAgent = &entry.UserAgent
	}
	if entry.StationID != nil {
		log.StationID = entry.StationID
	}
	if entry.StationName != "" {
		log.StationName = &entry.StationName
	}
	if entry.RegionID != nil {
		log.RegionID = entry.RegionID
	}
	if entry.RegionName != "" {
		log.RegionName = &entry.RegionName
	}

	if err := s.repo.Create(ctx, log); err != nil {
		s.logger.Error("failed to write audit log", zap.Error(err), zap.String("action", entry.Action))
	}
}

func (s *auditService) GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	entry, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Audit log entry")
		}
		return nil, apperrors.NewInternal(err)
	}
	return entry, nil
}

func (s *auditService) List(ctx context.Context, filter models.AuditFilter, search string, p pagination.Params) ([]models.AuditLog, int, error) {
	return s.repo.List(ctx, filter, search, p)
}

func (s *auditService) Stats(ctx context.Context, filter models.AuditFilter) (*models.AuditStats, error) {
	return s.repo.GetStats(ctx, filter)
}
