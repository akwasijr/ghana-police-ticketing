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

type ticketRepo struct {
	db *pgxpool.Pool
}

func NewTicketRepo(db *pgxpool.Pool) repositories.TicketRepository {
	return &ticketRepo{db: db}
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

func (r *ticketRepo) NextTicketNumber(ctx context.Context, regionCode string) (string, string, error) {
	var seq int64
	err := r.db.QueryRow(ctx, "SELECT nextval('ticket_number_seq')").Scan(&seq)
	if err != nil {
		return "", "", err
	}
	year := time.Now().Year()
	ticketNum := fmt.Sprintf("TKT-%d-%s-%06d", year, regionCode, seq)
	paymentRef := fmt.Sprintf("PAY-%d-%s-%06d", year, regionCode, seq)
	return ticketNum, paymentRef, nil
}

func (r *ticketRepo) Create(ctx context.Context, ticket *models.Ticket, offences []repositories.TicketOffenceInput) (string, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx,
		`INSERT INTO tickets (
			ticket_number, status, vehicle_reg_number, vehicle_type, vehicle_color,
			vehicle_make, vehicle_model, driver_name, driver_license, driver_phone,
			driver_address, location_description, location_latitude, location_longitude,
			total_fine, payment_reference, officer_id, station_id, district_id,
			division_id, region_id, notes, sync_status, client_created_id,
			issued_at, due_date, payment_deadline
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
		) RETURNING id, created_at, updated_at`,
		ticket.TicketNumber, ticket.Status, ticket.VehicleRegNumber, ticket.VehicleType, ticket.VehicleColor,
		ticket.VehicleMake, ticket.VehicleModel, ticket.DriverName, ticket.DriverLicense, ticket.DriverPhone,
		ticket.DriverAddress, ticket.LocationDesc, ticket.LocationLatitude, ticket.LocationLongitude,
		ticket.TotalFine, ticket.PaymentReference, ticket.OfficerID, ticket.StationID, ticket.DistrictID,
		ticket.DivisionID, ticket.RegionID, ticket.Notes, ticket.SyncStatus, ticket.ClientCreatedID,
		ticket.IssuedAt, ticket.DueDate, ticket.DueDate,
	).Scan(&ticket.ID, &ticket.CreatedAt, &ticket.UpdatedAt)
	if err != nil {
		return "", err
	}

	for _, o := range offences {
		_, err = tx.Exec(ctx,
			`INSERT INTO ticket_offences (ticket_id, offence_id, fine_amount, notes)
			 VALUES ($1, $2, $3, $4)`,
			ticket.ID, o.OffenceID, o.Fine, o.Notes)
		if err != nil {
			return "", err
		}
	}

	return ticket.TicketNumber, tx.Commit(ctx)
}

// ---------------------------------------------------------------------------
// Get (full detail)
// ---------------------------------------------------------------------------

func (r *ticketRepo) GetByID(ctx context.Context, ticketID uuid.UUID) (*models.TicketResponse, error) {
	return r.getTicket(ctx, "t.id = $1", ticketID)
}

func (r *ticketRepo) GetByNumber(ctx context.Context, ticketNumber string) (*models.TicketResponse, error) {
	return r.getTicket(ctx, "t.ticket_number = $1", ticketNumber)
}

