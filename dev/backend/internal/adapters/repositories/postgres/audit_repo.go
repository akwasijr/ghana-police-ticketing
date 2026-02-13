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

type auditRepo struct {
	db *pgxpool.Pool
}

func NewAuditRepo(db *pgxpool.Pool) repositories.AuditRepository {
	return &auditRepo{db: db}
}

func (r *auditRepo) Create(ctx context.Context, entry *models.AuditLog) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO audit_logs (
			user_id, user_name, user_role, user_badge_number,
			action, entity_type, entity_id, entity_name, description,
			old_value, new_value, metadata,
			ip_address, user_agent, session_id,
			station_id, station_name, region_id, region_name,
			severity, success, error_message
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
		) RETURNING id, timestamp, created_at`,
		entry.UserID, entry.UserName, entry.UserRole, entry.UserBadgeNumber,
		entry.Action, entry.EntityType, entry.EntityID, entry.EntityName, entry.Description,
		entry.OldValue, entry.NewValue, entry.Metadata,
		entry.IPAddress, entry.UserAgent, entry.SessionID,
		entry.StationID, entry.StationName, entry.RegionID, entry.RegionName,
		entry.Severity, entry.Success, entry.ErrorMessage,
	).Scan(&entry.ID, &entry.Timestamp, &entry.CreatedAt)
}

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

var auditScanCols = `a.id, a.timestamp, a.user_id, a.user_name, a.user_role, a.user_badge_number,
	a.action, a.entity_type, a.entity_id, a.entity_name, a.description,
	a.old_value, a.new_value, a.metadata,
	a.ip_address, a.user_agent, a.session_id,
	a.station_id, a.station_name, a.region_id, a.region_name,
	a.severity, a.success, a.error_message, a.created_at`

func scanAuditLog(scanner interface{ Scan(dest ...any) error }) (*models.AuditLog, error) {
	var a models.AuditLog
	err := scanner.Scan(
		&a.ID, &a.Timestamp, &a.UserID, &a.UserName, &a.UserRole, &a.UserBadgeNumber,
		&a.Action, &a.EntityType, &a.EntityID, &a.EntityName, &a.Description,
		&a.OldValue, &a.NewValue, &a.Metadata,
		&a.IPAddress, &a.UserAgent, &a.SessionID,
		&a.StationID, &a.StationName, &a.RegionID, &a.RegionName,
		&a.Severity, &a.Success, &a.ErrorMessage, &a.CreatedAt,
	)
	return &a, err
}

func (r *auditRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	row := r.db.QueryRow(ctx, `SELECT `+auditScanCols+` FROM audit_logs a WHERE a.id = $1`, id)
	return scanAuditLog(row)
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

var auditSortColumns = map[string]string{
	"createdAt": "a.timestamp",
	"timestamp": "a.timestamp",
	"action":    "a.action",
	"severity":  "a.severity",
}

func (r *auditRepo) List(ctx context.Context, filter models.AuditFilter, search string, p pagination.Params) ([]models.AuditLog, int, error) {
	conditions, args, argIdx := buildAuditConditions(filter, search)

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM audit_logs a"+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	orderCol := auditSortColumns[p.SortBy]
	if orderCol == "" {
		orderCol = "a.timestamp"
	}

	query := fmt.Sprintf("SELECT %s FROM audit_logs a%s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		auditScanCols, where, orderCol, p.SortOrder, argIdx, argIdx+1)
	args = append(args, p.Limit, p.Offset())

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []models.AuditLog
	for rows.Next() {
		entry, err := scanAuditLog(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *entry)
	}
	return items, total, rows.Err()
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

func (r *auditRepo) GetStats(ctx context.Context, filter models.AuditFilter) (*models.AuditStats, error) {
	conditions, args, _ := buildAuditConditions(filter, "")
	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	stats := &models.AuditStats{
		ByAction:     make(map[string]int),
		ByEntityType: make(map[string]int),
		ByUser:       []models.UserActivityCount{},
		RecentCritical: []models.CriticalEntry{},
	}

	// Total
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM audit_logs a"+where, args...).Scan(&stats.TotalEntries); err != nil {
		return nil, err
	}

	// By action
	rows, err := r.db.Query(ctx, fmt.Sprintf("SELECT action, COUNT(*) FROM audit_logs a%s GROUP BY action", where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var action string
		var count int
		if err := rows.Scan(&action, &count); err != nil {
			return nil, err
		}
		stats.ByAction[action] = count
	}

	// By entity type
	rows2, err := r.db.Query(ctx, fmt.Sprintf("SELECT entity_type, COUNT(*) FROM audit_logs a%s GROUP BY entity_type", where), args...)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()
	for rows2.Next() {
		var entityType string
		var count int
		if err := rows2.Scan(&entityType, &count); err != nil {
			return nil, err
		}
		stats.ByEntityType[entityType] = count
	}

	// By severity
	r.db.QueryRow(ctx, fmt.Sprintf(
		`SELECT
			COUNT(*) FILTER (WHERE severity = 'info'),
			COUNT(*) FILTER (WHERE severity = 'warning'),
			COUNT(*) FILTER (WHERE severity = 'critical')
		 FROM audit_logs a%s`, where), args...,
	).Scan(&stats.BySeverity.Info, &stats.BySeverity.Warning, &stats.BySeverity.Critical)

	// Top 10 users by activity
	rows3, err := r.db.Query(ctx, fmt.Sprintf(
		`SELECT user_id, user_name, COUNT(*) as cnt FROM audit_logs a%s
		 AND user_id IS NOT NULL GROUP BY user_id, user_name ORDER BY cnt DESC LIMIT 10`,
		func() string {
			if where == "" {
				return " WHERE 1=1"
			}
			return where
		}()), args...)
	if err != nil {
		return nil, err
	}
	defer rows3.Close()
	for rows3.Next() {
		var u models.UserActivityCount
		if err := rows3.Scan(&u.UserID, &u.UserName, &u.Count); err != nil {
			return nil, err
		}
		stats.ByUser = append(stats.ByUser, u)
	}

	// Recent 5 critical entries
	rows4, err := r.db.Query(ctx,
		`SELECT id, timestamp, action, entity_type, description, user_name, severity
		 FROM audit_logs WHERE severity = 'critical' ORDER BY timestamp DESC LIMIT 5`)
	if err != nil {
		return nil, err
	}
	defer rows4.Close()
	for rows4.Next() {
		var c models.CriticalEntry
		if err := rows4.Scan(&c.ID, &c.Timestamp, &c.Action, &c.EntityType, &c.Description, &c.UserName, &c.Severity); err != nil {
			return nil, err
		}
		stats.RecentCritical = append(stats.RecentCritical, c)
	}

	return stats, nil
}

// ---------------------------------------------------------------------------
// Filter builder
// ---------------------------------------------------------------------------

func buildAuditConditions(filter models.AuditFilter, search string) ([]string, []any, int) {
	var conditions []string
	var args []any
	argIdx := 1

	if filter.Action != nil && *filter.Action != "" {
		actions := strings.Split(*filter.Action, ",")
		placeholders := make([]string, len(actions))
		for i, a := range actions {
			placeholders[i] = fmt.Sprintf("$%d", argIdx)
			args = append(args, strings.TrimSpace(a))
			argIdx++
		}
		conditions = append(conditions, fmt.Sprintf("a.action IN (%s)", strings.Join(placeholders, ",")))
	}
	if filter.EntityType != nil && *filter.EntityType != "" {
		types := strings.Split(*filter.EntityType, ",")
		placeholders := make([]string, len(types))
		for i, t := range types {
			placeholders[i] = fmt.Sprintf("$%d", argIdx)
			args = append(args, strings.TrimSpace(t))
			argIdx++
		}
		conditions = append(conditions, fmt.Sprintf("a.entity_type IN (%s)", strings.Join(placeholders, ",")))
	}
	if filter.UserID != nil {
		conditions = append(conditions, fmt.Sprintf("a.user_id = $%d", argIdx))
		args = append(args, *filter.UserID)
		argIdx++
	}
	if filter.Severity != nil && *filter.Severity != "" {
		conditions = append(conditions, fmt.Sprintf("a.severity = $%d", argIdx))
		args = append(args, *filter.Severity)
		argIdx++
	}
	if filter.DateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("a.timestamp >= $%d", argIdx))
		args = append(args, *filter.DateFrom)
		argIdx++
	}
	if filter.DateTo != nil {
		conditions = append(conditions, fmt.Sprintf("a.timestamp <= $%d", argIdx))
		args = append(args, *filter.DateTo)
		argIdx++
	}
	if filter.StationID != nil {
		conditions = append(conditions, fmt.Sprintf("a.station_id = $%d", argIdx))
		args = append(args, *filter.StationID)
		argIdx++
	}
	if filter.RegionID != nil {
		conditions = append(conditions, fmt.Sprintf("a.region_id = $%d", argIdx))
		args = append(args, *filter.RegionID)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(a.description ILIKE $%d OR a.entity_name ILIKE $%d OR a.user_name ILIKE $%d)",
			argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	return conditions, args, argIdx
}
