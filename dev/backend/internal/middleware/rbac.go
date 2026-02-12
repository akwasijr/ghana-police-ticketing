package middleware

import (
	"net/http"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

// RequireRole returns middleware that restricts access to the specified roles.
func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetUserRole(r.Context())
			if !allowed[role] {
				response.Error(w, apperrors.NewForbidden("Insufficient permissions"))
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
