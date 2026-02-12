package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/google/uuid"
)

type OffenceService interface {
	List(ctx context.Context, category *string, isActive *bool, search string) ([]models.Offence, error)
	Get(ctx context.Context, id uuid.UUID) (*models.Offence, error)
	Create(ctx context.Context, req *CreateOffenceRequest) (*models.Offence, error)
	Update(ctx context.Context, id uuid.UUID, req *UpdateOffenceRequest) (*models.Offence, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Toggle(ctx context.Context, id uuid.UUID) (*models.Offence, error)
}

type CreateOffenceRequest struct {
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	LegalBasis  *string `json:"legalBasis"`
	Category    string  `json:"category"`
	DefaultFine float64 `json:"defaultFine"`
	MinFine     float64 `json:"minFine"`
	MaxFine     float64 `json:"maxFine"`
	Points      *int    `json:"points"`
}

type UpdateOffenceRequest struct {
	Code        *string  `json:"code"`
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	LegalBasis  *string  `json:"legalBasis"`
	Category    *string  `json:"category"`
	DefaultFine *float64 `json:"defaultFine"`
	MinFine     *float64 `json:"minFine"`
	MaxFine     *float64 `json:"maxFine"`
	Points      *int     `json:"points"`
}
