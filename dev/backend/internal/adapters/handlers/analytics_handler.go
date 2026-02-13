package handlers

import (
	"net/http"
	"strconv"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type AnalyticsHandler struct {
	svc portservices.AnalyticsService
}

func NewAnalyticsHandler(svc portservices.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

// GET /api/analytics/summary
func (h *AnalyticsHandler) Summary(w http.ResponseWriter, r *http.Request) {
	f := parseAnalyticsFilter(r)
	result, err := h.svc.Summary(r.Context(), f)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/analytics/trends
func (h *AnalyticsHandler) Trends(w http.ResponseWriter, r *http.Request) {
	f := parseAnalyticsFilter(r)
	groupBy := r.URL.Query().Get("groupBy")
	result, err := h.svc.Trends(r.Context(), f, groupBy)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/analytics/top-offences
func (h *AnalyticsHandler) TopOffences(w http.ResponseWriter, r *http.Request) {
	f := parseAnalyticsFilter(r)
	limit := parseIntParam(r, "limit", 10)
	result, err := h.svc.TopOffences(r.Context(), f, limit)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/analytics/by-region
func (h *AnalyticsHandler) ByRegion(w http.ResponseWriter, r *http.Request) {
	f := parseAnalyticsFilter(r)
	result, err := h.svc.ByRegion(r.Context(), f)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/analytics/revenue
func (h *AnalyticsHandler) Revenue(w http.ResponseWriter, r *http.Request) {
	f := parseAnalyticsFilter(r)
	groupBy := r.URL.Query().Get("groupBy")
	result, err := h.svc.Revenue(r.Context(), f, groupBy)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/analytics/officer-performance
func (h *AnalyticsHandler) OfficerPerformance(w http.ResponseWriter, r *http.Request) {
	f := parseAnalyticsFilter(r)
	limit := parseIntParam(r, "limit", 10)
	result, err := h.svc.OfficerPerformance(r.Context(), f, limit)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

func parseAnalyticsFilter(r *http.Request) models.AnalyticsFilter {
	return models.AnalyticsFilter{
		StartDate: r.URL.Query().Get("startDate"),
		EndDate:   r.URL.Query().Get("endDate"),
		RegionID:  parseOptionalUUID(r, "regionId"),
		StationID: parseOptionalUUID(r, "stationId"),
		OfficerID: parseOptionalUUID(r, "officerId"),
	}
}

func parseIntParam(r *http.Request, key string, defaultVal int) int {
	v := r.URL.Query().Get(key)
	if v == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return defaultVal
	}
	return n
}
