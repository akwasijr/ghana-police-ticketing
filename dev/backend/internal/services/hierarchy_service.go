package services

import (
	"context"
	"errors"
	"regexp"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

var regionCodePattern = regexp.MustCompile(`^[A-Z]{2,3}$`)

type hierarchyService struct {
	repo   repositories.HierarchyRepository
	logger *zap.Logger
}

func NewHierarchyService(repo repositories.HierarchyRepository, logger *zap.Logger) portservices.HierarchyService {
	return &hierarchyService{repo: repo, logger: logger}
}

// ============================================================
// REGIONS
// ============================================================

func (s *hierarchyService) ListRegions(ctx context.Context) ([]models.Region, error) {
	return s.repo.ListRegions(ctx)
}

func (s *hierarchyService) GetRegion(ctx context.Context, id uuid.UUID) (*models.Region, error) {
	region, err := s.repo.GetRegionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Region")
		}
		return nil, apperrors.NewInternal(err)
	}
	return region, nil
}

func (s *hierarchyService) CreateRegion(ctx context.Context, req *portservices.CreateRegionRequest) (*models.Region, error) {
	if req.Name == "" || req.Code == "" {
		return nil, apperrors.NewValidationError("Name and code are required", nil)
	}
	if !regionCodePattern.MatchString(req.Code) {
		return nil, apperrors.NewValidationError("Code must be 2-3 uppercase letters", nil)
	}

	exists, err := s.repo.RegionCodeExists(ctx, req.Code, nil)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Region code already exists")
	}

	region := &models.Region{
		Name:    req.Name,
		Code:    req.Code,
		Capital: req.Capital,
	}
	if err := s.repo.CreateRegion(ctx, region); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return region, nil
}

func (s *hierarchyService) UpdateRegion(ctx context.Context, id uuid.UUID, req *portservices.UpdateRegionRequest) (*models.Region, error) {
	current, err := s.repo.GetRegionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Region")
		}
		return nil, apperrors.NewInternal(err)
	}

	if req.Name != nil {
		current.Name = *req.Name
	}
	if req.Code != nil {
		if !regionCodePattern.MatchString(*req.Code) {
			return nil, apperrors.NewValidationError("Code must be 2-3 uppercase letters", nil)
		}
		exists, err := s.repo.RegionCodeExists(ctx, *req.Code, &id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("Region code already exists")
		}
		current.Code = *req.Code
	}
	if req.Capital != nil {
		current.Capital = req.Capital
	}
	if req.IsActive != nil {
		current.IsActive = *req.IsActive
	}

	if err := s.repo.UpdateRegion(ctx, current); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return current, nil
}

func (s *hierarchyService) DeleteRegion(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetRegionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperrors.NewNotFound("Region")
		}
		return apperrors.NewInternal(err)
	}

	has, err := s.repo.HasActiveDivisions(ctx, id)
	if err != nil {
		return apperrors.NewInternal(err)
	}
	if has {
		return apperrors.NewConflict("Cannot deactivate region with active divisions")
	}

	return s.repo.DeactivateRegion(ctx, id)
}

// ============================================================
// DIVISIONS
// ============================================================

func (s *hierarchyService) ListDivisions(ctx context.Context, regionID *uuid.UUID) ([]models.Division, error) {
	return s.repo.ListDivisions(ctx, regionID)
}

func (s *hierarchyService) GetDivision(ctx context.Context, id uuid.UUID) (*models.Division, error) {
	div, err := s.repo.GetDivisionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Division")
		}
		return nil, apperrors.NewInternal(err)
	}
	return div, nil
}

func (s *hierarchyService) CreateDivision(ctx context.Context, req *portservices.CreateDivisionRequest) (*models.Division, error) {
	if req.Name == "" || req.Code == "" {
		return nil, apperrors.NewValidationError("Name and code are required", nil)
	}

	// Verify region exists
	_, err := s.repo.GetRegionByID(ctx, req.RegionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewValidationError("Region not found", nil)
		}
		return nil, apperrors.NewInternal(err)
	}

	exists, err := s.repo.DivisionCodeExists(ctx, req.Code, nil)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Division code already exists")
	}

	div := &models.Division{
		Name:     req.Name,
		Code:     req.Code,
		RegionID: req.RegionID,
	}
	if err := s.repo.CreateDivision(ctx, div); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Re-fetch with joined fields
	return s.repo.GetDivisionByID(ctx, div.ID)
}

