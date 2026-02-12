package handlers

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

// parseID extracts and validates a UUID path parameter.
func parseID(w http.ResponseWriter, r *http.Request, param string) (uuid.UUID, bool) {
	idStr := chi.URLParam(r, param)
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid ID format", nil))
		return uuid.Nil, false
	}
	return id, true
}

// parseOptionalUUID extracts an optional UUID query parameter.
func parseOptionalUUID(r *http.Request, key string) *uuid.UUID {
	v := r.URL.Query().Get(key)
	if v == "" {
		return nil
	}
	id, err := uuid.Parse(v)
	if err != nil {
		return nil
	}
	return &id
}

// parseOptionalBool extracts an optional boolean query parameter.
func parseOptionalBool(r *http.Request, key string) *bool {
	v := r.URL.Query().Get(key)
	if v == "" {
		return nil
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return nil
	}
	return &b
}

// parseOptionalString extracts an optional string query parameter.
func parseOptionalString(r *http.Request, key string) *string {
	v := r.URL.Query().Get(key)
	if v == "" {
		return nil
	}
	return &v
}
