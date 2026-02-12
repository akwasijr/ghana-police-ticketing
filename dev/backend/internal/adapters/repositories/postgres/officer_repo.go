package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type officerRepo struct {
	db *pgxpool.Pool
}

func NewOfficerRepo(db *pgxpool.Pool) repositories.OfficerRepository {
	return &officerRepo{db: db}
}

const officerSelectCols = `o.id, o.user_id, o.badge_number, o.rank, o.station_id, o.region_id,
	o.assigned_device_id, o.created_at,
	u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.last_login_at,
	s.id, s.name, s.code`

const officerFromJoin = ` FROM officers o
	JOIN users u ON o.user_id = u.id
	LEFT JOIN stations s ON o.station_id = s.id`

func scanOfficerResponse(scanner interface{ Scan(...interface{}) error }) (*models.OfficerResponse, error) {
	var r models.OfficerResponse
	var stationID *uuid.UUID
	var stationName, stationCode *string

	err := scanner.Scan(
		&r.ID, &r.UserID, &r.BadgeNumber, &r.Rank, &r.StationID, &r.RegionID,
		&r.AssignedDeviceID, &r.CreatedAt,
		&r.Email, &r.FirstName, &r.LastName, &r.Phone, &r.Role, &r.IsActive, &r.LastLogin,
		&stationID, &stationName, &stationCode,
	)
	if err != nil {
		return nil, err
	}

	r.FullName = r.FirstName + " " + r.LastName
	if r.Rank != nil {
		r.RankDisplay = models.RankDisplayMap[*r.Rank]
	}
	if stationID != nil && stationName != nil {
		r.Station = &models.StationInfo{ID: *stationID, Name: *stationName, Code: *stationCode}
	}
	return &r, nil
}

var officerSortColumns = map[string]string{
	"name":      "u.last_name",
	"badge":     "o.badge_number",
	"rank":      "o.rank",
	"station":   "s.name",
	"createdAt": "o.created_at",
}

func (r *officerRepo) List(ctx context.Context, filter models.OfficerFilter, search string, p pagination.Params) ([]models.OfficerResponse, int, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.StationID != nil {
		conditions = append(conditions, fmt.Sprintf("o.station_id = $%d", argIdx))
		args = append(args, *filter.StationID)
		argIdx++
	}
	if filter.RegionID != nil {
		conditions = append(conditions, fmt.Sprintf("o.region_id = $%d", argIdx))
		args = append(args, *filter.RegionID)
		argIdx++
	}
	if filter.Rank != nil {
		conditions = append(conditions, fmt.Sprintf("o.rank = $%d", argIdx))
		args = append(args, *filter.Rank)
		argIdx++
	}
	if filter.Role != nil {
		conditions = append(conditions, fmt.Sprintf("u.role = $%d", argIdx))
		args = append(args, *filter.Role)
		argIdx++
	}
	if filter.IsActive != nil {
		conditions = append(conditions, fmt.Sprintf("u.is_active = $%d", argIdx))
		args = append(args, *filter.IsActive)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(u.first_name ILIKE $%d OR u.last_name ILIKE $%d OR o.badge_number ILIKE $%d OR u.email ILIKE $%d OR u.phone ILIKE $%d)",
			argIdx, argIdx, argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*)"+officerFromJoin+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Sort
	orderCol := officerSortColumns[p.SortBy]
	if orderCol == "" {
		orderCol = "u.last_name"
	}

	dataQuery := fmt.Sprintf("SELECT %s%s%s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		officerSelectCols, officerFromJoin, where, orderCol, p.SortOrder, argIdx, argIdx+1)
	args = append(args, p.Limit, p.Offset())

	rows, err := r.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var officers []models.OfficerResponse
	for rows.Next() {
		o, err := scanOfficerResponse(rows)
		if err != nil {
			return nil, 0, err
		}
		officers = append(officers, *o)
	}
	return officers, total, rows.Err()
}

func (r *officerRepo) GetByID(ctx context.Context, officerID uuid.UUID) (*models.OfficerResponse, error) {
	row := r.db.QueryRow(ctx, "SELECT "+officerSelectCols+officerFromJoin+" WHERE o.id = $1", officerID)
	return scanOfficerResponse(row)
}

func (r *officerRepo) Create(ctx context.Context, user *models.User, officer *models.Officer) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Insert user
	err = tx.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, is_active, created_at, updated_at`,
		user.Email, user.PasswordHash, user.FirstName, user.LastName, user.Phone, user.Role).
		Scan(&user.ID, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return err
	}

	// Insert officer
	officer.UserID = user.ID
	err = tx.QueryRow(ctx,
		`INSERT INTO officers (user_id, badge_number, rank, station_id, region_id, assigned_device_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, created_at, updated_at`,
		officer.UserID, officer.BadgeNumber, officer.Rank, officer.StationID, officer.RegionID, officer.AssignedDeviceID).
		Scan(&officer.ID, &officer.CreatedAt, &officer.UpdatedAt)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *officerRepo) Update(ctx context.Context, user *models.User, officer *models.Officer) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update user
	_, err = tx.Exec(ctx,
		`UPDATE users SET first_name=$1, last_name=$2, email=$3, phone=$4, role=$5, is_active=$6, updated_at=NOW()
		 WHERE id=$7`,
		user.FirstName, user.LastName, user.Email, user.Phone, user.Role, user.IsActive, user.ID)
	if err != nil {
		return err
	}

	// Update officer
	_, err = tx.Exec(ctx,
		`UPDATE officers SET rank=$1, station_id=$2, region_id=$3, assigned_device_id=$4, updated_at=NOW()
		 WHERE id=$5`,
		officer.Rank, officer.StationID, officer.RegionID, officer.AssignedDeviceID, officer.ID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *officerRepo) Deactivate(ctx context.Context, officerID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET is_active=false, updated_at=NOW()
		 WHERE id = (SELECT user_id FROM officers WHERE id = $1)`, officerID)
	return err
}

