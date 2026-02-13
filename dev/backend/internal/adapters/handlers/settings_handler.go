package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type SettingsHandler struct {
	svc portservices.SettingsService
}

func NewSettingsHandler(svc portservices.SettingsService) *SettingsHandler {
	return &SettingsHandler{svc: svc}
}

// GET /api/settings
func (h *SettingsHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	result, err := h.svc.GetAll(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/settings/{section}
func (h *SettingsHandler) GetBySection(w http.ResponseWriter, r *http.Request) {
	section := chi.URLParam(r, "section")
	result, err := h.svc.GetBySection(r.Context(), section)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// PUT /api/settings
func (h *SettingsHandler) UpdateAll(w http.ResponseWriter, r *http.Request) {
	var body map[string]json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid JSON body", nil))
		return
	}
	result, err := h.svc.UpdateAll(r.Context(), body)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// PUT /api/settings/{section}
func (h *SettingsHandler) UpdateSection(w http.ResponseWriter, r *http.Request) {
	section := chi.URLParam(r, "section")
	var value json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid JSON body", nil))
		return
	}
	result, err := h.svc.UpdateSection(r.Context(), section, value)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}