func (s *hierarchyService) UpdateDivision(ctx context.Context, id uuid.UUID, req *portservices.UpdateDivisionRequest) (*models.Division, error) {
	current, err := s.repo.GetDivisionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Division")
		}
		return nil, apperrors.NewInternal(err)
	}

	if req.Name != nil {
		current.Name = *req.Name
	}
	if req.Code != nil {
		exists, err := s.repo.DivisionCodeExists(ctx, *req.Code, &id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("Division code already exists")
		}
		current.Code = *req.Code
	}
	if req.RegionID != nil {
		// Verify new region exists
		_, err := s.repo.GetRegionByID(ctx, *req.RegionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, apperrors.NewValidationError("Region not found", nil)
			}
			return nil, apperrors.NewInternal(err)
		}
		current.RegionID = *req.RegionID
	}
	if req.IsActive != nil {
		current.IsActive = *req.IsActive
	}

	if err := s.repo.UpdateDivision(ctx, current); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return s.repo.GetDivisionByID(ctx, id)
}

func (s *hierarchyService) DeleteDivision(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetDivisionByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperrors.NewNotFound("Division")
		}
		return apperrors.NewInternal(err)
	}

	has, err := s.repo.HasActiveDistricts(ctx, id)
	if err != nil {
		return apperrors.NewInternal(err)
	}
	if has {
		return apperrors.NewConflict("Cannot deactivate division with active districts")
	}

	return s.repo.DeactivateDivision(ctx, id)
}

// ============================================================
// DISTRICTS
// ============================================================

func (s *hierarchyService) ListDistricts(ctx context.Context, divisionID *uuid.UUID, regionID *uuid.UUID) ([]models.District, error) {
	return s.repo.ListDistricts(ctx, divisionID, regionID)
}

func (s *hierarchyService) GetDistrict(ctx context.Context, id uuid.UUID) (*models.District, error) {
	dist, err := s.repo.GetDistrictByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("District")
		}
		return nil, apperrors.NewInternal(err)
	}
	return dist, nil
}

func (s *hierarchyService) CreateDistrict(ctx context.Context, req *portservices.CreateDistrictRequest) (*models.District, error) {
	if req.Name == "" || req.Code == "" {
		return nil, apperrors.NewValidationError("Name and code are required", nil)
	}

	// Look up division to auto-derive regionID
	div, err := s.repo.GetDivisionByID(ctx, req.DivisionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewValidationError("Division not found", nil)
		}
		return nil, apperrors.NewInternal(err)
	}

	exists, err := s.repo.DistrictCodeExists(ctx, req.Code, nil)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("District code already exists")
	}

	district := &models.District{
		Name:       req.Name,
		Code:       req.Code,
		DivisionID: req.DivisionID,
		RegionID:   div.RegionID, // auto-derived
	}
	if err := s.repo.CreateDistrict(ctx, district); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return s.repo.GetDistrictByID(ctx, district.ID)
}

func (s *hierarchyService) UpdateDistrict(ctx context.Context, id uuid.UUID, req *portservices.UpdateDistrictRequest) (*models.District, error) {
	current, err := s.repo.GetDistrictByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("District")
		}
		return nil, apperrors.NewInternal(err)
	}

	if req.Name != nil {
		current.Name = *req.Name
	}
	if req.Code != nil {
		exists, err := s.repo.DistrictCodeExists(ctx, *req.Code, &id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("District code already exists")
		}
		current.Code = *req.Code
	}
	if req.DivisionID != nil {
		// Re-derive regionID from new division
		div, err := s.repo.GetDivisionByID(ctx, *req.DivisionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, apperrors.NewValidationError("Division not found", nil)
			}
			return nil, apperrors.NewInternal(err)
		}
		current.DivisionID = *req.DivisionID
		current.RegionID = div.RegionID
	}
	if req.IsActive != nil {
		current.IsActive = *req.IsActive
	}

	if err := s.repo.UpdateDistrict(ctx, current); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return s.repo.GetDistrictByID(ctx, id)
}

