package postgres

import (
	"context"
	"fmt"
	"strings"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type hierarchyRepo struct {
	db *pgxpool.Pool
}

func NewHierarchyRepo(db *pgxpool.Pool) repositories.HierarchyRepository {
	return &hierarchyRepo{db: db}
}

// ============================================================
// REGIONS
// ============================================================

func (r *hierarchyRepo) ListRegions(ctx context.Context) ([]models.Region, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, name, code, capital, is_active, created_at, updated_at FROM regions ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var regions []models.Region
	for rows.Next() {
		var reg models.Region
		if err := rows.Scan(&reg.ID, &reg.Name, &reg.Code, &reg.Capital, &reg.IsActive, &reg.CreatedAt, &reg.UpdatedAt); err != nil {
			return nil, err
		}
		regions = append(regions, reg)
	}
	return regions, rows.Err()
}

func (r *hierarchyRepo) GetRegionByID(ctx context.Context, id uuid.UUID) (*models.Region, error) {
	var reg models.Region
	err := r.db.QueryRow(ctx,
		`SELECT id, name, code, capital, is_active, created_at, updated_at FROM regions WHERE id = $1`, id).
		Scan(&reg.ID, &reg.Name, &reg.Code, &reg.Capital, &reg.IsActive, &reg.CreatedAt, &reg.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &reg, nil
}

func (r *hierarchyRepo) CreateRegion(ctx context.Context, region *models.Region) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO regions (name, code, capital) VALUES ($1, $2, $3)
		 RETURNING id, is_active, created_at, updated_at`,
		region.Name, region.Code, region.Capital).
		Scan(&region.ID, &region.IsActive, &region.CreatedAt, &region.UpdatedAt)
}

func (r *hierarchyRepo) UpdateRegion(ctx context.Context, region *models.Region) error {
	return r.db.QueryRow(ctx,
		`UPDATE regions SET name=$1, code=$2, capital=$3, is_active=$4, updated_at=NOW()
		 WHERE id=$5 RETURNING updated_at`,
		region.Name, region.Code, region.Capital, region.IsActive, region.ID).
		Scan(&region.UpdatedAt)
}

func (r *hierarchyRepo) DeactivateRegion(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE regions SET is_active=false, updated_at=NOW() WHERE id=$1`, id)
	return err
}

func (r *hierarchyRepo) HasActiveDivisions(ctx context.Context, regionID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM divisions WHERE region_id=$1 AND is_active=true)`, regionID).
		Scan(&exists)
	return exists, err
}

func (r *hierarchyRepo) RegionCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM regions WHERE code=$1 AND id!=$2)`, code, *excludeID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM regions WHERE code=$1)`, code).Scan(&exists)
	return exists, err
}

// ============================================================
// DIVISIONS
// ============================================================

func (r *hierarchyRepo) ListDivisions(ctx context.Context, regionID *uuid.UUID) ([]models.Division, error) {
	query := `SELECT d.id, d.name, d.code, d.region_id, d.is_active, d.created_at, d.updated_at, r.name
			  FROM divisions d JOIN regions r ON d.region_id = r.id`
	var args []interface{}
	if regionID != nil {
		query += ` WHERE d.region_id = $1`
		args = append(args, *regionID)
	}
	query += ` ORDER BY d.name`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var divisions []models.Division
	for rows.Next() {
		var d models.Division
		if err := rows.Scan(&d.ID, &d.Name, &d.Code, &d.RegionID, &d.IsActive, &d.CreatedAt, &d.UpdatedAt, &d.RegionName); err != nil {
			return nil, err
		}
		divisions = append(divisions, d)
	}
	return divisions, rows.Err()
}

func (r *hierarchyRepo) GetDivisionByID(ctx context.Context, id uuid.UUID) (*models.Division, error) {
	var d models.Division
	err := r.db.QueryRow(ctx,
		`SELECT d.id, d.name, d.code, d.region_id, d.is_active, d.created_at, d.updated_at, r.name
		 FROM divisions d JOIN regions r ON d.region_id = r.id WHERE d.id = $1`, id).
		Scan(&d.ID, &d.Name, &d.Code, &d.RegionID, &d.IsActive, &d.CreatedAt, &d.UpdatedAt, &d.RegionName)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *hierarchyRepo) CreateDivision(ctx context.Context, division *models.Division) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO divisions (name, code, region_id) VALUES ($1, $2, $3)
		 RETURNING id, is_active, created_at, updated_at`,
		division.Name, division.Code, division.RegionID).
		Scan(&division.ID, &division.IsActive, &division.CreatedAt, &division.UpdatedAt)
}

