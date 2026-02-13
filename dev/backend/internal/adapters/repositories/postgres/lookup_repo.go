package postgres

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/jackc/pgx/v5/pgxpool"
)

type lookupRepo struct {
	db *pgxpool.Pool
}

func NewLookupRepo(db *pgxpool.Pool) repositories.LookupRepository {
	return &lookupRepo{db: db}
}

func (r *lookupRepo) GetLookupData(ctx context.Context) (*models.LookupData, error) {
	data := &models.LookupData{
		Offences:     []models.LookupOffence{},
		Regions:      []models.LookupRegion{},
		Stations:     []models.LookupStation{},
		VehicleTypes: []models.LookupVehicleType{},
	}

	var maxUpdated time.Time

	// Offences
	rows, err := r.db.Query(ctx,
		`SELECT id, code, name, category, default_fine, min_fine, max_fine, updated_at
		 FROM offences WHERE is_active = true ORDER BY code`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var o models.LookupOffence
		var updatedAt time.Time
		if err := rows.Scan(&o.ID, &o.Code, &o.Name, &o.Category, &o.DefaultFine, &o.MinFine, &o.MaxFine, &updatedAt); err != nil {
			return nil, err
		}
		data.Offences = append(data.Offences, o)
		if updatedAt.After(maxUpdated) {
			maxUpdated = updatedAt
		}
	}

	// Regions
	rows2, err := r.db.Query(ctx,
		`SELECT id, name, code, updated_at FROM regions WHERE is_active = true ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()
	for rows2.Next() {
		var reg models.LookupRegion
		var updatedAt time.Time
		if err := rows2.Scan(&reg.ID, &reg.Name, &reg.Code, &updatedAt); err != nil {
			return nil, err
		}
		data.Regions = append(data.Regions, reg)
		if updatedAt.After(maxUpdated) {
			maxUpdated = updatedAt
		}
	}

	// Stations
	rows3, err := r.db.Query(ctx,
		`SELECT s.id, s.name, s.code, s.region_id, s.updated_at
		 FROM stations s WHERE s.is_active = true ORDER BY s.name`)
	if err != nil {
		return nil, err
	}
	defer rows3.Close()
	for rows3.Next() {
		var st models.LookupStation
		var updatedAt time.Time
		if err := rows3.Scan(&st.ID, &st.Name, &st.Code, &st.RegionID, &updatedAt); err != nil {
			return nil, err
		}
		data.Stations = append(data.Stations, st)
		if updatedAt.After(maxUpdated) {
			maxUpdated = updatedAt
		}
	}

	// Vehicle types (no updated_at column — use created_at)
	rows4, err := r.db.Query(ctx,
		`SELECT id, name, created_at FROM vehicle_types WHERE is_active = true ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows4.Close()
	for rows4.Next() {
		var vt models.LookupVehicleType
		var updatedAt time.Time
		if err := rows4.Scan(&vt.ID, &vt.Name, &updatedAt); err != nil {
			return nil, err
		}
		data.VehicleTypes = append(data.VehicleTypes, vt)
		if updatedAt.After(maxUpdated) {
			maxUpdated = updatedAt
		}
	}

	data.LastUpdated = maxUpdated
	return data, nil
}

func (r *lookupRepo) GetLastUpdated(ctx context.Context) (time.Time, error) {
	var t time.Time
	err := r.db.QueryRow(ctx,
		`SELECT GREATEST(
			(SELECT COALESCE(MAX(updated_at), '1970-01-01') FROM offences WHERE is_active = true),
			(SELECT COALESCE(MAX(updated_at), '1970-01-01') FROM regions WHERE is_active = true),
			(SELECT COALESCE(MAX(updated_at), '1970-01-01') FROM stations WHERE is_active = true),
			(SELECT COALESCE(MAX(created_at), '1970-01-01') FROM vehicle_types WHERE is_active = true)
		)`).Scan(&t)
	return t, err
}
