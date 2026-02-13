package services

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
)

type LookupService interface {
	// GetLookupData returns all active reference data. Returns nil if not modified since ifModifiedSince.
	GetLookupData(ctx context.Context, ifModifiedSince *time.Time) (*models.LookupData, bool, error)
}
