package postgres

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/jackc/pgx/v5/pgxpool"
)

type analyticsRepo struct {
	db *pgxpool.Pool
}

func NewAnalyticsRepo(db *pgxpool.Pool) repositories.AnalyticsRepository {
	return &analyticsRepo{db: db}
}

// ---------------------------------------------------------------------------
// Filter builder
// ---------------------------------------------------------------------------

func buildAnalyticsWhere(f models.AnalyticsFilter) (string, []any, int) {
	conditions := []string{"t.issued_at >= $1", "t.issued_at <= $2"}
	args := []any{f.StartDate + " 00:00:00", f.EndDate + " 23:59:59"}
	idx := 3

	if f.RegionID != nil {
		conditions = append(conditions, fmt.Sprintf("t.region_id = $%d", idx))
		args = append(args, *f.RegionID)
		idx++
	}
	if f.StationID != nil {
		conditions = append(conditions, fmt.Sprintf("t.station_id = $%d", idx))
		args = append(args, *f.StationID)
		idx++
	}
	if f.OfficerID != nil {
		conditions = append(conditions, fmt.Sprintf("t.officer_id = $%d", idx))
		args = append(args, *f.OfficerID)
		idx++
	}

	return " WHERE " + strings.Join(conditions, " AND "), args, idx
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

func (r *analyticsRepo) Summary(ctx context.Context, f models.AnalyticsFilter) (*models.AnalyticsSummary, error) {
	where, args, _ := buildAnalyticsWhere(f)
	s := &models.AnalyticsSummary{}

	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*), COALESCE(SUM(total_fine),0),
		 COALESCE(SUM(CASE WHEN status='paid' THEN COALESCE(paid_amount, total_fine) ELSE 0 END),0),
		 COUNT(DISTINCT officer_id), COUNT(DISTINCT station_id)
		 FROM tickets t`+where, args...,
	).Scan(&s.TotalTickets, &s.TotalFines, &s.TotalCollected, &s.ActiveOfficers, &s.ActiveStations)
	if err != nil {
		return nil, err
	}

	if s.TotalFines > 0 {
		s.CollectionRate = math.Round(s.TotalCollected/s.TotalFines*1000) / 10
	}
	if s.ActiveOfficers > 0 {
		s.AveragePerOfficer = math.Round(float64(s.TotalTickets)/float64(s.ActiveOfficers)*100) / 100
	}

	return s, nil
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

func (r *analyticsRepo) Trends(ctx context.Context, f models.AnalyticsFilter, groupBy string) ([]models.TrendPoint, error) {
	where, args, _ := buildAnalyticsWhere(f)

	var truncExpr string
	switch groupBy {
	case "week":
		truncExpr = "TO_CHAR(DATE_TRUNC('week', t.issued_at), 'IYYY-\"W\"IW')"
	case "month":
		truncExpr = "TO_CHAR(DATE_TRUNC('month', t.issued_at), 'YYYY-MM')"
	default:
		truncExpr = "TO_CHAR(t.issued_at, 'YYYY-MM-DD')"
	}

	query := fmt.Sprintf(
		`SELECT %s as period, COUNT(*), COALESCE(SUM(total_fine),0),
		 COALESCE(SUM(CASE WHEN status='paid' THEN COALESCE(paid_amount, total_fine) ELSE 0 END),0)
		 FROM tickets t%s GROUP BY period ORDER BY period`, truncExpr, where)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []models.TrendPoint
	for rows.Next() {
		var p models.TrendPoint
		if err := rows.Scan(&p.Period, &p.Tickets, &p.Fines, &p.Collected); err != nil {
			return nil, err
		}
		points = append(points, p)
	}
	if points == nil {
		points = []models.TrendPoint{}
	}
	return points, rows.Err()
}

// ---------------------------------------------------------------------------
// Top offences
// ---------------------------------------------------------------------------

func (r *analyticsRepo) TopOffences(ctx context.Context, f models.AnalyticsFilter, limit int) ([]models.TopOffence, error) {
	where, args, idx := buildAnalyticsWhere(f)

	// Get total ticket count for percentage
	var totalTickets int
	r.db.QueryRow(ctx, "SELECT COUNT(*) FROM tickets t"+where, args...).Scan(&totalTickets)

	query := fmt.Sprintf(
		`SELECT o.id, o.code, o.name, o.category, COUNT(to2.id), COALESCE(SUM(to2.fine_amount),0)
		 FROM ticket_offences to2
		 JOIN offences o ON to2.offence_id = o.id
		 JOIN tickets t ON to2.ticket_id = t.id
		 %s GROUP BY o.id, o.code, o.name, o.category
		 ORDER BY COUNT(to2.id) DESC LIMIT $%d`, where, idx)
	args = append(args, limit)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.TopOffence
	for rows.Next() {
		var item models.TopOffence
		if err := rows.Scan(&item.OffenceID, &item.Code, &item.Name, &item.Category, &item.Count, &item.TotalAmount); err != nil {
			return nil, err
		}
		if totalTickets > 0 {
			item.PercentageOfTotal = math.Round(float64(item.Count)/float64(totalTickets)*1000) / 10
		}
		items = append(items, item)
	}
	if items == nil {
		items = []models.TopOffence{}
	}
	return items, rows.Err()
}

// ---------------------------------------------------------------------------
// By region
// ---------------------------------------------------------------------------

func (r *analyticsRepo) ByRegion(ctx context.Context, f models.AnalyticsFilter) ([]models.RegionAnalytics, error) {
	// Only use startDate/endDate for ByRegion (no region/station/officer filter)
	args := []any{f.StartDate + " 00:00:00", f.EndDate + " 23:59:59"}
	where := " WHERE t.issued_at >= $1 AND t.issued_at <= $2"

	query := `SELECT r.id, r.name, r.code,
		COUNT(t.id), COALESCE(SUM(t.total_fine),0),
		COALESCE(SUM(CASE WHEN t.status='paid' THEN COALESCE(t.paid_amount, t.total_fine) ELSE 0 END),0),
		COUNT(DISTINCT t.officer_id), COUNT(DISTINCT t.station_id)
		FROM regions r
		LEFT JOIN tickets t ON t.region_id = r.id AND t.issued_at >= $1 AND t.issued_at <= $2
		` + where + `
		GROUP BY r.id, r.name, r.code ORDER BY COUNT(t.id) DESC`

	// Actually we want all regions even if they have no tickets, so use a different approach
	query = `SELECT r.id, r.name, r.code,
		COUNT(t.id), COALESCE(SUM(t.total_fine),0),
		COALESCE(SUM(CASE WHEN t.status='paid' THEN COALESCE(t.paid_amount, t.total_fine) ELSE 0 END),0),
		COUNT(DISTINCT t.officer_id), COUNT(DISTINCT t.station_id)
		FROM regions r
		LEFT JOIN tickets t ON t.region_id = r.id AND t.issued_at >= $1 AND t.issued_at <= $2
		WHERE r.is_active = true
		GROUP BY r.id, r.name, r.code ORDER BY COUNT(t.id) DESC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.RegionAnalytics
	for rows.Next() {
		var item models.RegionAnalytics
		if err := rows.Scan(&item.RegionID, &item.RegionName, &item.RegionCode,
			&item.Tickets, &item.TotalFines, &item.Collected,
			&item.ActiveOfficers, &item.ActiveStations); err != nil {
			return nil, err
		}
		if item.TotalFines > 0 {
			item.CollectionRate = math.Round(item.Collected/item.TotalFines*1000) / 10
		}
		items = append(items, item)
	}
	if items == nil {
		items = []models.RegionAnalytics{}
	}
	return items, rows.Err()
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

func buildRevenueWhere(f models.AnalyticsFilter) (string, []any, int) {
	conditions := []string{"p.created_at >= $1", "p.created_at <= $2", "p.status = 'completed'"}
	args := []any{f.StartDate + " 00:00:00", f.EndDate + " 23:59:59"}
	idx := 3

	if f.StationID != nil {
		conditions = append(conditions, fmt.Sprintf("p.station_id = $%d", idx))
		args = append(args, *f.StationID)
		idx++
	}
	// Region/officer filters require a join to tickets
	if f.RegionID != nil {
		conditions = append(conditions, fmt.Sprintf("t.region_id = $%d", idx))
		args = append(args, *f.RegionID)
		idx++
	}
	if f.OfficerID != nil {
		conditions = append(conditions, fmt.Sprintf("t.officer_id = $%d", idx))
		args = append(args, *f.OfficerID)
		idx++
	}

	return " WHERE " + strings.Join(conditions, " AND "), args, idx
}

func revenueNeedsTicketJoin(f models.AnalyticsFilter) string {
	if f.RegionID != nil || f.OfficerID != nil {
		return " JOIN tickets t ON p.ticket_id = t.id"
	}
	return ""
}

func (r *analyticsRepo) Revenue(ctx context.Context, f models.AnalyticsFilter, groupBy string) (*models.RevenueReport, error) {
	paidWhere, args, _ := buildRevenueWhere(f)
	ticketJoin := revenueNeedsTicketJoin(f)

	report := &models.RevenueReport{
		ByPeriod:  []models.RevenueByPeriod{},
		ByMethod:  []models.RevenueByMethod{},
		ByStation: []models.RevenueByStation{},
	}

	// Total revenue
	var paidCount int
	r.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(p.amount),0), COUNT(*)
		 FROM payments p`+ticketJoin+paidWhere, args...,
	).Scan(&report.TotalRevenue, &paidCount)

	if paidCount > 0 {
		report.AveragePerTicket = math.Round(report.TotalRevenue/float64(paidCount)*100) / 100
	}

	// Daily average
	startDate, _ := time.Parse("2006-01-02", f.StartDate)
	endDate, _ := time.Parse("2006-01-02", f.EndDate)
	days := endDate.Sub(startDate).Hours()/24 + 1
	if days > 0 {
		report.DailyAverage = math.Round(report.TotalRevenue/days*100) / 100
	}

	// By period
	var truncExpr string
	switch groupBy {
	case "week":
		truncExpr = "TO_CHAR(DATE_TRUNC('week', p.created_at), 'IYYY-\"W\"IW')"
	case "month":
		truncExpr = "TO_CHAR(DATE_TRUNC('month', p.created_at), 'YYYY-MM')"
	default:
		truncExpr = "TO_CHAR(p.created_at, 'YYYY-MM-DD')"
	}

	rows, err := r.db.Query(ctx, fmt.Sprintf(
		`SELECT %s as period, COALESCE(SUM(p.amount),0)
		 FROM payments p%s%s
		 GROUP BY period ORDER BY period`, truncExpr, ticketJoin, paidWhere), args...)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var bp models.RevenueByPeriod
			rows.Scan(&bp.Period, &bp.Amount)
			report.ByPeriod = append(report.ByPeriod, bp)
		}
	}

	// By method
	rows2, err := r.db.Query(ctx,
		`SELECT p.method, COUNT(*), COALESCE(SUM(p.amount),0)
		 FROM payments p`+ticketJoin+paidWhere+`
		 GROUP BY p.method ORDER BY SUM(p.amount) DESC`, args...)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var bm models.RevenueByMethod
			rows2.Scan(&bm.Method, &bm.Count, &bm.Amount)
			if report.TotalRevenue > 0 {
				bm.Percentage = math.Round(bm.Amount/report.TotalRevenue*1000) / 10
			}
			report.ByMethod = append(report.ByMethod, bm)
		}
	}

	// By station
	rows3, err := r.db.Query(ctx,
		`SELECT p.station_id, COALESCE(s.name, ''), COALESCE(SUM(p.amount),0), COUNT(*)
		 FROM payments p`+ticketJoin+`
		 LEFT JOIN stations s ON p.station_id = s.id
		 `+paidWhere+` AND p.station_id IS NOT NULL
		 GROUP BY p.station_id, s.name ORDER BY SUM(p.amount) DESC`, args...)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var bs models.RevenueByStation
			rows3.Scan(&bs.StationID, &bs.StationName, &bs.Amount, &bs.TicketCount)
			report.ByStation = append(report.ByStation, bs)
		}
	}

	return report, nil
}

// ---------------------------------------------------------------------------
// Officer performance
// ---------------------------------------------------------------------------

func (r *analyticsRepo) OfficerPerformance(ctx context.Context, f models.AnalyticsFilter, limit int) ([]models.OfficerPerformance, error) {
	where, args, idx := buildAnalyticsWhere(f)

	query := fmt.Sprintf(
		`SELECT t.officer_id,
		 COALESCE(u.first_name || ' ' || u.last_name, ''),
		 COALESCE(o.badge_number, ''),
		 COALESCE(s.name, ''),
		 COUNT(t.id),
		 COALESCE(SUM(t.total_fine), 0),
		 COALESCE(SUM(CASE WHEN t.status='paid' THEN COALESCE(t.paid_amount, t.total_fine) ELSE 0 END), 0)
		 FROM tickets t
		 LEFT JOIN officers o ON t.officer_id = o.id
		 LEFT JOIN users u ON o.user_id = u.id
		 LEFT JOIN stations s ON t.station_id = s.id
		 %s
		 GROUP BY t.officer_id, u.first_name, u.last_name, o.badge_number, s.name
		 ORDER BY COUNT(t.id) DESC LIMIT $%d`, where, idx)
	args = append(args, limit)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OfficerPerformance
	rank := 0
	for rows.Next() {
		rank++
		var item models.OfficerPerformance
		var collected float64
		if err := rows.Scan(&item.OfficerID, &item.OfficerName, &item.BadgeNumber, &item.StationName,
			&item.TicketCount, &item.TotalFines, &collected); err != nil {
			return nil, err
		}
		if item.TotalFines > 0 {
			item.CollectionRate = math.Round(collected/item.TotalFines*1000) / 10
		}
		item.Rank = rank
		items = append(items, item)
	}
	if items == nil {
		items = []models.OfficerPerformance{}
	}
	return items, rows.Err()
}
