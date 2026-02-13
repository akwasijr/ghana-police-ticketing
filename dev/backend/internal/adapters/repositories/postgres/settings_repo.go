package postgres

import (
	"context"
	"encoding/json"

	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type settingsRepo struct {
	db *pgxpool.Pool
}

func NewSettingsRepo(db *pgxpool.Pool) repositories.SettingsRepository {
	return &settingsRepo{db: db}
}

func (r *settingsRepo) GetAll(ctx context.Context) (map[string]json.RawMessage, error) {
	rows, err := r.db.Query(ctx, `SELECT section, value FROM system_settings ORDER BY section`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]json.RawMessage)
	for rows.Next() {
		var section string
		var value json.RawMessage
		if err := rows.Scan(&section, &value); err != nil {
			return nil, err
		}
		result[section] = value
	}
	return result, rows.Err()
}

func (r *settingsRepo) GetBySection(ctx context.Context, section string) (json.RawMessage, error) {
	var value json.RawMessage
	err := r.db.QueryRow(ctx,
		`SELECT value FROM system_settings WHERE section = $1`, section).Scan(&value)
	return value, err
}

func (r *settingsRepo) Upsert(ctx context.Context, section string, value json.RawMessage, updatedBy uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO system_settings (section, value, updated_by)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (section) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
		section, value, updatedBy)
	return err
}
