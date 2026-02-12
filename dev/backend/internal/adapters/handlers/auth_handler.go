package handlers

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type AuthHandler struct {
	authService portservices.AuthService
}

func NewAuthHandler(authService portservices.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// POST /api/auth/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req portservices.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}

	result, err := h.authService.Login(r.Context(), &req)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			response.Error(w, appErr)
		} else {
			response.InternalError(w)
		}
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"user": result.User,
		"tokens": map[string]any{
			"accessToken":  result.AccessToken,
			"refreshToken": result.RefreshToken,
			"expiresIn":    result.ExpiresIn,
		},
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var body struct {
		RefreshToken *string `json:"refreshToken"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	if err := h.authService.Logout(r.Context(), userID, body.RefreshToken); err != nil {
		response.InternalError(w)
		return
	}

	response.JSONMessage(w, http.StatusOK, "Logout successful")
}

// POST /api/auth/refresh
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refreshToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		response.Error(w, apperrors.NewValidationError("Refresh token is required", nil))
		return
	}

	result, err := h.authService.RefreshToken(r.Context(), body.RefreshToken)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			response.Error(w, appErr)
		} else {
			response.InternalError(w)
		}
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// GET /api/auth/profile
func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	profile, err := h.authService.GetProfile(r.Context(), userID)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			response.Error(w, appErr)
		} else {
			response.InternalError(w)
		}
		return
	}

	response.JSON(w, http.StatusOK, profile)
}

// PUT /api/auth/profile
func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req portservices.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}

	profile, err := h.authService.UpdateProfile(r.Context(), userID, &req)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			response.Error(w, appErr)
		} else {
			response.InternalError(w)
		}
		return
	}

	response.JSON(w, http.StatusOK, profile)
}

// POST /api/auth/change-password
func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req portservices.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}

	if err := h.authService.ChangePassword(r.Context(), userID, &req); err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			response.Error(w, appErr)
		} else {
			response.InternalError(w)
		}
		return
	}

	response.JSONMessage(w, http.StatusOK, "Password changed successfully")
}

// POST /api/auth/forgot-password
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	// Always return success to prevent user enumeration
	response.JSONMessage(w, http.StatusOK, "If an account with that email exists, password reset instructions have been sent.")
}

// POST /api/auth/reset-password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	// Stub - will be implemented when email service is available
	response.Error(w, &apperrors.AppError{
		Code:       "NOT_IMPLEMENTED",
		Message:    "Password reset via token is not yet available",
		HTTPStatus: http.StatusNotImplemented,
	})
}
