package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type HierarchyService interface {
	// Regions
	ListRegions(ctx context.Context) ([]models.Region, error)
	GetRegion(ctx context.Context, id uuid.UUID) (*models.Region, error)
	CreateRegion(ctx context.Context, req *CreateRegionRequest) (*models.Region, error)
	UpdateRegion(ctx context.Context, id uuid.UUID, req *UpdateRegionRequest) (*models.Region, error)
	DeleteRegion(ctx context.Context, id uuid.UUID) error

	// Divisions
	ListDivisions(ctx context.Context, regionID *uuid.UUID) ([]models.Division, error)
	GetDivision(ctx context.Context, id uuid.UUID) (*models.Division, error)
	CreateDivision(ctx context.Context, req *CreateDivisionRequest) (*models.Division, error)
	UpdateDivision(ctx context.Context, id uuid.UUID, req *UpdateDivisionRequest) (*models.Division, error)
	DeleteDivision(ctx context.Context, id uuid.UUID) error

	// Districts
	ListDistricts(ctx context.Context, divisionID *uuid.UUID, regionID *uuid.UUID) ([]models.District, error)
	GetDistrict(ctx context.Context, id uuid.UUID) (*models.District, error)
	CreateDistrict(ctx context.Context, req *CreateDistrictRequest) (*models.District, error)
	UpdateDistrict(ctx context.Context, id uuid.UUID, req *UpdateDistrictRequest) (*models.District, error)
	DeleteDistrict(ctx context.Context, id uuid.UUID) error

	// Stations
	ListStations(ctx context.Context, filter models.StationFilter, search string, p pagination.Params) ([]models.Station, int, error)
	GetStation(ctx context.Context, id uuid.UUID) (*models.Station, error)
	CreateStation(ctx context.Context, req *CreateStationRequest) (*models.Station, error)
	UpdateStation(ctx context.Context, id uuid.UUID, req *UpdateStationRequest) (*models.Station, error)
	DeleteStation(ctx context.Context, id uuid.UUID) error
	GetStationStats(ctx context.Context) (*models.StationStats, error)
}

// Region request types

type CreateRegionRequest struct {
	Name    string  `json:"name"`
	Code    string  `json:"code"`
	Capital *string `json:"capital"`
}

type UpdateRegionRequest struct {
	Name     *string `json:"name"`
	Code     *string `json:"code"`
	Capital  *string `json:"capital"`
	IsActive *bool   `json:"isActive"`
}

// Division request types

type CreateDivisionRequest struct {
	Name     string    `json:"name"`
	Code     string    `json:"code"`
	RegionID uuid.UUID `json:"regionId"`
}

type UpdateDivisionRequest struct {
	Name     *string    `json:"name"`
	Code     *string    `json:"code"`
	RegionID *uuid.UUID `json:"regionId"`
	IsActive *bool      `json:"isActive"`
}

// District request types

type CreateDistrictRequest struct {
	Name       string    `json:"name"`
	Code       string    `json:"code"`
	DivisionID uuid.UUID `json:"divisionId"`
}

type UpdateDistrictRequest struct {
	Name       *string    `json:"name"`
	Code       *string    `json:"code"`
	DivisionID *uuid.UUID `json:"divisionId"`
	IsActive   *bool      `json:"isActive"`
}

// Station request types

type CreateStationRequest struct {
	Name       string    `json:"name"`
	Code       string    `json:"code"`
	DistrictID uuid.UUID `json:"districtId"`
	Address    *string   `json:"address"`
	Phone      *string   `json:"phone"`
	Email      *string   `json:"email"`
	Latitude   *float64  `json:"latitude"`
	Longitude  *float64  `json:"longitude"`
	Type       *string   `json:"type"`
}

type UpdateStationRequest struct {
	Name       *string    `json:"name"`
	Code       *string    `json:"code"`
	DistrictID *uuid.UUID `json:"districtId"`
	Address    *string    `json:"address"`
	Phone      *string    `json:"phone"`
	Email      *string    `json:"email"`
	Latitude   *float64   `json:"latitude"`
	Longitude  *float64   `json:"longitude"`
	Type       *string    `json:"type"`
	IsActive   *bool      `json:"isActive"`
}
