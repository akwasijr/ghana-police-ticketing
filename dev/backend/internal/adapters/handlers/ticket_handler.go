package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type TicketHandler struct {
	svc portservices.TicketService
}

func NewTicketHandler(svc portservices.TicketService) *TicketHandler {
	return &TicketHandler{svc: svc}
}

var ticketSorts = []string{"issuedAt", "totalFine", "ticketNumber", "status", "dueDate"}

// POST /api/tickets
func (h *TicketHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateTicketRequest
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

// GET /api/tickets
func (h *TicketHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := parseTicketFilter(r)
	p := pagination.Parse(r, ticketSorts, "issuedAt")

	items, total, err := h.svc.List(r.Context(), filter, p.Search, p)
	if err != nil {
		handleError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, items, pagination.NewMeta(p.Page, p.Limit, total))
}

// GET /api/tickets/{id}
func (h *TicketHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	ticket, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, ticket)
}

// GET /api/tickets/number/{ticketNumber}
func (h *TicketHandler) GetByNumber(w http.ResponseWriter, r *http.Request) {
	ticketNumber := chi.URLParam(r, "ticketNumber")
	if ticketNumber == "" {
		response.Error(w, apperrors.NewValidationError("Ticket number is required", nil))
		return
	}
	ticket, err := h.svc.GetByNumber(r.Context(), ticketNumber)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, ticket)
}

// PATCH /api/tickets/{id}
func (h *TicketHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateTicketRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	ticket, err := h.svc.Update(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, ticket)
}

// POST /api/tickets/{id}/void
func (h *TicketHandler) Void(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var body struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	ticket, err := h.svc.Void(r.Context(), id, body.Reason)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, ticket)
}

// GET /api/tickets/stats
func (h *TicketHandler) Stats(w http.ResponseWriter, r *http.Request) {
	filter := parseTicketFilter(r)
	stats, err := h.svc.Stats(r.Context(), filter)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

// GET /api/tickets/search
func (h *TicketHandler) Search(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if len(q) < 2 {
		response.Error(w, apperrors.NewValidationError("Search query must be at least 2 characters", nil))
		return
	}
	results, err := h.svc.Search(r.Context(), q)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, results)
}

// POST /api/tickets/{id}/photos
func (h *TicketHandler) UploadPhoto(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}

	// Limit to 5MB + some overhead
	r.Body = http.MaxBytesReader(w, r.Body, 5*1024*1024+512)

	if err := r.ParseMultipartForm(5 * 1024 * 1024); err != nil {
		response.Error(w, apperrors.NewValidationError("File too large (max 5MB)", nil))
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		response.Error(w, apperrors.NewValidationError("Photo file is required", nil))
		return
	}
	defer file.Close()

	photoType := r.FormValue("type")
	if photoType == "" {
		photoType = "other"
	}

	data, err := io.ReadAll(file)
	if err != nil {
		response.Error(w, apperrors.NewValidationError("Failed to read file", nil))
		return
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	result, err := h.svc.UploadPhoto(r.Context(), id, photoType, data, header.Filename, mimeType)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

// parseTicketFilter extracts ticket filter parameters from request.
func parseTicketFilter(r *http.Request) models.TicketFilter {
	filter := models.TicketFilter{
		Status:    parseOptionalString(r, "status"),
		OfficerID: parseOptionalUUID(r, "officerId"),
		StationID: parseOptionalUUID(r, "stationId"),
		RegionID:  parseOptionalUUID(r, "regionId"),
		Category:  parseOptionalString(r, "category"),
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
