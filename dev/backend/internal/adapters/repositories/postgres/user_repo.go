package postgres

import (
	"context"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/google/uuid"
)

type UserRepo struct {
	db *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *UserRepo {
	return &UserRepo{db: db}
}

const userWithOfficerQuery = `
SELECT
    u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone,
    u.role, u.is_active, u.profile_photo_url, u.last_login_at,
    u.password_changed_at, u.failed_login_attempts, u.locked_until,
    u.created_at, u.updated_at,
    o.id, o.badge_number, o.rank, o.station_id, o.region_id, o.assigned_device_id,
    s.id, s.name, s.code
FROM users u
LEFT JOIN officers o ON o.user_id = u.id
LEFT JOIN stations s ON s.id = o.station_id
`

func scanUserWithOfficer(row pgx.Row) (*models.User, error) {
	var u models.User
	var officerID *uuid.UUID
	var badgeNumber, rank, assignedDeviceID *string
	var stationID, regionID *uuid.UUID
	var sID *uuid.UUID
	var sName, sCode *string

	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Phone,
		&u.Role, &u.IsActive, &u.ProfilePhotoURL, &u.LastLoginAt,
		&u.PasswordChangedAt, &u.FailedLoginAttempts, &u.LockedUntil,
		&u.CreatedAt, &u.UpdatedAt,
		&officerID, &badgeNumber, &rank, &stationID, &regionID, &assignedDeviceID,
		&sID, &sName, &sCode,
	)
	if err != nil {
		return nil, err
	}

	if officerID != nil {
		info := &models.OfficerInfo{
			ID:               *officerID,
			BadgeNumber:      *badgeNumber,
			Rank:             rank,
			StationID:        *stationID,
			RegionID:         *regionID,
			AssignedDeviceID: assignedDeviceID,
		}
		if rank != nil {
			if display, ok := models.RankDisplayMap[*rank]; ok {
				info.RankDisplay = display
			}
		}
		if sID != nil {
			info.Station = &models.StationInfo{
				ID:   *sID,
				Name: *sName,
				Code: *sCode,
			}
		}
		u.Officer = info
	}

	return &u, nil
}

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	row := r.db.QueryRow(ctx, userWithOfficerQuery+"WHERE u.email = $1", email)
	return scanUserWithOfficer(row)
}

func (r *UserRepo) FindByBadgeNumber(ctx context.Context, badgeNumber string) (*models.User, error) {
	row := r.db.QueryRow(ctx, userWithOfficerQuery+"WHERE o.badge_number = $1", badgeNumber)
	return scanUserWithOfficer(row)
}

func (r *UserRepo) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	row := r.db.QueryRow(ctx, userWithOfficerQuery+"WHERE u.id = $1", id)
	return scanUserWithOfficer(row)
}

func (r *UserRepo) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		"UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", id)
	return err
}

func (r *UserRepo) UpdateProfile(ctx context.Context, id uuid.UUID, firstName, lastName string, phone, email, profilePhoto *string) (*models.User, error) {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET
			first_name = COALESCE($2, first_name),
			last_name = COALESCE($3, last_name),
			phone = COALESCE($4, phone),
			email = COALESCE($5, email),
			profile_photo_url = COALESCE($6, profile_photo_url),
			updated_at = NOW()
		WHERE id = $1`,
		id, firstName, lastName, phone, email, profilePhoto)
	if err != nil {
		return nil, err
	}
	return r.FindByID(ctx, id)
}

func (r *UserRepo) UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	_, err := r.db.Exec(ctx,
		"UPDATE users SET password_hash = $2, password_changed_at = NOW(), updated_at = NOW() WHERE id = $1",
		id, passwordHash)
	return err
}

func (r *UserRepo) IncrementFailedLogins(ctx context.Context, id uuid.UUID, lockUntil *string) error {
	if lockUntil != nil {
		_, err := r.db.Exec(ctx,
			"UPDATE users SET failed_login_attempts = failed_login_attempts + 1, locked_until = $2, updated_at = NOW() WHERE id = $1",
			id, lockUntil)
		return err
	}
	_, err := r.db.Exec(ctx,
		"UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() WHERE id = $1", id)
	return err
}

func (r *UserRepo) ResetFailedLogins(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		"UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1", id)
	return err
}

func (r *UserRepo) SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO refresh_tokens (id, user_id, token_hash, device_id, device_info, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		token.ID, token.UserID, token.TokenHash, token.DeviceID, token.DeviceInfo, token.ExpiresAt)
	return err
}

func (r *UserRepo) FindRefreshTokenByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
	var t models.RefreshToken
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, token_hash, device_id, device_info, expires_at, revoked_at, created_at
		FROM refresh_tokens WHERE token_hash = $1`, tokenHash).
		Scan(&t.ID, &t.UserID, &t.TokenHash, &t.DeviceID, &t.DeviceInfo,
			&t.ExpiresAt, &t.RevokedAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *UserRepo) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	_, err := r.db.Exec(ctx,
		"UPDATE refresh_tokens SET revoked_at = $2 WHERE token_hash = $1",
		tokenHash, time.Now())
	return err
}

func (r *UserRepo) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		"UPDATE refresh_tokens SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL",
		userID, time.Now())
	return err
}
