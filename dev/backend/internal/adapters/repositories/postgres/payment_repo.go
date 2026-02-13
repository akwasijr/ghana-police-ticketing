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

type paymentRepo struct {
	db *pgxpool.Pool
}

func NewPaymentRepo(db *pgxpool.Pool) repositories.PaymentRepository {
	return &paymentRepo{db: db}
}

func (r *paymentRepo) Create(ctx context.Context, p *models.Payment) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO payments (
			payment_reference, ticket_id, ticket_number, amount, currency,
			original_fine, late_fee, discount, method, phone_number,
			network, status, status_message, payer_name, payer_phone,
			payer_email, processed_by_id, station_id, expires_at,
			processed_at, completed_at, receipt_number, transaction_id
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
		) RETURNING id, created_at, updated_at`,
		p.PaymentReference, p.TicketID, p.TicketNumber, p.Amount, p.Currency,
		p.OriginalFine, p.LateFee, p.Discount, p.Method, p.PhoneNumber,
		p.Network, p.Status, p.StatusMessage, p.PayerName, p.PayerPhone,
		p.PayerEmail, p.ProcessedByID, p.StationID, p.ExpiresAt,
		p.ProcessedAt, p.CompletedAt, p.ReceiptNumber, p.TransactionID,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)
}

var paymentScanCols = `p.id, p.payment_reference, p.ticket_id, p.ticket_number,
	p.amount, p.currency, p.original_fine, p.late_fee, p.discount,
	p.method, p.phone_number, p.network, p.transaction_id,
	p.status, p.status_message, p.payer_name, p.payer_phone, p.payer_email,
	p.receipt_number, p.processed_by_id, p.station_id, p.provider_response,
	p.processed_at, p.completed_at, p.expires_at, p.created_at, p.updated_at`

func scanPayment(scanner interface{ Scan(dest ...any) error }) (*models.Payment, error) {
	var p models.Payment
	err := scanner.Scan(
		&p.ID, &p.PaymentReference, &p.TicketID, &p.TicketNumber,
		&p.Amount, &p.Currency, &p.OriginalFine, &p.LateFee, &p.Discount,
		&p.Method, &p.PhoneNumber, &p.Network, &p.TransactionID,
		&p.Status, &p.StatusMessage, &p.PayerName, &p.PayerPhone, &p.PayerEmail,
		&p.ReceiptNumber, &p.ProcessedByID, &p.StationID, &p.ProviderResponse,
		&p.ProcessedAt, &p.CompletedAt, &p.ExpiresAt, &p.CreatedAt, &p.UpdatedAt,
	)
	return &p, err
}

func (r *paymentRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	row := r.db.QueryRow(ctx, `SELECT `+paymentScanCols+` FROM payments p WHERE p.id = $1`, id)
	return scanPayment(row)
}

func (r *paymentRepo) GetByReference(ctx context.Context, ref string) (*models.Payment, error) {
	row := r.db.QueryRow(ctx, `SELECT `+paymentScanCols+` FROM payments p WHERE p.payment_reference = $1`, ref)
	return scanPayment(row)
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

var paymentSortColumns = map[string]string{
	"createdAt":   "p.created_at",
	"amount":      "p.amount",
	"status":      "p.status",
	"method":      "p.method",
	"completedAt": "p.completed_at",
}

func (r *paymentRepo) List(ctx context.Context, filter models.PaymentFilter, search string, p pagination.Params) ([]models.Payment, int, error) {
	conditions, args, argIdx := buildPaymentConditions(filter, search)

	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM payments p"+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	orderCol := paymentSortColumns[p.SortBy]
	if orderCol == "" {
		orderCol = "p.created_at"
	}

	query := fmt.Sprintf("SELECT %s FROM payments p%s ORDER BY %s %s LIMIT $%d OFFSET $%d",
		paymentScanCols, where, orderCol, p.SortOrder, argIdx, argIdx+1)
	args = append(args, p.Limit, p.Offset())

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []models.Payment
	for rows.Next() {
		payment, err := scanPayment(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *payment)
	}
	return items, total, rows.Err()
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

func (r *paymentRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string, transactionID, statusMessage, providerResponse *string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE payments SET status = $1, transaction_id = COALESCE($2, transaction_id),
		 status_message = COALESCE($3, status_message),
		 provider_response = COALESCE($4::jsonb, provider_response),
		 updated_at = NOW() WHERE id = $5`,
		status, transactionID, statusMessage, providerResponse, id)
	return err
}

