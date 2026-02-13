package repositories

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/google/uuid"
)

type SyncRepository interface {
	// UpsertDeviceSync updates or inserts a device sync record.
	UpsertDeviceSync(ctx context.Context, userID uuid.UUID, deviceID string, syncTimestamp time.Time, itemsSynced int) error

	// GetDeviceSync returns the sync record for a user+device pair.
	GetDeviceSync(ctx context.Context, userID uuid.UUID, deviceID string) (*models.DeviceSync, error)

	// GetTicketsUpdatedSince returns tickets (for the user's jurisdiction) modified since the given timestamp.
	GetTicketsUpdatedSince(ctx context.Context, since time.Time, stationID *uuid.UUID, regionID *uuid.UUID, limit int) ([]models.ServerTicketUpdate, error)

	// CountTicketsUpdatedSince returns the count of tickets modified since the given timestamp.
	CountTicketsUpdatedSince(ctx context.Context, since time.Time, stationID *uuid.UUID, regionID *uuid.UUID) (int, error)
}
