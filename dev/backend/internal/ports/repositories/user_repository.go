package repositories

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/google/uuid"
)

type UserRepository interface {
	// FindByEmail returns a user with optional officer details.
	FindByEmail(ctx context.Context, email string) (*models.User, error)

	// FindByBadgeNumber finds a user via their officer badge number.
	FindByBadgeNumber(ctx context.Context, badgeNumber string) (*models.User, error)

	// FindByID returns a user by ID with optional officer details.
	FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)

	// UpdateLastLogin sets the last_login_at timestamp.
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error

	// UpdateProfile updates user profile fields.
	UpdateProfile(ctx context.Context, id uuid.UUID, firstName, lastName string, phone, email *string, profilePhoto *string) (*models.User, error)

	// UpdatePassword changes the user's password hash.
	UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error

	// IncrementFailedLogins increments failed_login_attempts and optionally locks the account.
	IncrementFailedLogins(ctx context.Context, id uuid.UUID, lockUntil *string) error

	// ResetFailedLogins resets failed_login_attempts to 0.
	ResetFailedLogins(ctx context.Context, id uuid.UUID) error

	// SaveRefreshToken stores a hashed refresh token.
	SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error

	// FindRefreshToken finds a refresh token by its hash.
	FindRefreshTokenByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error)

	// RevokeRefreshToken marks a refresh token as revoked.
	RevokeRefreshToken(ctx context.Context, tokenHash string) error

	// RevokeAllUserTokens revokes all refresh tokens for a user.
	RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error
}
