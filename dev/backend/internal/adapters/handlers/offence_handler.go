package handlers

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type OffenceHandler struct {
	svc portservices.OffenceService
}

func NewOffenceHandler(svc portservices.OffenceService) *OffenceHandler {
	return &OffenceHandler{svc: svc}
}

func (h *OffenceHandler) List(w http.ResponseWriter, r *http.Request) {
	category := parseOptionalString(r, "category")
	isActive := parseOptionalBool(r, "isActive")
	search := r.URL.Query().Get("search")

	offences, err := h.svc.List(r.Context(), category, isActive, search)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, offences)
}

func (h *OffenceHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	offence, err := h.svc.Get(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, offence)
}

func (h *OffenceHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateOffenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	offence, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, offence)
}

func (h *OffenceHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateOffenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	offence, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, offence)
}

func (h *OffenceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	response.JSONMessage(w, http.StatusOK, "Offence deactivated successfully")
}

func (h *OffenceHandler) Toggle(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	offence, err := h.svc.Toggle(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, offence)
}
