package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
)

type HierarchyRepository interface {
	// Regions
	ListRegions(ctx context.Context) ([]models.Region, error)
	GetRegionByID(ctx context.Context, id uuid.UUID) (*models.Region, error)
	CreateRegion(ctx context.Context, region *models.Region) error
	UpdateRegion(ctx context.Context, region *models.Region) error
	DeactivateRegion(ctx context.Context, id uuid.UUID) error
	HasActiveDivisions(ctx context.Context, regionID uuid.UUID) (bool, error)
	RegionCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error)

	// Divisions
	ListDivisions(ctx context.Context, regionID *uuid.UUID) ([]models.Division, error)
	GetDivisionByID(ctx context.Context, id uuid.UUID) (*models.Division, error)
	CreateDivision(ctx context.Context, division *models.Division) error
	UpdateDivision(ctx context.Context, division *models.Division) error
	DeactivateDivision(ctx context.Context, id uuid.UUID) error
	HasActiveDistricts(ctx context.Context, divisionID uuid.UUID) (bool, error)
	DivisionCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error)

	// Districts
	ListDistricts(ctx context.Context, divisionID *uuid.UUID, regionID *uuid.UUID) ([]models.District, error)
	GetDistrictByID(ctx context.Context, id uuid.UUID) (*models.District, error)
	CreateDistrict(ctx context.Context, district *models.District) error
	UpdateDistrict(ctx context.Context, district *models.District) error
	DeactivateDistrict(ctx context.Context, id uuid.UUID) error
	HasActiveStations(ctx context.Context, districtID uuid.UUID) (bool, error)
	DistrictCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error)

	// Stations
	ListStations(ctx context.Context, filter models.StationFilter, search string, p pagination.Params) ([]models.Station, int, error)
	GetStationByID(ctx context.Context, id uuid.UUID) (*models.Station, error)
	CreateStation(ctx context.Context, station *models.Station) error
	UpdateStation(ctx context.Context, station *models.Station) error
	DeactivateStation(ctx context.Context, id uuid.UUID) error
	HasActiveOfficers(ctx context.Context, stationID uuid.UUID) (bool, error)
	StationCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error)
	GetStationStats(ctx context.Context) (*models.StationStats, error)
}
