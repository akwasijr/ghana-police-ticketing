package handlers

import (
	"net/http"
	"time"

	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type AuditHandler struct {
	svc portservices.AuditService
}

func NewAuditHandler(svc portservices.AuditService) *AuditHandler {
	return &AuditHandler{svc: svc}
}

var auditSorts = []string{"createdAt", "timestamp", "action", "severity"}

// GET /api/audit/logs
func (h *AuditHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := parseAuditFilter(r)
	p := pagination.Parse(r, auditSorts, "createdAt")

	items, total, err := h.svc.List(r.Context(), filter, p.Search, p)
	if err != nil {
		handleError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, items, pagination.NewMeta(p.Page, p.Limit, total))
}

// GET /api/audit/logs/{id}
func (h *AuditHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	entry, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, entry)
}

// GET /api/audit/stats
func (h *AuditHandler) Stats(w http.ResponseWriter, r *http.Request) {
	filter := parseAuditFilter(r)
	stats, err := h.svc.Stats(r.Context(), filter)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

func parseAuditFilter(r *http.Request) models.AuditFilter {
	filter := models.AuditFilter{
		Action:     parseOptionalString(r, "action"),
		EntityType: parseOptionalString(r, "entityType"),
		UserID:     parseOptionalUUID(r, "userId"),
		Severity:   parseOptionalString(r, "severity"),
		StationID:  parseOptionalUUID(r, "stationId"),
		RegionID:   parseOptionalUUID(r, "regionId"),
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
	return filter
}