func (r *ticketRepo) getTicket(ctx context.Context, where string, arg any) (*models.TicketResponse, error) {
	query := `SELECT
		t.id, t.ticket_number, t.status, t.issued_at, t.due_date, t.total_fine,
		t.vehicle_reg_number, t.vehicle_type, t.vehicle_color, t.vehicle_make, t.vehicle_model,
		t.driver_name, t.driver_license, t.driver_phone, t.driver_address,
		t.location_description, t.location_latitude, t.location_longitude,
		t.notes, t.officer_id, t.station_id, t.district_id, t.division_id, t.region_id,
		t.payment_reference, t.paid_at, t.paid_amount, t.paid_method,
		t.sync_status, t.printed, t.printed_at,
		t.voided_by, t.voided_at, t.void_reason,
		t.created_at, t.updated_at,
		u.first_name || ' ' || u.last_name AS officer_name,
		o.badge_number,
		s.name AS station_name
	FROM tickets t
	JOIN officers o ON t.officer_id = o.id
	JOIN users u ON o.user_id = u.id
	LEFT JOIN stations s ON t.station_id = s.id
	WHERE ` + where

	var resp models.TicketResponse
	var vehicleType, vehicleColor, vehicleMake, vehicleModel *string
	var driverName, driverLicense, driverPhone, driverAddress *string
	var locDesc *string
	var locLat, locLng *float64

	err := r.db.QueryRow(ctx, query, arg).Scan(
		&resp.ID, &resp.TicketNumber, &resp.Status, &resp.IssuedAt, &resp.DueDate, &resp.TotalFine,
		&resp.Vehicle.RegistrationNumber, &vehicleType, &vehicleColor, &vehicleMake, &vehicleModel,
		&driverName, &driverLicense, &driverPhone, &driverAddress,
		&locDesc, &locLat, &locLng,
		&resp.Notes, &resp.OfficerID, &resp.StationID, &resp.DistrictID, &resp.DivisionID, &resp.RegionID,
		&resp.PaymentReference, &resp.PaidAt, &resp.PaidAmount, &resp.PaymentMethod,
		&resp.SyncStatus, &resp.Printed, &resp.PrintedAt,
		&resp.VoidedBy, &resp.VoidedAt, &resp.VoidReason,
		&resp.CreatedAt, &resp.UpdatedAt,
		&resp.OfficerName, &resp.OfficerBadge, &resp.StationName,
	)
	if err != nil {
		return nil, err
	}

	resp.Vehicle.Type = derefStr(vehicleType)
	resp.Vehicle.Color = vehicleColor
	resp.Vehicle.Make = vehicleMake
	resp.Vehicle.Model = vehicleModel
	if driverName != nil {
		parts := strings.SplitN(*driverName, " ", 2)
		resp.Driver.FirstName = parts[0]
		if len(parts) > 1 {
			resp.Driver.LastName = parts[1]
		}
	}
	resp.Driver.LicenseNumber = driverLicense
	resp.Driver.Phone = driverPhone
	resp.Driver.Address = driverAddress
	if locLat != nil {
		resp.Location.Latitude = *locLat
	}
	if locLng != nil {
		resp.Location.Longitude = *locLng
	}
	resp.Location.Address = locDesc
	resp.ObjectionFiled = resp.Status == "objection"

	// Offences
	offRows, err := r.db.Query(ctx,
		`SELECT toff.id, toff.offence_id, off.code, off.name, off.category, toff.fine_amount, toff.notes
		 FROM ticket_offences toff
		 JOIN offences off ON toff.offence_id = off.id
		 WHERE toff.ticket_id = $1`, resp.ID)
	if err != nil {
		return nil, err
	}
	defer offRows.Close()

	for offRows.Next() {
		var o models.TicketOffence
		if err := offRows.Scan(&o.ID, &o.OffenceID, &o.Code, &o.Name, &o.Category, &o.Fine, &o.Notes); err != nil {
			return nil, err
		}
		resp.Offences = append(resp.Offences, o)
	}
	if resp.Offences == nil {
		resp.Offences = []models.TicketOffence{}
	}

	// Photos
	photoRows, err := r.db.Query(ctx,
		`SELECT id, type, storage_path, COALESCE(thumbnail_path, storage_path), created_at
		 FROM ticket_photos WHERE ticket_id = $1 ORDER BY created_at`, resp.ID)
	if err != nil {
		return nil, err
	}
	defer photoRows.Close()

	for photoRows.Next() {
		var p models.TicketPhoto
		var storagePath, thumbPath string
		if err := photoRows.Scan(&p.ID, &p.Type, &storagePath, &thumbPath, &p.Timestamp); err != nil {
			return nil, err
		}
		p.URL = "/uploads/" + storagePath
		p.ThumbnailURL = "/uploads/" + thumbPath
		resp.Photos = append(resp.Photos, p)
	}
	if resp.Photos == nil {
		resp.Photos = []models.TicketPhoto{}
	}

	// Notes
	noteRows, err := r.db.Query(ctx,
		`SELECT tn.id, tn.content, tn.officer_id,
		        u2.first_name || ' ' || u2.last_name,
		        tn.edited, tn.edited_at, tn.created_at
		 FROM ticket_notes tn
		 JOIN officers o2 ON tn.officer_id = o2.id
		 JOIN users u2 ON o2.user_id = u2.id
		 WHERE tn.ticket_id = $1 ORDER BY tn.created_at`, resp.ID)
	if err != nil {
		return nil, err
	}
	defer noteRows.Close()

	for noteRows.Next() {
		var n models.TicketNote
		if err := noteRows.Scan(&n.ID, &n.Content, &n.OfficerID, &n.OfficerName, &n.Edited, &n.EditedAt, &n.Timestamp); err != nil {
			return nil, err
		}
		resp.NotesList = append(resp.NotesList, n)
	}
	if resp.NotesList == nil {
		resp.NotesList = []models.TicketNote{}
	}

	return &resp, nil
}

