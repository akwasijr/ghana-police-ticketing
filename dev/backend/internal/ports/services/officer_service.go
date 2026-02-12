package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type OfficerService interface {
	List(ctx context.Context, filter models.OfficerFilter, search string, p pagination.Params) ([]models.OfficerResponse, int, error)
	Get(ctx context.Context, officerID uuid.UUID) (*models.OfficerResponse, error)
	Create(ctx context.Context, req *CreateOfficerRequest) (*CreateOfficerResult, error)
	Update(ctx context.Context, officerID uuid.UUID, req *UpdateOfficerRequest) (*models.OfficerResponse, error)
	Delete(ctx context.Context, officerID uuid.UUID) error
	GetStats(ctx context.Context, officerID uuid.UUID) (*models.OfficerStats, error)
	ResetPassword(ctx context.Context, officerID uuid.UUID) (*ResetPasswordResult, error)
}

type CreateOfficerRequest struct {
	FirstName   string     `json:"firstName"`
	LastName    string     `json:"lastName"`
	Email       *string    `json:"email"`
	Phone       string     `json:"phone"`
	BadgeNumber string     `json:"badgeNumber"`
	Rank        string     `json:"rank"`
	StationID   uuid.UUID  `json:"stationId"`
	Role        *string    `json:"role"`
	Password    *string    `json:"password"`
}

type CreateOfficerResult struct {
	Officer           *models.OfficerResponse `json:"officer"`
	TemporaryPassword *string                 `json:"temporaryPassword,omitempty"`
}

type UpdateOfficerRequest struct {
	FirstName        *string    `json:"firstName"`
	LastName         *string    `json:"lastName"`
	Email            *string    `json:"email"`
	Phone            *string    `json:"phone"`
	Rank             *string    `json:"rank"`
	StationID        *uuid.UUID `json:"stationId"`
	Role             *string    `json:"role"`
	IsActive         *bool      `json:"isActive"`
	AssignedDeviceID *string    `json:"assignedDeviceId"`
}

type ResetPasswordResult struct {
	TemporaryPassword string `json:"temporaryPassword"`
	Message           string `json:"message"`
}
