package handlers

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type OfficerHandler struct {
	svc portservices.OfficerService
}

func NewOfficerHandler(svc portservices.OfficerService) *OfficerHandler {
	return &OfficerHandler{svc: svc}
}

var officerSorts = []string{"name", "badge", "rank", "station", "createdAt"}

func (h *OfficerHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := models.OfficerFilter{
		StationID: parseOptionalUUID(r, "stationId"),
		RegionID:  parseOptionalUUID(r, "regionId"),
		Rank:      parseOptionalString(r, "rank"),
		Role:      parseOptionalString(r, "role"),
		IsActive:  parseOptionalBool(r, "isActive"),
	}
	p := pagination.Parse(r, officerSorts, "name")

	officers, total, err := h.svc.List(r.Context(), filter, p.Search, p)
	if err != nil {
		handleError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, officers, pagination.NewMeta(p.Page, p.Limit, total))
}

func (h *OfficerHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	officer, err := h.svc.Get(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, officer)
}

func (h *OfficerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateOfficerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	result, err := h.svc.Create(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

func (h *OfficerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateOfficerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	officer, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, officer)
}

func (h *OfficerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	response.JSONMessage(w, http.StatusOK, "Officer has been deactivated successfully")
}

func (h *OfficerHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	stats, err := h.svc.GetStats(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func (h *OfficerHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	result, err := h.svc.ResetPassword(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}