func derefStr(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

var ticketSortColumns = map[string]string{
	"issuedAt":     "t.issued_at",
	"totalFine":    "t.total_fine",
	"ticketNumber": "t.ticket_number",
	"status":       "t.status",
	"dueDate":      "t.due_date",
}

func (r *ticketRepo) List(ctx context.Context, filter models.TicketFilter, search string, p pagination.Params) ([]models.TicketListItem, int, error) {
	conditions, args, argIdx := buildTicketConditions(filter, search)

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	fromJoin := ` FROM tickets t
		JOIN officers o ON t.officer_id = o.id
		JOIN users u ON o.user_id = u.id
		LEFT JOIN stations s ON t.station_id = s.id`

	// Count
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*)"+fromJoin+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	orderCol := ticketSortColumns[p.SortBy]
	if orderCol == "" {
		orderCol = "t.issued_at"
	}

	dataQuery := fmt.Sprintf(`SELECT
		t.id, t.ticket_number, t.vehicle_reg_number, t.status, t.total_fine,
		t.issued_at, t.due_date,
		u.first_name || ' ' || u.last_name, t.officer_id,
		t.station_id, COALESCE(s.name, ''), t.region_id,
		(SELECT COUNT(*) FROM ticket_offences WHERE ticket_id = t.id),
		t.sync_status
	%s%s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		fromJoin, where, orderCol, p.SortOrder, argIdx, argIdx+1)
	args = append(args, p.Limit, p.Offset())

	rows, err := r.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []models.TicketListItem
	for rows.Next() {
		var item models.TicketListItem
		if err := rows.Scan(
			&item.ID, &item.TicketNumber, &item.VehicleReg, &item.Status, &item.TotalFine,
			&item.IssuedAt, &item.DueDate,
			&item.OfficerName, &item.OfficerID,
			&item.StationID, &item.StationName, &item.RegionID,
			&item.OffenceCount, &item.SyncStatus,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

// ---------------------------------------------------------------------------
// Search (quick, max 50)
// ---------------------------------------------------------------------------

func (r *ticketRepo) Search(ctx context.Context, query string, filter models.TicketFilter) ([]models.TicketListItem, error) {
	searchPattern := "%" + query + "%"

	conditions, args, argIdx := buildTicketConditions(filter, "")
	conditions = append(conditions, fmt.Sprintf(
		"(t.ticket_number ILIKE $%d OR t.vehicle_reg_number ILIKE $%d OR t.driver_name ILIKE $%d)",
		argIdx, argIdx, argIdx))
	args = append(args, searchPattern)

	where := " WHERE " + strings.Join(conditions, " AND ")

	fromJoin := ` FROM tickets t
		JOIN officers o ON t.officer_id = o.id
		JOIN users u ON o.user_id = u.id
		LEFT JOIN stations s ON t.station_id = s.id`

	dataQuery := fmt.Sprintf(`SELECT
		t.id, t.ticket_number, t.vehicle_reg_number, t.status, t.total_fine,
		t.issued_at, t.due_date,
		u.first_name || ' ' || u.last_name, t.officer_id,
		t.station_id, COALESCE(s.name, ''), t.region_id,
		(SELECT COUNT(*) FROM ticket_offences WHERE ticket_id = t.id),
		t.sync_status
	%s%s ORDER BY t.issued_at DESC LIMIT 50`, fromJoin, where)

	rows, err := r.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.TicketListItem
	for rows.Next() {
		var item models.TicketListItem
		if err := rows.Scan(
			&item.ID, &item.TicketNumber, &item.VehicleReg, &item.Status, &item.TotalFine,
			&item.IssuedAt, &item.DueDate,
			&item.OfficerName, &item.OfficerID,
			&item.StationID, &item.StationName, &item.RegionID,
			&item.OffenceCount, &item.SyncStatus,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// ---------------------------------------------------------------------------
// Update helpers
// ---------------------------------------------------------------------------

func (r *ticketRepo) UpdateStatus(ctx context.Context, ticketID uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`, status, ticketID)
	return err
}

func (r *ticketRepo) VoidTicket(ctx context.Context, ticketID uuid.UUID, voidedBy uuid.UUID, reason string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE tickets SET status = 'cancelled', voided_by = $1, voided_at = NOW(),
		 void_reason = $2, updated_at = NOW() WHERE id = $3`,
		voidedBy, reason, ticketID)
	return err
}

func (r *ticketRepo) ReplaceOffences(ctx context.Context, ticketID uuid.UUID, offences []repositories.TicketOffenceInput) (float64, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `DELETE FROM ticket_offences WHERE ticket_id = $1`, ticketID)
	if err != nil {
		return 0, err
	}

	var totalFine float64
	for _, o := range offences {
		_, err = tx.Exec(ctx,
			`INSERT INTO ticket_offences (ticket_id, offence_id, fine_amount, notes) VALUES ($1, $2, $3, $4)`,
			ticketID, o.OffenceID, o.Fine, o.Notes)
		if err != nil {
			return 0, err
		}
		totalFine += o.Fine
	}

	_, err = tx.Exec(ctx, `UPDATE tickets SET total_fine = $1, updated_at = NOW() WHERE id = $2`, totalFine, ticketID)
	if err != nil {
		return 0, err
	}

	return totalFine, tx.Commit(ctx)
}

func (r *ticketRepo) AppendNote(ctx context.Context, ticketID uuid.UUID, officerID uuid.UUID, content string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO ticket_notes (ticket_id, officer_id, content) VALUES ($1, $2, $3)`,
		ticketID, officerID, content)
	return err
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

