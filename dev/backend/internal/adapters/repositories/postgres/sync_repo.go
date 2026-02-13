package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type syncRepo struct {
	db *pgxpool.Pool
}

func NewSyncRepo(db *pgxpool.Pool) repositories.SyncRepository {
	return &syncRepo{db: db}
}

func (r *syncRepo) UpsertDeviceSync(ctx context.Context, userID uuid.UUID, deviceID string, syncTimestamp time.Time, itemsSynced int) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO device_syncs (user_id, device_id, last_sync_timestamp, items_synced)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (user_id, device_id)
		 DO UPDATE SET last_sync_timestamp = $3, items_synced = device_syncs.items_synced + $4, updated_at = NOW()`,
		userID, deviceID, syncTimestamp, itemsSynced)
	return err
}

func (r *syncRepo) GetDeviceSync(ctx context.Context, userID uuid.UUID, deviceID string) (*models.DeviceSync, error) {
	var ds models.DeviceSync
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, device_id, last_sync_timestamp, items_synced, created_at, updated_at
		 FROM device_syncs WHERE user_id = $1 AND device_id = $2`,
		userID, deviceID).Scan(
		&ds.ID, &ds.UserID, &ds.DeviceID, &ds.LastSyncTimestamp,
		&ds.ItemsSynced, &ds.CreatedAt, &ds.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &ds, nil
}

// ---------------------------------------------------------------------------
// Server updates — tickets modified since a given timestamp
// ---------------------------------------------------------------------------

func (r *syncRepo) GetTicketsUpdatedSince(ctx context.Context, since time.Time, stationID *uuid.UUID, regionID *uuid.UUID, limit int) ([]models.ServerTicketUpdate, error) {
	conditions := "t.updated_at > $1"
	args := []any{since}
	argIdx := 2

	if stationID != nil {
		conditions += fmt.Sprintf(" AND t.station_id = $%d", argIdx)
		args = append(args, *stationID)
		argIdx++
	}
	if regionID != nil {
		conditions += fmt.Sprintf(" AND t.region_id = $%d", argIdx)
		args = append(args, *regionID)
		argIdx++
	}

	query := fmt.Sprintf(
		`SELECT t.id, t.status, t.total_fine, t.paid_at, t.paid_amount, t.paid_method, t.voided_at, t.void_reason, t.updated_at
		 FROM tickets t WHERE %s ORDER BY t.updated_at ASC LIMIT $%d`,
		conditions, argIdx)
	args = append(args, limit)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var updates []models.ServerTicketUpdate
	for rows.Next() {
		var (
			id         uuid.UUID
			status     string
			totalFine  float64
			paidAt     *time.Time
			paidAmount *float64
			paidMethod *string
			voidedAt   *time.Time
			voidReason *string
			updatedAt  time.Time
		)
		if err := rows.Scan(&id, &status, &totalFine, &paidAt, &paidAmount, &paidMethod, &voidedAt, &voidReason, &updatedAt); err != nil {
			return nil, err
		}

		data := map[string]any{
			"status":    status,
			"totalFine": totalFine,
			"updatedAt": updatedAt,
		}
		if paidAt != nil {
			data["paidAt"] = paidAt
		}
		if paidAmount != nil {
			data["paidAmount"] = paidAmount
		}
		if paidMethod != nil {
			data["paidMethod"] = paidMethod
		}
		if voidedAt != nil {
			data["voidedAt"] = voidedAt
		}
		if voidReason != nil {
			data["voidReason"] = voidReason
		}

		action := "update"
		if status == "cancelled" {
			action = "delete"
		}

		updates = append(updates, models.ServerTicketUpdate{
			ID:     id,
			Action: action,
			Data:   data,
		})
	}

	if updates == nil {
		updates = []models.ServerTicketUpdate{}
	}
	return updates, rows.Err()
}

func (r *syncRepo) CountTicketsUpdatedSince(ctx context.Context, since time.Time, stationID *uuid.UUID, regionID *uuid.UUID) (int, error) {
	conditions := "updated_at > $1"
	args := []any{since}
	argIdx := 2

	if stationID != nil {
		conditions += fmt.Sprintf(" AND station_id = $%d", argIdx)
		args = append(args, *stationID)
		argIdx++
	}
	if regionID != nil {
		conditions += fmt.Sprintf(" AND region_id = $%d", argIdx)
		args = append(args, *regionID)
		argIdx++
	}

	var count int
	err := r.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM tickets WHERE %s", conditions), args...).Scan(&count)
	return count, err
}
