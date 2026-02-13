package repositories

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
)

type LookupRepository interface {
	// GetLookupData returns all active reference data for offline caching.
	GetLookupData(ctx context.Context) (*models.LookupData, error)

	// GetLastUpdated returns the most recent updated_at across all lookup entities.
	GetLastUpdated(ctx context.Context) (time.Time, error)
}
