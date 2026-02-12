package middleware

import (
	"context"
	"net/http"
	"strings"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	jwtpkg "github.com/ghana-police/ticketing-backend/pkg/jwt"
	"github.com/ghana-police/ticketing-backend/pkg/response"
	"github.com/google/uuid"
)

type contextKey string

const (
	UserIDKey      contextKey = "user_id"
	UserRoleKey    contextKey = "user_role"
	OfficerIDKey   contextKey = "officer_id"
	StationIDKey   contextKey = "station_id"
	RegionIDKey    contextKey = "region_id"
	BadgeNumberKey contextKey = "badge_number"
)

// Auth validates the JWT token and injects user claims into context.
func Auth(jwtManager *jwtpkg.Manager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Error(w, apperrors.NewUnauthorized("Missing authorization header"))
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
				response.Error(w, apperrors.NewUnauthorized("Invalid authorization format"))
				return
			}

			claims, err := jwtManager.ValidateToken(parts[1])
			if err != nil {
				if strings.Contains(err.Error(), "expired") {
					response.Error(w, apperrors.NewTokenExpired())
				} else {
					response.Error(w, apperrors.NewUnauthorized("Invalid token"))
				}
				return
			}

			// Inject claims into context
			ctx := r.Context()
			ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
			if claims.OfficerID != nil {
				ctx = context.WithValue(ctx, OfficerIDKey, *claims.OfficerID)
			}
			if claims.StationID != nil {
				ctx = context.WithValue(ctx, StationIDKey, *claims.StationID)
			}
			if claims.RegionID != nil {
				ctx = context.WithValue(ctx, RegionIDKey, *claims.RegionID)
			}
			if claims.BadgeNumber != nil {
				ctx = context.WithValue(ctx, BadgeNumberKey, *claims.BadgeNumber)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Helper functions to extract values from context

func GetUserID(ctx context.Context) uuid.UUID {
	if v, ok := ctx.Value(UserIDKey).(uuid.UUID); ok {
		return v
	}
	return uuid.Nil
}

func GetUserRole(ctx context.Context) string {
	if v, ok := ctx.Value(UserRoleKey).(string); ok {
		return v
	}
	return ""
}

func GetOfficerID(ctx context.Context) *uuid.UUID {
	if v, ok := ctx.Value(OfficerIDKey).(uuid.UUID); ok {
		return &v
	}
	return nil
}

func GetStationID(ctx context.Context) *uuid.UUID {
	if v, ok := ctx.Value(StationIDKey).(uuid.UUID); ok {
		return &v
	}
	return nil
}

func GetRegionID(ctx context.Context) *uuid.UUID {
	if v, ok := ctx.Value(RegionIDKey).(uuid.UUID); ok {
		return &v
	}
	return nil
}
