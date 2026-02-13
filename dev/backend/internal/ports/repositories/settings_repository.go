package repositories

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
)

type SettingsRepository interface {
	// GetAll returns all settings sections as a map of section→JSONB value.
	GetAll(ctx context.Context) (map[string]json.RawMessage, error)

	// GetBySection returns the JSONB value for a single section.
	GetBySection(ctx context.Context, section string) (json.RawMessage, error)

	// Upsert inserts or updates a settings section.
	Upsert(ctx context.Context, section string, value json.RawMessage, updatedBy uuid.UUID) error
}