func (s *hierarchyService) DeleteDistrict(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetDistrictByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperrors.NewNotFound("District")
		}
		return apperrors.NewInternal(err)
	}

	has, err := s.repo.HasActiveStations(ctx, id)
	if err != nil {
		return apperrors.NewInternal(err)
	}
	if has {
		return apperrors.NewConflict("Cannot deactivate district with active stations")
	}

	return s.repo.DeactivateDistrict(ctx, id)
}

// ============================================================
// STATIONS
// ============================================================

func (s *hierarchyService) ListStations(ctx context.Context, filter models.StationFilter, search string, p pagination.Params) ([]models.Station, int, error) {
	return s.repo.ListStations(ctx, filter, search, p)
}

func (s *hierarchyService) GetStation(ctx context.Context, id uuid.UUID) (*models.Station, error) {
	station, err := s.repo.GetStationByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Station")
		}
		return nil, apperrors.NewInternal(err)
	}
	return station, nil
}

func (s *hierarchyService) CreateStation(ctx context.Context, req *portservices.CreateStationRequest) (*models.Station, error) {
	if req.Name == "" || req.Code == "" {
		return nil, apperrors.NewValidationError("Name and code are required", nil)
	}

	// Look up district to auto-derive divisionID and regionID
	dist, err := s.repo.GetDistrictByID(ctx, req.DistrictID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewValidationError("District not found", nil)
		}
		return nil, apperrors.NewInternal(err)
	}

	exists, err := s.repo.StationCodeExists(ctx, req.Code, nil)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Station code already exists")
	}

	stationType := "District"
	if req.Type != nil {
		stationType = *req.Type
	}

	station := &models.Station{
		Name:       req.Name,
		Code:       req.Code,
		DistrictID: req.DistrictID,
		DivisionID: dist.DivisionID, // auto-derived
		RegionID:   dist.RegionID,   // auto-derived
		Address:    req.Address,
		Phone:      req.Phone,
		Email:      req.Email,
		Latitude:   req.Latitude,
		Longitude:  req.Longitude,
		Type:       stationType,
	}
	if err := s.repo.CreateStation(ctx, station); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return s.repo.GetStationByID(ctx, station.ID)
}

func (s *hierarchyService) UpdateStation(ctx context.Context, id uuid.UUID, req *portservices.UpdateStationRequest) (*models.Station, error) {
	current, err := s.repo.GetStationByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Station")
		}
		return nil, apperrors.NewInternal(err)
	}

	if req.Name != nil {
		current.Name = *req.Name
	}
	if req.Code != nil {
		exists, err := s.repo.StationCodeExists(ctx, *req.Code, &id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("Station code already exists")
		}
		current.Code = *req.Code
	}
	if req.DistrictID != nil {
		// Re-derive divisionID and regionID from new district
		dist, err := s.repo.GetDistrictByID(ctx, *req.DistrictID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, apperrors.NewValidationError("District not found", nil)
			}
			return nil, apperrors.NewInternal(err)
		}
		current.DistrictID = *req.DistrictID
		current.DivisionID = dist.DivisionID
		current.RegionID = dist.RegionID
	}
	if req.Address != nil {
		current.Address = req.Address
	}
	if req.Phone != nil {
		current.Phone = req.Phone
	}
	if req.Email != nil {
		current.Email = req.Email
	}
	if req.Latitude != nil {
		current.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		current.Longitude = req.Longitude
	}
	if req.Type != nil {
		current.Type = *req.Type
	}
	if req.IsActive != nil {
		current.IsActive = *req.IsActive
	}

	if err := s.repo.UpdateStation(ctx, current); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return s.repo.GetStationByID(ctx, id)
}

func (s *hierarchyService) DeleteStation(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetStationByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperrors.NewNotFound("Station")
		}
		return apperrors.NewInternal(err)
	}

	has, err := s.repo.HasActiveOfficers(ctx, id)
	if err != nil {
		return apperrors.NewInternal(err)
	}
	if has {
		return apperrors.NewConflict("Cannot deactivate station with active officers")
	}

	return s.repo.DeactivateStation(ctx, id)
}

func (s *hierarchyService) GetStationStats(ctx context.Context) (*models.StationStats, error) {
	stats, err := s.repo.GetStationStats(ctx)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return stats, nil
}
