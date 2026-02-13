package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type ObjectionHandler struct {
	svc portservices.ObjectionService
}

func NewObjectionHandler(svc portservices.ObjectionService) *ObjectionHandler {
	return &ObjectionHandler{svc: svc}
}

var objectionSorts = []string{"createdAt", "submittedAt", "reviewedAt", "status", "fineAmount"}

// POST /api/objections
func (h *ObjectionHandler) File(w http.ResponseWriter, r *http.Request) {
	var req portservices.FileObjectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	result, err := h.svc.File(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

// GET /api/objections
func (h *ObjectionHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := parseObjectionFilter(r)
	p := pagination.Parse(r, objectionSorts, "createdAt")

	items, total, err := h.svc.List(r.Context(), filter, p.Search, p)
	if err != nil {
		handleError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, items, pagination.NewMeta(p.Page, p.Limit, total))
}

// GET /api/objections/{id}
func (h *ObjectionHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	objection, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, objection)
}

// POST /api/objections/{id}/review
func (h *ObjectionHandler) Review(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.ReviewObjectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	result, err := h.svc.Review(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/objections/stats
func (h *ObjectionHandler) Stats(w http.ResponseWriter, r *http.Request) {
	filter := parseObjectionFilter(r)
	stats, err := h.svc.Stats(r.Context(), filter)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func parseObjectionFilter(r *http.Request) models.ObjectionFilter {
	filter := models.ObjectionFilter{
		Status:    parseOptionalString(r, "status"),
		StationID: parseOptionalUUID(r, "stationId"),
		RegionID:  parseOptionalUUID(r, "regionId"),
	}
	if v := r.URL.Query().Get("dateFrom"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			filter.DateFrom = &t
		}
	}
	if v := r.URL.Query().Get("dateTo"); v != "" {
		if t, err := time.Parse("2006-01-02", v); err == nil {
			endOfDay := t.Add(24*time.Hour - time.Nanosecond)
			filter.DateTo = &endOfDay
		}
	}
	if v := r.URL.Query().Get("minAmount"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			filter.MinAmount = &f
		}
	}
	if v := r.URL.Query().Get("maxAmount"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			filter.MaxAmount = &f
		}
	}
	return filter
}
