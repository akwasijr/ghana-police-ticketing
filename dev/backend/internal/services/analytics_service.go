package services

import (
	"context"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"go.uber.org/zap"
)

type analyticsService struct {
	repo   repositories.AnalyticsRepository
	logger *zap.Logger
}

func NewAnalyticsService(repo repositories.AnalyticsRepository, logger *zap.Logger) portservices.AnalyticsService {
	return &analyticsService{repo: repo, logger: logger}
}

func validateFilter(f models.AnalyticsFilter) error {
	if f.StartDate == "" || f.EndDate == "" {
		return apperrors.NewValidationError("startDate and endDate are required", nil)
	}
	return nil
}

func (s *analyticsService) Summary(ctx context.Context, f models.AnalyticsFilter) (*models.AnalyticsSummary, error) {
	if err := validateFilter(f); err != nil {
		return nil, err
	}
	result, err := s.repo.Summary(ctx, f)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return result, nil
}

func (s *analyticsService) Trends(ctx context.Context, f models.AnalyticsFilter, groupBy string) ([]models.TrendPoint, error) {
	if err := validateFilter(f); err != nil {
		return nil, err
	}
	if groupBy == "" {
		groupBy = "day"
	}
	result, err := s.repo.Trends(ctx, f, groupBy)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return result, nil
}

func (s *analyticsService) TopOffences(ctx context.Context, f models.AnalyticsFilter, limit int) ([]models.TopOffence, error) {
	if err := validateFilter(f); err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 50 {
		limit = 10
	}
	result, err := s.repo.TopOffences(ctx, f, limit)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return result, nil
}

func (s *analyticsService) ByRegion(ctx context.Context, f models.AnalyticsFilter) ([]models.RegionAnalytics, error) {
	if err := validateFilter(f); err != nil {
		return nil, err
	}
	result, err := s.repo.ByRegion(ctx, f)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return result, nil
}

func (s *analyticsService) Revenue(ctx context.Context, f models.AnalyticsFilter, groupBy string) (*models.RevenueReport, error) {
	if err := validateFilter(f); err != nil {
		return nil, err
	}
	if groupBy == "" {
		groupBy = "day"
	}
	result, err := s.repo.Revenue(ctx, f, groupBy)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return result, nil
}

func (s *analyticsService) OfficerPerformance(ctx context.Context, f models.AnalyticsFilter, limit int) ([]models.OfficerPerformance, error) {
	if err := validateFilter(f); err != nil {
		return nil, err
	}
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	result, err := s.repo.OfficerPerformance(ctx, f, limit)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return result, nil
}
