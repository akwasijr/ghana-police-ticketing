package services

import (
	"context"
	"encoding/json"
	"slices"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"go.uber.org/zap"
)

type settingsService struct {
	repo   repositories.SettingsRepository
	logger *zap.Logger
}

func NewSettingsService(repo repositories.SettingsRepository, logger *zap.Logger) portservices.SettingsService {
	return &settingsService{repo: repo, logger: logger}
}

func (s *settingsService) GetAll(ctx context.Context) (map[string]json.RawMessage, error) {
	result, err := s.repo.GetAll(ctx)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	// Fill in defaults for any missing sections
	defaults := models.DefaultSettings()
	for _, section := range models.ValidSettingsSections {
		if _, ok := result[section]; !ok {
			result[section] = defaults[section]
		}
	}
	return result, nil
}

func (s *settingsService) GetBySection(ctx context.Context, section string) (json.RawMessage, error) {
	if !slices.Contains(models.ValidSettingsSections, section) {
		return nil, apperrors.NewValidationError("Invalid settings section: "+section, nil)
	}
	value, err := s.repo.GetBySection(ctx, section)
	if err != nil {
		// Return default if not found
		defaults := models.DefaultSettings()
		if v, ok := defaults[section]; ok {
			return v, nil
		}
		return nil, apperrors.NewInternal(err)
	}
	return value, nil
}

func (s *settingsService) UpdateAll(ctx context.Context, settings map[string]json.RawMessage) (map[string]json.RawMessage, error) {
	userID := middleware.GetUserID(ctx)
	for _, section := range models.ValidSettingsSections {
		value, ok := settings[section]
		if !ok {
			// Use default for missing sections
			defaults := models.DefaultSettings()
			value = defaults[section]
		}
		if err := s.repo.Upsert(ctx, section, value, userID); err != nil {
			return nil, apperrors.NewInternal(err)
		}
	}
	return s.repo.GetAll(ctx)
}

func (s *settingsService) UpdateSection(ctx context.Context, section string, value json.RawMessage) (json.RawMessage, error) {
	if !slices.Contains(models.ValidSettingsSections, section) {
		return nil, apperrors.NewValidationError("Invalid settings section: "+section, nil)
	}
	userID := middleware.GetUserID(ctx)
	if err := s.repo.Upsert(ctx, section, value, userID); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return s.repo.GetBySection(ctx, section)
}