func (r *paymentRepo) Complete(ctx context.Context, id uuid.UUID, transactionID *string, receiptNumber string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	now := time.Now()
	_, err = tx.Exec(ctx,
		`UPDATE payments SET status = 'completed', transaction_id = COALESCE($1, transaction_id),
		 receipt_number = $2, completed_at = $3, updated_at = $3 WHERE id = $4`,
		transactionID, receiptNumber, now, id)
	if err != nil {
		return err
	}

	// Update ticket status to paid
	var ticketID uuid.UUID
	var amount float64
	var method string
	err = tx.QueryRow(ctx, `SELECT ticket_id, amount, method FROM payments WHERE id = $1`, id).Scan(&ticketID, &amount, &method)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`UPDATE tickets SET status = 'paid', paid_at = $1, paid_amount = $2,
		 paid_method = $3, updated_at = $1 WHERE id = $4`,
		now, amount, method, ticketID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

func (r *paymentRepo) GetStats(ctx context.Context, filter models.PaymentFilter) (*models.PaymentStats, error) {
	conditions, args, _ := buildPaymentConditions(filter, "")
	where := ""
	if len(conditions) > 0 {
		where = " WHERE " + strings.Join(conditions, " AND ")
	}

	stats := &models.PaymentStats{
		ByStatus: make(map[string]int),
		ByMethod: make(map[string]models.MethodStats),
	}

	// Totals
	err := r.db.QueryRow(ctx, fmt.Sprintf(
		`SELECT COUNT(*), COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)
		 FROM payments p%s`, where), args...).Scan(&stats.TotalPayments, &stats.TotalAmount)
	if err != nil {
		return nil, err
	}

	// By status
	rows, err := r.db.Query(ctx, fmt.Sprintf(
		`SELECT status, COUNT(*) FROM payments p%s GROUP BY status`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}
		stats.ByStatus[status] = count
	}

	// By method (completed only)
	rows2, err := r.db.Query(ctx, fmt.Sprintf(
		`SELECT method, COUNT(*), COALESCE(SUM(amount), 0)
		 FROM payments p%s AND status = 'completed' GROUP BY method`,
		func() string {
			if where == "" {
				return " WHERE 1=1"
			}
			return where
		}()), args...)
	if err != nil {
		return nil, err
	}
	defer rows2.Close()
	for rows2.Next() {
		var method string
		var ms models.MethodStats
		if err := rows2.Scan(&method, &ms.Count, &ms.Amount); err != nil {
			return nil, err
		}
		stats.ByMethod[method] = ms
	}

	// Time-period totals (completed only)
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := todayStart.AddDate(0, 0, -int(now.Weekday()))
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	r.db.QueryRow(ctx,
		`SELECT
			COALESCE(SUM(CASE WHEN completed_at >= $1 THEN amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN completed_at >= $2 THEN amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN completed_at >= $3 THEN amount ELSE 0 END), 0)
		 FROM payments WHERE status = 'completed'`,
		todayStart, weekStart, monthStart,
	).Scan(&stats.TodayAmount, &stats.WeekAmount, &stats.MonthAmount)

	return stats, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func (r *paymentRepo) HasPendingOrCompleted(ctx context.Context, ticketID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM payments WHERE ticket_id = $1 AND status IN ('pending', 'processing', 'completed'))`,
		ticketID).Scan(&exists)
	return exists, err
}

func (r *paymentRepo) NextReceiptNumber(ctx context.Context) (string, error) {
	var seq int64
	err := r.db.QueryRow(ctx, "SELECT nextval('receipt_number_seq')").Scan(&seq)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("RCP-%d-%07d", time.Now().Year(), seq), nil
}

func (r *paymentRepo) GetReceipt(ctx context.Context, id uuid.UUID) (*models.PaymentReceipt, error) {
	var receipt models.PaymentReceipt
	err := r.db.QueryRow(ctx,
		`SELECT p.receipt_number, p.ticket_number, t.vehicle_reg_number,
		        p.payer_name, p.amount, p.method, p.transaction_id, p.completed_at,
		        COALESCE(u.first_name || ' ' || u.last_name, ''),
		        COALESCE(s.name, '')
		 FROM payments p
		 JOIN tickets t ON p.ticket_id = t.id
		 LEFT JOIN users u ON p.processed_by_id = u.id
		 LEFT JOIN stations s ON p.station_id = s.id
		 WHERE p.id = $1 AND p.status = 'completed'`, id,
	).Scan(
		&receipt.ReceiptNumber, &receipt.TicketNumber, &receipt.VehicleReg,
		&receipt.PayerName, &receipt.Amount, &receipt.Method, &receipt.TransactionID,
		&receipt.PaidAt, &receipt.ProcessedBy, &receipt.StationName,
	)
	if err != nil {
		return nil, err
	}
	return &receipt, nil
}

// ---------------------------------------------------------------------------
// Filter builder
// ---------------------------------------------------------------------------

func buildPaymentConditions(filter models.PaymentFilter, search string) ([]string, []any, int) {
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
		conditions = append(conditions, fmt.Sprintf("p.status IN (%s)", strings.Join(placeholders, ",")))
	}
	if filter.Method != nil && *filter.Method != "" {
		methods := strings.Split(*filter.Method, ",")
		placeholders := make([]string, len(methods))
		for i, m := range methods {
			placeholders[i] = fmt.Sprintf("$%d", argIdx)
			args = append(args, strings.TrimSpace(m))
			argIdx++
		}
		conditions = append(conditions, fmt.Sprintf("p.method IN (%s)", strings.Join(placeholders, ",")))
	}
	if filter.DateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("p.created_at >= $%d", argIdx))
		args = append(args, *filter.DateFrom)
		argIdx++
	}
	if filter.DateTo != nil {
		conditions = append(conditions, fmt.Sprintf("p.created_at <= $%d", argIdx))
		args = append(args, *filter.DateTo)
		argIdx++
	}
	if filter.MinAmount != nil {
		conditions = append(conditions, fmt.Sprintf("p.amount >= $%d", argIdx))
		args = append(args, *filter.MinAmount)
		argIdx++
	}
	if filter.MaxAmount != nil {
		conditions = append(conditions, fmt.Sprintf("p.amount <= $%d", argIdx))
		args = append(args, *filter.MaxAmount)
		argIdx++
	}
	if filter.StationID != nil {
		conditions = append(conditions, fmt.Sprintf("p.station_id = $%d", argIdx))
		args = append(args, *filter.StationID)
		argIdx++
	}
	if filter.ProcessedByID != nil {
		conditions = append(conditions, fmt.Sprintf("p.processed_by_id = $%d", argIdx))
		args = append(args, *filter.ProcessedByID)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(p.payment_reference ILIKE $%d OR p.ticket_number ILIKE $%d OR p.payer_name ILIKE $%d OR p.payer_phone ILIKE $%d)",
			argIdx, argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	return conditions, args, argIdx
}
