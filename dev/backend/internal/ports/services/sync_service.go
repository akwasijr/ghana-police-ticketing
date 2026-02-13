package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
)

type SyncService interface {
	// BatchSync processes a batch of offline-created/updated tickets and photos.
	BatchSync(ctx context.Context, req *models.SyncRequest, deviceID string) (*models.SyncResponse, error)

	// GetStatus returns the sync status for a user's device.
	GetStatus(ctx context.Context, deviceID string) (*models.SyncStatus, error)
}