func (r *officerRepo) GetStats(ctx context.Context, officerID uuid.UUID) (*models.OfficerStats, error) {
	stats := &models.OfficerStats{}

	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	startOfWeek := startOfDay.AddDate(0, 0, -int(startOfDay.Weekday()))
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Ticket counts and financials
	err := r.db.QueryRow(ctx,
		`SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE issued_at >= $2),
			COUNT(*) FILTER (WHERE issued_at >= $3),
			COUNT(*) FILTER (WHERE issued_at >= $4),
			COALESCE(SUM(total_fine), 0),
			COALESCE(SUM(CASE WHEN status = 'paid' THEN paid_amount ELSE 0 END), 0),
			COALESCE(AVG(total_fine), 0)
		 FROM tickets WHERE officer_id = $1`,
		officerID, startOfMonth, startOfWeek, startOfDay).
		Scan(&stats.TotalTickets, &stats.TicketsThisMonth, &stats.TicketsThisWeek, &stats.TicketsToday,
			&stats.TotalFinesIssued, &stats.TotalCollected, &stats.AverageFineAmount)
	if err != nil {
		return nil, err
	}

	if stats.TotalFinesIssued > 0 {
		stats.CollectionRate = (stats.TotalCollected / stats.TotalFinesIssued) * 100
	}

	// Top offences
	rows, err := r.db.Query(ctx,
		`SELECT off.code, off.name, COUNT(*) as cnt
		 FROM ticket_offences toff
		 JOIN offences off ON toff.offence_id = off.id
		 JOIN tickets t ON toff.ticket_id = t.id
		 WHERE t.officer_id = $1
		 GROUP BY off.code, off.name
		 ORDER BY cnt DESC
		 LIMIT 5`, officerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item models.TopOffenceItem
		if err := rows.Scan(&item.Code, &item.Name, &item.Count); err != nil {
			return nil, err
		}
		stats.TopOffences = append(stats.TopOffences, item)
	}

	return stats, rows.Err()
}

func (r *officerRepo) BadgeNumberExists(ctx context.Context, badge string, excludeOfficerID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeOfficerID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM officers WHERE badge_number=$1 AND id!=$2)`, badge, *excludeOfficerID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM officers WHERE badge_number=$1)`, badge).Scan(&exists)
	return exists, err
}

func (r *officerRepo) EmailExists(ctx context.Context, email string, excludeUserID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeUserID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM users WHERE email=$1 AND id!=$2)`, email, *excludeUserID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, email).Scan(&exists)
	return exists, err
}

func (r *officerRepo) GetUserIDByOfficerID(ctx context.Context, officerID uuid.UUID) (uuid.UUID, error) {
	var userID uuid.UUID
	err := r.db.QueryRow(ctx, `SELECT user_id FROM officers WHERE id = $1`, officerID).Scan(&userID)
	return userID, err
}