func (r *hierarchyRepo) UpdateDivision(ctx context.Context, division *models.Division) error {
	return r.db.QueryRow(ctx,
		`UPDATE divisions SET name=$1, code=$2, region_id=$3, is_active=$4, updated_at=NOW()
		 WHERE id=$5 RETURNING updated_at`,
		division.Name, division.Code, division.RegionID, division.IsActive, division.ID).
		Scan(&division.UpdatedAt)
}

func (r *hierarchyRepo) DeactivateDivision(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE divisions SET is_active=false, updated_at=NOW() WHERE id=$1`, id)
	return err
}

func (r *hierarchyRepo) HasActiveDistricts(ctx context.Context, divisionID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM districts WHERE division_id=$1 AND is_active=true)`, divisionID).
		Scan(&exists)
	return exists, err
}

func (r *hierarchyRepo) DivisionCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM divisions WHERE code=$1 AND id!=$2)`, code, *excludeID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM divisions WHERE code=$1)`, code).Scan(&exists)
	return exists, err
}

// ============================================================
// DISTRICTS
// ============================================================

func (r *hierarchyRepo) ListDistricts(ctx context.Context, divisionID *uuid.UUID, regionID *uuid.UUID) ([]models.District, error) {
	query := `SELECT d.id, d.name, d.code, d.division_id, d.region_id, d.is_active, d.created_at, d.updated_at,
			         dv.name, r.name
			  FROM districts d
			  JOIN divisions dv ON d.division_id = dv.id
			  JOIN regions r ON d.region_id = r.id`

	var conditions []string
	var args []interface{}
	argIdx := 1

	if divisionID != nil {
		conditions = append(conditions, fmt.Sprintf("d.division_id = $%d", argIdx))
		args = append(args, *divisionID)
		argIdx++
	}
	if regionID != nil {
		conditions = append(conditions, fmt.Sprintf("d.region_id = $%d", argIdx))
		args = append(args, *regionID)
		argIdx++
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY d.name"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var districts []models.District
	for rows.Next() {
		var d models.District
		if err := rows.Scan(&d.ID, &d.Name, &d.Code, &d.DivisionID, &d.RegionID, &d.IsActive,
			&d.CreatedAt, &d.UpdatedAt, &d.DivisionName, &d.RegionName); err != nil {
			return nil, err
		}
		districts = append(districts, d)
	}
	return districts, rows.Err()
}

func (r *hierarchyRepo) GetDistrictByID(ctx context.Context, id uuid.UUID) (*models.District, error) {
	var d models.District
	err := r.db.QueryRow(ctx,
		`SELECT d.id, d.name, d.code, d.division_id, d.region_id, d.is_active, d.created_at, d.updated_at,
		        dv.name, r.name
		 FROM districts d
		 JOIN divisions dv ON d.division_id = dv.id
		 JOIN regions r ON d.region_id = r.id
		 WHERE d.id = $1`, id).
		Scan(&d.ID, &d.Name, &d.Code, &d.DivisionID, &d.RegionID, &d.IsActive,
			&d.CreatedAt, &d.UpdatedAt, &d.DivisionName, &d.RegionName)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *hierarchyRepo) CreateDistrict(ctx context.Context, district *models.District) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO districts (name, code, division_id, region_id) VALUES ($1, $2, $3, $4)
		 RETURNING id, is_active, created_at, updated_at`,
		district.Name, district.Code, district.DivisionID, district.RegionID).
		Scan(&district.ID, &district.IsActive, &district.CreatedAt, &district.UpdatedAt)
}

func (r *hierarchyRepo) UpdateDistrict(ctx context.Context, district *models.District) error {
	return r.db.QueryRow(ctx,
		`UPDATE districts SET name=$1, code=$2, division_id=$3, region_id=$4, is_active=$5, updated_at=NOW()
		 WHERE id=$6 RETURNING updated_at`,
		district.Name, district.Code, district.DivisionID, district.RegionID, district.IsActive, district.ID).
		Scan(&district.UpdatedAt)
}

func (r *hierarchyRepo) DeactivateDistrict(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE districts SET is_active=false, updated_at=NOW() WHERE id=$1`, id)
	return err
}

