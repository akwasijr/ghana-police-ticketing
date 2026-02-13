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

type objectionRepo struct {
	db *pgxpool.Pool
}

func NewObjectionRepo(db *pgxpool.Pool) repositories.ObjectionRepository {
	return &objectionRepo{db: db}
}

func (r *objectionRepo) Create(ctx context.Context, o *models.Objection) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO objections (
			ticket_id, ticket_number, vehicle_reg, offence_type, fine_amount,
			reason, details, evidence, driver_name, driver_phone, driver_email,
			status, submitted_at, review_deadline, station_id, region_id
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
		) RETURNING id, created_at, updated_at`,
		o.TicketID, o.TicketNumber, o.VehicleReg, o.OffenceType, o.FineAmount,
		o.Reason, o.Details, o.Evidence, o.DriverName, o.DriverPhone, o.DriverEmail,
		o.Status, o.SubmittedAt, o.ReviewDeadline, o.StationID, o.RegionID,
	).Scan(&o.ID, &o.CreatedAt, &o.UpdatedAt)
}

// ---------------------------------------------------------------------------
// Scan columns for response with JOINs
// ---------------------------------------------------------------------------

var objectionResponseCols = `o.id, o.ticket_id, o.ticket_number, o.vehicle_reg,
	o.reason, o.details, o.evidence, o.status,
	o.submitted_at, o.review_deadline, o.reviewed_at, o.reviewed_by_id, o.review_notes,
	o.adjusted_fine, o.driver_name, o.driver_phone, o.driver_email,
	o.offence_type, o.fine_amount,
	o.station_id, COALESCE(s.name, ''),
	s.district_id, COALESCE(d.name, ''),
	d.division_id, COALESCE(div.name, ''),
	o.region_id, COALESCE(r.name, ''),
	COALESCE(u.first_name || ' ' || u.last_name, ''),
	o.created_at, o.updated_at`

var objectionJoins = ` FROM objections o
	LEFT JOIN stations s ON o.station_id = s.id
	LEFT JOIN districts d ON s.district_id = d.id
	LEFT JOIN divisions div ON d.division_id = div.id
	LEFT JOIN regions r ON o.region_id = r.id
	LEFT JOIN users u ON o.reviewed_by_id = u.id`

func scanObjectionResponse(scanner interface{ Scan(dest ...any) error }) (*models.ObjectionResponse, error) {
	var resp models.ObjectionResponse
	var stationName, districtName, divisionName, regionName, reviewerName string
	var districtID, divisionID *uuid.UUID

	err := scanner.Scan(
		&resp.ID, &resp.TicketID, &resp.TicketNumber, &resp.VehicleReg,
		&resp.Reason, &resp.Details, &resp.Evidence, &resp.Status,
		&resp.SubmittedAt, &resp.ReviewDeadline, &resp.ReviewedAt, &resp.ReviewedByID, &resp.ReviewNotes,
		&resp.AdjustedFine, &resp.DriverName, &resp.DriverPhone, &resp.DriverEmail,
		&resp.OffenceType, &resp.FineAmount,
		&resp.StationID, &stationName,
		&districtID, &districtName,
		&divisionID, &divisionName,
		&resp.RegionID, &regionName,
		&reviewerName,
		&resp.CreatedAt, &resp.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if stationName != "" {
		resp.StationName = &stationName
	}
	if districtID != nil {
		resp.DistrictID = districtID
		resp.DistrictName = &districtName
	}
	if divisionID != nil {
		resp.DivisionID = divisionID
		resp.DivisionName = &divisionName
	}
	if regionName != "" {
		resp.RegionName = &regionName
	}
	if reviewerName != "" {
		resp.ReviewedBy = &reviewerName
	}
	resp.Attachments = []models.ObjectionAttachment{} // default empty

	return &resp, nil
}

// ---------------------------------------------------------------------------
// GetByID
// ---------------------------------------------------------------------------

func (r *objectionRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.ObjectionResponse, error) {
	row := r.db.QueryRow(ctx, `SELECT `+objectionResponseCols+objectionJoins+` WHERE o.id = $1`, id)
	resp, err := scanObjectionResponse(row)
	if err != nil {
		return nil, err
	}
	// Load attachments
	attachments, err := r.GetAttachments(ctx, id)
	if err == nil {
		resp.Attachments = attachments
	}
	return resp, nil
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

var objectionSortColumns = map[string]string{
	"createdAt":   "o.created_at",
	"submittedAt": "o.submitted_at",
	"reviewedAt":  "o.reviewed_at",
	"status":      "o.status",
	"fineAmount":  "o.fine_amount",
}

func (r *objectionRepo) List(ctx context.Context, filter models.ObjectionFilter, search string, p pagination.Params) ([]models.ObjectionResponse, int, error) {
	conditions, args, argIdx := buildObjectionConditions(filter, search)

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	// Count
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM objections o"+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	orderCol := objectionSortColumns[p.SortBy]
	if orderCol == "" {
		orderCol = "o.created_at"
	}

	query := fmt.Sprintf("SELECT %s%s%s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		objectionResponseCols, objectionJoins, where, orderCol, p.SortOrder, argIdx, argIdx+1)
	args = append(args, p.Limit, p.Offset())

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []models.ObjectionResponse
	for rows.Next() {
		resp, err := scanObjectionResponse(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *resp)
	}
	return items, total, rows.Err()
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

func (r *objectionRepo) Review(ctx context.Context, id uuid.UUID, status string, reviewedByID uuid.UUID, reviewNotes string, adjustedFine *float64) error {
	now := time.Now()
	_, err := r.db.Exec(ctx,
		`UPDATE objections SET status = $1, reviewed_at = $2, reviewed_by_id = $3,
		 review_notes = $4, adjusted_fine = $5, updated_at = $2 WHERE id = $6`,
		status, now, reviewedByID, reviewNotes, adjustedFine, id)
	return err
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

func (r *objectionRepo) GetStats(ctx context.Context, filter models.ObjectionFilter) (*models.ObjectionStats, error) {
	conditions, args, _ := buildObjectionConditions(filter, "")
	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	stats := &models.ObjectionStats{}

	// Counts by status
	err := r.db.QueryRow(ctx, fmt.Sprintf(
		`SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'pending'),
			COUNT(*) FILTER (WHERE status = 'approved'),
			COUNT(*) FILTER (WHERE status = 'rejected')
		 FROM objections o%s`, where), args...,
	).Scan(&stats.Total, &stats.Pending, &stats.Approved, &stats.Rejected)
	if err != nil {
		return nil, err
	}

	// Approval rate
	decided := stats.Approved + stats.Rejected
	if decided > 0 {
		stats.ApprovalRate = float64(stats.Approved) / float64(decided) * 100
	}

	// Avg resolution time (hours) for decided objections
	r.db.QueryRow(ctx, fmt.Sprintf(
		`SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 3600), 0)
		 FROM objections o%s`,
		func() string {
			if where == "" {
				return " WHERE reviewed_at IS NOT NULL"
			}
			return where + " AND reviewed_at IS NOT NULL"
		}()), args...,
	).Scan(&stats.AvgResolutionTimeHours)

	return stats, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (r *objectionRepo) HasActiveObjection(ctx context.Context, ticketID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM objections WHERE ticket_id = $1 AND status = 'pending')`,
		ticketID).Scan(&exists)
	return exists, err
}

