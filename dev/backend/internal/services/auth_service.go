package services

import (
	"context"
	"errors"
	"time"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/hash"
	jwtpkg "github.com/ghana-police/ticketing-backend/pkg/jwt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

const maxFailedLogins = 5
const lockDuration = 30 * time.Minute

type authService struct {
	userRepo   repositories.UserRepository
	jwtManager *jwtpkg.Manager
	logger     *zap.Logger
}

func NewAuthService(userRepo repositories.UserRepository, jwtManager *jwtpkg.Manager, logger *zap.Logger) portservices.AuthService {
	return &authService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
		logger:     logger,
	}
}

func (s *authService) Login(ctx context.Context, req *portservices.LoginRequest) (*portservices.LoginResult, error) {
	if req.Email == nil && req.BadgeNumber == nil {
		return nil, apperrors.NewValidationError("Email or badge number is required", nil)
	}
	if req.Password == "" {
		return nil, apperrors.NewValidationError("Password is required", nil)
	}

	// Find user
	var user *models.User
	var err error

	if req.BadgeNumber != nil && *req.BadgeNumber != "" {
		user, err = s.userRepo.FindByBadgeNumber(ctx, *req.BadgeNumber)
	} else {
		user, err = s.userRepo.FindByEmail(ctx, *req.Email)
	}

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewInvalidCredentials("Invalid credentials")
		}
		return nil, apperrors.NewInternal(err)
	}

	// Check if account is active
	if !user.IsActive {
		return nil, apperrors.NewForbidden("Account is deactivated")
	}

	// Check if account is locked
	if user.LockedUntil != nil && time.Now().Before(*user.LockedUntil) {
		return nil, &apperrors.AppError{
			Code:       "ACCOUNT_LOCKED",
			Message:    "Account has been locked due to multiple failed login attempts",
			HTTPStatus: 423,
		}
	}

	// Verify password
	if !hash.CheckPassword(req.Password, user.PasswordHash) {
		// Increment failed attempts
		var lockUntil *string
		if user.FailedLoginAttempts+1 >= maxFailedLogins {
			t := time.Now().Add(lockDuration).Format(time.RFC3339)
			lockUntil = &t
		}
		_ = s.userRepo.IncrementFailedLogins(ctx, user.ID, lockUntil)
		return nil, apperrors.NewInvalidCredentials("Invalid credentials")
	}

	// Reset failed login attempts on success
	if user.FailedLoginAttempts > 0 {
		_ = s.userRepo.ResetFailedLogins(ctx, user.ID)
	}

	// Generate access token
	claims := &jwtpkg.Claims{
		UserID: user.ID,
		Role:   user.Role,
	}
	if user.Officer != nil {
		claims.OfficerID = &user.Officer.ID
		claims.StationID = &user.Officer.StationID
		claims.RegionID = &user.Officer.RegionID
		claims.BadgeNumber = &user.Officer.BadgeNumber
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(claims)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Generate refresh token
	rawRefresh := s.jwtManager.GenerateRefreshToken()
	tokenHash := hash.HashToken(rawRefresh)

	rt := &models.RefreshToken{
		ID:         uuid.New(),
		UserID:     user.ID,
		TokenHash:  tokenHash,
		DeviceID:   req.DeviceID,
		DeviceInfo: req.DeviceInfo,
		ExpiresAt:  time.Now().Add(s.jwtManager.RefreshExpiry()),
	}

	if err := s.userRepo.SaveRefreshToken(ctx, rt); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Update last login
	_ = s.userRepo.UpdateLastLogin(ctx, user.ID)

	return &portservices.LoginResult{
		User:         user.ToResponse(),
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		ExpiresIn:    int(s.jwtManager.AccessExpiry().Seconds()),
	}, nil
}

func (s *authService) Logout(ctx context.Context, userID uuid.UUID, refreshToken *string) error {
	if refreshToken != nil && *refreshToken != "" {
		tokenHash := hash.HashToken(*refreshToken)
		_ = s.userRepo.RevokeRefreshToken(ctx, tokenHash)
	} else {
		_ = s.userRepo.RevokeAllUserTokens(ctx, userID)
	}
	return nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*portservices.RefreshResult, error) {
	tokenHash := hash.HashToken(refreshToken)

	rt, err := s.userRepo.FindRefreshTokenByHash(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewUnauthorized("Invalid refresh token")
		}
		return nil, apperrors.NewInternal(err)
	}

	// Check if revoked
	if rt.RevokedAt != nil {
		return nil, apperrors.NewUnauthorized("Refresh token has been revoked")
	}

	// Check if expired
	if time.Now().After(rt.ExpiresAt) {
		return nil, apperrors.NewUnauthorized("Refresh token has expired")
	}

	// Get user for claims
	user, err := s.userRepo.FindByID(ctx, rt.UserID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	if !user.IsActive {
		return nil, apperrors.NewForbidden("Account is deactivated")
	}

	// Generate new access token
	claims := &jwtpkg.Claims{
		UserID: user.ID,
		Role:   user.Role,
	}
	if user.Officer != nil {
		claims.OfficerID = &user.Officer.ID
		claims.StationID = &user.Officer.StationID
		claims.RegionID = &user.Officer.RegionID
		claims.BadgeNumber = &user.Officer.BadgeNumber
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(claims)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return &portservices.RefreshResult{
		AccessToken: accessToken,
		ExpiresIn:   int(s.jwtManager.AccessExpiry().Seconds()),
	}, nil
}

func (s *authService) GetProfile(ctx context.Context, userID uuid.UUID) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("User")
		}
		return nil, apperrors.NewInternal(err)
	}
	return user.ToResponse(), nil
}

func (s *authService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *portservices.UpdateProfileRequest) (*models.UserResponse, error) {
	firstName := ""
	lastName := ""

	// Get current user to fill defaults
	current, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	if req.FirstName != nil {
		firstName = *req.FirstName
	} else {
		firstName = current.FirstName
	}
	if req.LastName != nil {
		lastName = *req.LastName
	} else {
		lastName = current.LastName
	}

	user, err := s.userRepo.UpdateProfile(ctx, userID, firstName, lastName, req.Phone, req.Email, req.ProfilePhoto)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return user.ToResponse(), nil
}

func (s *authService) ChangePassword(ctx context.Context, userID uuid.UUID, req *portservices.ChangePasswordRequest) error {
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return apperrors.NewValidationError("Both current and new passwords are required", nil)
	}
	if len(req.NewPassword) < 8 {
		return apperrors.NewValidationError("New password must be at least 8 characters", nil)
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return apperrors.NewInternal(err)
	}

	if !hash.CheckPassword(req.CurrentPassword, user.PasswordHash) {
		return &apperrors.AppError{
			Code:       "INVALID_PASSWORD",
			Message:    "Current password is incorrect",
			HTTPStatus: 401,
		}
	}

	newHash, err := hash.HashPassword(req.NewPassword)
	if err != nil {
		return apperrors.NewInternal(err)
	}

	return s.userRepo.UpdatePassword(ctx, userID, newHash)
}
