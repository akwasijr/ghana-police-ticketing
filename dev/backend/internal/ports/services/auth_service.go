package services

import (
	"context"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/google/uuid"
)

type LoginRequest struct {
	Email       *string `json:"email"`
	BadgeNumber *string `json:"badgeNumber"`
	Password    string  `json:"password"`
	DeviceID    *string `json:"deviceId"`
	DeviceInfo  any     `json:"deviceInfo"`
}

type LoginResult struct {
	User         *models.UserResponse `json:"user"`
	AccessToken  string               `json:"accessToken"`
	RefreshToken string               `json:"refreshToken"`
	ExpiresIn    int                  `json:"expiresIn"`
}

type RefreshResult struct {
	AccessToken string `json:"accessToken"`
	ExpiresIn   int    `json:"expiresIn"`
}

type UpdateProfileRequest struct {
	FirstName    *string `json:"firstName"`
	LastName     *string `json:"lastName"`
	Phone        *string `json:"phone"`
	Email        *string `json:"email"`
	ProfilePhoto *string `json:"profilePhoto"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type AuthService interface {
	Login(ctx context.Context, req *LoginRequest) (*LoginResult, error)
	Logout(ctx context.Context, userID uuid.UUID, refreshToken *string) error
	RefreshToken(ctx context.Context, refreshToken string) (*RefreshResult, error)
	GetProfile(ctx context.Context, userID uuid.UUID) (*models.UserResponse, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, req *UpdateProfileRequest) (*models.UserResponse, error)
	ChangePassword(ctx context.Context, userID uuid.UUID, req *ChangePasswordRequest) error
}