func (r *objectionRepo) GetAttachments(ctx context.Context, objectionID uuid.UUID) ([]models.ObjectionAttachment, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, file_type, file_url, file_name, uploaded_at
		 FROM objection_attachments WHERE objection_id = $1 ORDER BY uploaded_at`,
		objectionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attachments []models.ObjectionAttachment
	for rows.Next() {
		var a models.ObjectionAttachment
		if err := rows.Scan(&a.ID, &a.Type, &a.URL, &a.Name, &a.UploadedAt); err != nil {
			return nil, err
		}
		attachments = append(attachments, a)
	}
	if attachments == nil {
		attachments = []models.ObjectionAttachment{}
	}
	return attachments, rows.Err()
}

// ---------------------------------------------------------------------------
// Filter builder
// ---------------------------------------------------------------------------

func buildObjectionConditions(filter models.ObjectionFilter, search string) ([]string, []any, int) {
	var conditions []string
	var args []any
	argIdx := 1

	if filter.Status != nil && *filter.Status != "" {
		statuses := strings.Split(*filter.Status, ",")
		placeholders := make([]string, len(statuses))
		for i, s := range statuses {
			placeholders[i] = fmt.Sprintf("$%d", argIdx)
			args = append(args, strings.TrimSpace(s))
			argIdx++
		}
		conditions = append(conditions, fmt.Sprintf("o.status IN (%s)", strings.Join(placeholders, ",")))
	}
	if filter.DateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("o.submitted_at >= $%d", argIdx))
		args = append(args, *filter.DateFrom)
		argIdx++
	}
	if filter.DateTo != nil {
		conditions = append(conditions, fmt.Sprintf("o.submitted_at <= $%d", argIdx))
		args = append(args, *filter.DateTo)
		argIdx++
	}
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
	if filter.MinAmount != nil {
		conditions = append(conditions, fmt.Sprintf("o.fine_amount >= $%d", argIdx))
		args = append(args, *filter.MinAmount)
		argIdx++
	}
	if filter.MaxAmount != nil {
		conditions = append(conditions, fmt.Sprintf("o.fine_amount <= $%d", argIdx))
		args = append(args, *filter.MaxAmount)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(o.ticket_number ILIKE $%d OR o.driver_name ILIKE $%d OR o.reason ILIKE $%d OR o.vehicle_reg ILIKE $%d)",
			argIdx, argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	return conditions, args, argIdx
}
