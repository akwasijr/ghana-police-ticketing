package postgres

import (
	"context"
	"fmt"
	"strings"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type offenceRepo struct {
	db *pgxpool.Pool
}

func NewOffenceRepo(db *pgxpool.Pool) repositories.OffenceRepository {
	return &offenceRepo{db: db}
}

const offenceCols = `id, code, name, description, legal_basis, category, default_fine, min_fine, max_fine, points, is_active, created_at, updated_at`

func scanOffence(scanner interface{ Scan(...interface{}) error }) (*models.Offence, error) {
	var o models.Offence
	err := scanner.Scan(&o.ID, &o.Code, &o.Name, &o.Description, &o.LegalBasis, &o.Category,
		&o.DefaultFine, &o.MinFine, &o.MaxFine, &o.Points, &o.IsActive, &o.CreatedAt, &o.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *offenceRepo) List(ctx context.Context, category *string, isActive *bool, search string) ([]models.Offence, error) {
	query := "SELECT " + offenceCols + " FROM offences"

	var conditions []string
	var args []interface{}
	argIdx := 1

	if category != nil {
		conditions = append(conditions, fmt.Sprintf("category = $%d", argIdx))
		args = append(args, *category)
		argIdx++
	}
	if isActive != nil {
		conditions = append(conditions, fmt.Sprintf("is_active = $%d", argIdx))
		args = append(args, *isActive)
		argIdx++
	}
	if search != "" {
		conditions = append(conditions, fmt.Sprintf("(name ILIKE $%d OR code ILIKE $%d OR description ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY category, code"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offences []models.Offence
	for rows.Next() {
		o, err := scanOffence(rows)
		if err != nil {
			return nil, err
		}
		offences = append(offences, *o)
	}
	return offences, rows.Err()
}

func (r *offenceRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Offence, error) {
	row := r.db.QueryRow(ctx, "SELECT "+offenceCols+" FROM offences WHERE id = $1", id)
	return scanOffence(row)
}

func (r *offenceRepo) Create(ctx context.Context, offence *models.Offence) error {
	return r.db.QueryRow(ctx,
		`INSERT INTO offences (code, name, description, legal_basis, category, default_fine, min_fine, max_fine, points)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, is_active, created_at, updated_at`,
		offence.Code, offence.Name, offence.Description, offence.LegalBasis, offence.Category,
		offence.DefaultFine, offence.MinFine, offence.MaxFine, offence.Points).
		Scan(&offence.ID, &offence.IsActive, &offence.CreatedAt, &offence.UpdatedAt)
}

func (r *offenceRepo) Update(ctx context.Context, offence *models.Offence) error {
	return r.db.QueryRow(ctx,
		`UPDATE offences SET code=$1, name=$2, description=$3, legal_basis=$4, category=$5,
		        default_fine=$6, min_fine=$7, max_fine=$8, points=$9, is_active=$10, updated_at=NOW()
		 WHERE id=$11 RETURNING updated_at`,
		offence.Code, offence.Name, offence.Description, offence.LegalBasis, offence.Category,
		offence.DefaultFine, offence.MinFine, offence.MaxFine, offence.Points, offence.IsActive, offence.ID).
		Scan(&offence.UpdatedAt)
}

func (r *offenceRepo) Deactivate(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE offences SET is_active=false, updated_at=NOW() WHERE id=$1`, id)
	return err
}

func (r *offenceRepo) SetActive(ctx context.Context, id uuid.UUID, active bool) (*models.Offence, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE offences SET is_active=$1, updated_at=NOW() WHERE id=$2
		 RETURNING `+offenceCols, active, id)
	return scanOffence(row)
}

func (r *offenceRepo) CodeExists(ctx context.Context, code string, excludeID *uuid.UUID) (bool, error) {
	var exists bool
	if excludeID != nil {
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM offences WHERE code=$1 AND id!=$2)`, code, *excludeID).Scan(&exists)
		return exists, err
	}
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM offences WHERE code=$1)`, code).Scan(&exists)
	return exists, err
}

func (r *offenceRepo) IsReferencedByTickets(ctx context.Context, offenceID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM ticket_offences WHERE offence_id=$1)`, offenceID).Scan(&exists)
	return exists, err
}

func (r *offenceRepo) HasActiveTickets(ctx context.Context, offenceID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(
			SELECT 1 FROM ticket_offences to2
			JOIN tickets t ON to2.ticket_id = t.id
			WHERE to2.offence_id=$1 AND t.status = 'unpaid'
		)`, offenceID).Scan(&exists)
	return exists, err
}