func (r *ticketRepo) GetStats(ctx context.Context, filter models.TicketFilter) (*models.TicketStats, error) {
	conditions, args, _ := buildTicketConditions(filter, "")

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	stats := &models.TicketStats{}
	err := r.db.QueryRow(ctx, fmt.Sprintf(`SELECT
		COUNT(*),
		COUNT(*) FILTER (WHERE status = 'paid'),
		COUNT(*) FILTER (WHERE status = 'unpaid'),
		COUNT(*) FILTER (WHERE status = 'overdue'),
		COUNT(*) FILTER (WHERE status = 'objection'),
		COUNT(*) FILTER (WHERE status = 'cancelled'),
		COALESCE(SUM(total_fine), 0),
		COALESCE(SUM(CASE WHEN status = 'paid' THEN COALESCE(paid_amount, total_fine) ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN status IN ('unpaid', 'overdue') THEN total_fine ELSE 0 END), 0)
	FROM tickets t%s`, where), args...).Scan(
		&stats.Total, &stats.Paid, &stats.Unpaid, &stats.Overdue,
		&stats.Objection, &stats.Cancelled,
		&stats.TotalAmount, &stats.CollectedAmount, &stats.PendingAmount,
	)
	return stats, err
}

// ---------------------------------------------------------------------------
// Dedup + Photo
// ---------------------------------------------------------------------------

func (r *ticketRepo) ClientCreatedIDExists(ctx context.Context, clientID uuid.UUID) (*uuid.UUID, error) {
	var ticketID uuid.UUID
	err := r.db.QueryRow(ctx,
		`SELECT id FROM tickets WHERE client_created_id = $1`, clientID).Scan(&ticketID)
	if err != nil {
		return nil, err
	}
	return &ticketID, nil
}

func (r *ticketRepo) SavePhoto(ctx context.Context, photo *models.TicketPhoto, ticketID uuid.UUID, storagePath, thumbnailPath, mimeType string, fileSize int) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO ticket_photos (ticket_id, type, storage_path, thumbnail_path, mime_type, file_size, uploaded)
		 VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id, created_at`,
		ticketID, photo.Type, storagePath, thumbnailPath, mimeType, fileSize,
	).Scan(&photo.ID, &photo.Timestamp)
}

// ---------------------------------------------------------------------------
// Shared filter builder
// ---------------------------------------------------------------------------

func buildTicketConditions(filter models.TicketFilter, search string) ([]string, []any, int) {
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
		conditions = append(conditions, fmt.Sprintf("t.status IN (%s)", strings.Join(placeholders, ",")))
	}
	if filter.DateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("t.issued_at >= $%d", argIdx))
		args = append(args, *filter.DateFrom)
		argIdx++
	}
	if filter.DateTo != nil {
		conditions = append(conditions, fmt.Sprintf("t.issued_at <= $%d", argIdx))
		args = append(args, *filter.DateTo)
		argIdx++
	}
	if filter.OfficerID != nil {
		conditions = append(conditions, fmt.Sprintf("t.officer_id = $%d", argIdx))
		args = append(args, *filter.OfficerID)
		argIdx++
	}
	if filter.StationID != nil {
		conditions = append(conditions, fmt.Sprintf("t.station_id = $%d", argIdx))
		args = append(args, *filter.StationID)
		argIdx++
	}
	if filter.RegionID != nil {
		conditions = append(conditions, fmt.Sprintf("t.region_id = $%d", argIdx))
		args = append(args, *filter.RegionID)
		argIdx++
	}
	if filter.MinAmount != nil {
		conditions = append(conditions, fmt.Sprintf("t.total_fine >= $%d", argIdx))
		args = append(args, *filter.MinAmount)
		argIdx++
	}
	if filter.MaxAmount != nil {
		conditions = append(conditions, fmt.Sprintf("t.total_fine <= $%d", argIdx))
		args = append(args, *filter.MaxAmount)
		argIdx++
	}
	if filter.Category != nil && *filter.Category != "" {
		conditions = append(conditions, fmt.Sprintf(
			"EXISTS (SELECT 1 FROM ticket_offences toff JOIN offences off ON toff.offence_id = off.id WHERE toff.ticket_id = t.id AND off.category = $%d)", argIdx))
		args = append(args, *filter.Category)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(t.ticket_number ILIKE $%d OR t.vehicle_reg_number ILIKE $%d OR t.driver_name ILIKE $%d)",
			argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	return conditions, args, argIdx
}
