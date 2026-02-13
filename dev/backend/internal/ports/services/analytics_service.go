package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
)

type AnalyticsService interface {
	Summary(ctx context.Context, f models.AnalyticsFilter) (*models.AnalyticsSummary, error)
	Trends(ctx context.Context, f models.AnalyticsFilter, groupBy string) ([]models.TrendPoint, error)
	TopOffences(ctx context.Context, f models.AnalyticsFilter, limit int) ([]models.TopOffence, error)
	ByRegion(ctx context.Context, f models.AnalyticsFilter) ([]models.RegionAnalytics, error)
	Revenue(ctx context.Context, f models.AnalyticsFilter, groupBy string) (*models.RevenueReport, error)
	OfficerPerformance(ctx context.Context, f models.AnalyticsFilter, limit int) ([]models.OfficerPerformance, error)
}
