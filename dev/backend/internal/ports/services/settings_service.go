package services

import (
	"context"
	"encoding/json"
)

type SettingsService interface {
	GetAll(ctx context.Context) (map[string]json.RawMessage, error)
	GetBySection(ctx context.Context, section string) (json.RawMessage, error)
	UpdateAll(ctx context.Context, settings map[string]json.RawMessage) (map[string]json.RawMessage, error)
	UpdateSection(ctx context.Context, section string, value json.RawMessage) (json.RawMessage, error)
}