func (r *hierarchyRepo) HasActiveStations(ctx context.Context, districtID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM stations WHERE district_id=$1 AND is_active=true)`, districtID).
		Scan(&exists)
	return exists, err
}

func (r *hierarchyRepo) DistrictCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM districts WHERE code=$1 AND id!=$2)`, code, *excludeID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM districts WHERE code=$1)`, code).Scan(&exists)
	return exists, err
}

// ============================================================
// STATIONS
// ============================================================

var stationSortColumns = map[string]string{
	"name":      "s.name",
	"code":      "s.code",
	"type":      "s.type",
	"createdAt": "s.created_at",
}

func (r *hierarchyRepo) ListStations(ctx context.Context, filter models.StationFilter, search string, p pagination.Params) ([]models.Station, int, error) {
	baseFrom := ` FROM stations s
		JOIN districts dt ON s.district_id = dt.id
		JOIN divisions dv ON s.division_id = dv.id
		JOIN regions rg ON s.region_id = rg.id`

	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.RegionID != nil {
		conditions = append(conditions, fmt.Sprintf("s.region_id = $%d", argIdx))
		args = append(args, *filter.RegionID)
		argIdx++
	}
	if filter.DivisionID != nil {
		conditions = append(conditions, fmt.Sprintf("s.division_id = $%d", argIdx))
		args = append(args, *filter.DivisionID)
		argIdx++
	}
	if filter.DistrictID != nil {
		conditions = append(conditions, fmt.Sprintf("s.district_id = $%d", argIdx))
		args = append(args, *filter.DistrictID)
		argIdx++
	}
	if filter.IsActive != nil {
		conditions = append(conditions, fmt.Sprintf("s.is_active = $%d", argIdx))
		args = append(args, *filter.IsActive)
		argIdx++
	}
	if filter.Type != nil {
		conditions = append(conditions, fmt.Sprintf("s.type = $%d", argIdx))
		args = append(args, *filter.Type)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(s.name ILIKE $%d OR s.code ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count
	var total int
	countQuery := "SELECT COUNT(*)" + baseFrom + where
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Sort
	orderCol := stationSortColumns[p.SortBy]
	if orderCol == "" {
		orderCol = "s.name"
	}

	dataQuery := fmt.Sprintf(
		`SELECT s.id, s.name, s.code, s.district_id, s.division_id, s.region_id,
		        s.address, s.phone, s.email, s.latitude, s.longitude,
		        s.type, s.status, s.is_active, s.created_at, s.updated_at,
		        dt.name, dv.name, rg.name%s%s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		baseFrom, where, orderCol, p.SortOrder, argIdx, argIdx+1)
	args = append(args, p.Limit, p.Offset())

	rows, err := r.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var stations []models.Station
	for rows.Next() {
		var s models.Station
		if err := rows.Scan(
			&s.ID, &s.Name, &s.Code, &s.DistrictID, &s.DivisionID, &s.RegionID,
			&s.Address, &s.Phone, &s.Email, &s.Latitude, &s.Longitude,
			&s.Type, &s.Status, &s.IsActive, &s.CreatedAt, &s.UpdatedAt,
			&s.DistrictName, &s.DivisionName, &s.RegionName,
		); err != nil {
			return nil, 0, err
		}
		stations = append(stations, s)
	}
	return stations, total, rows.Err()
}

