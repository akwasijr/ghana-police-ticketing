package services

import (
	"context"
	"time"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"go.uber.org/zap"
)

type lookupService struct {
	repo   repositories.LookupRepository
	logger *zap.Logger
}

func NewLookupService(repo repositories.LookupRepository, logger *zap.Logger) portservices.LookupService {
	return &lookupService{repo: repo, logger: logger}
}

func (s *lookupService) GetLookupData(ctx context.Context, ifModifiedSince *time.Time) (*models.LookupData, bool, error) {
	// If client sent If-Modified-Since, check whether anything changed
	if ifModifiedSince != nil {
		lastUpdated, err := s.repo.GetLastUpdated(ctx)
		if err != nil {
			return nil, false, apperrors.NewInternal(err)
		}
		if !lastUpdated.After(*ifModifiedSince) {
			return nil, false, nil // not modified
		}
	}

	data, err := s.repo.GetLookupData(ctx)
	if err != nil {
		return nil, false, apperrors.NewInternal(err)
	}
	return data, true, nil
}