func (r *hierarchyRepo) GetStationByID(ctx context.Context, id uuid.UUID) (*models.Station, error) {
	var s models.Station
	var officerCount int
	err := r.db.QueryRow(ctx,
		`SELECT s.id, s.name, s.code, s.district_id, s.division_id, s.region_id,
		        s.address, s.phone, s.email, s.latitude, s.longitude,
		        s.type, s.status, s.is_active, s.created_at, s.updated_at,
		        dt.name, dv.name, rg.name,
		        (SELECT COUNT(*) FROM officers WHERE station_id = s.id)
		 FROM stations s
		 JOIN districts dt ON s.district_id = dt.id
		 JOIN divisions dv ON s.division_id = dv.id
		 JOIN regions rg ON s.region_id = rg.id
		 WHERE s.id = $1`, id).
		Scan(&s.ID, &s.Name, &s.Code, &s.DistrictID, &s.DivisionID, &s.RegionID,
			&s.Address, &s.Phone, &s.Email, &s.Latitude, &s.Longitude,
			&s.Type, &s.Status, &s.IsActive, &s.CreatedAt, &s.UpdatedAt,
			&s.DistrictName, &s.DivisionName, &s.RegionName, &officerCount)
	if err != nil {
		return nil, err
	}
	s.OfficerCount = &officerCount
	return &s, nil
}

func (r *hierarchyRepo) CreateStation(ctx context.Context, station *models.Station) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO stations (name, code, district_id, division_id, region_id, address, phone, email, latitude, longitude, type)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id, status, is_active, created_at, updated_at`,
		station.Name, station.Code, station.DistrictID, station.DivisionID, station.RegionID,
		station.Address, station.Phone, station.Email, station.Latitude, station.Longitude, station.Type).
		Scan(&station.ID, &station.Status, &station.IsActive, &station.CreatedAt, &station.UpdatedAt)
}

func (r *hierarchyRepo) UpdateStation(ctx context.Context, station *models.Station) error {
	return r.db.QueryRow(ctx,
		`UPDATE stations SET name=$1, code=$2, district_id=$3, division_id=$4, region_id=$5,
		        address=$6, phone=$7, email=$8, latitude=$9, longitude=$10, type=$11, is_active=$12, updated_at=NOW()
		 WHERE id=$13 RETURNING updated_at`,
		station.Name, station.Code, station.DistrictID, station.DivisionID, station.RegionID,
		station.Address, station.Phone, station.Email, station.Latitude, station.Longitude,
		station.Type, station.IsActive, station.ID).
		Scan(&station.UpdatedAt)
}

func (r *hierarchyRepo) DeactivateStation(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE stations SET is_active=false, updated_at=NOW() WHERE id=$1`, id)
	return err
}

func (r *hierarchyRepo) HasActiveOfficers(ctx context.Context, stationID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM officers o JOIN users u ON o.user_id = u.id WHERE o.station_id=$1 AND u.is_active=true)`,
		stationID).Scan(&exists)
	return exists, err
}

func (r *hierarchyRepo) StationCodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM stations WHERE code=$1 AND id!=$2)`, code, *excludeID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM stations WHERE code=$1)`, code).Scan(&exists)
	return exists, err
}

func (r *hierarchyRepo) GetStationStats(ctx context.Context) (*models.StationStats, error) {
	stats := &models.StationStats{}

	// Totals
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*),
		        COUNT(*) FILTER (WHERE is_active = true),
		        COUNT(*) FILTER (WHERE is_active = false)
		 FROM stations`).
		Scan(&stats.Total, &stats.Active, &stats.Inactive)
	if err != nil {
		return nil, err
	}

	// By region
	rows, err := r.db.Query(ctx,
		`SELECT r.id, r.name, COUNT(s.id)
		 FROM regions r LEFT JOIN stations s ON s.region_id = r.id
		 GROUP BY r.id, r.name ORDER BY r.name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var rc models.RegionCount
		if err := rows.Scan(&rc.RegionID, &rc.RegionName, &rc.Count); err != nil {
			return nil, err
		}
		stats.ByRegion = append(stats.ByRegion, rc)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// By type
	rows2, err := r.db.Query(ctx,
		`SELECT type, COUNT(*) FROM stations GROUP BY type ORDER BY type`)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()

	for rows2.Next() {
		var tc models.TypeCount
		if err := rows2.Scan(&tc.Type, &tc.Count); err != nil {
			return nil, err
		}
		stats.ByType = append(stats.ByType, tc)
	}

	return stats, rows2.Err()
}
