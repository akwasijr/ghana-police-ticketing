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

type PaymentHandler struct {
	svc portservices.PaymentService
}

func NewPaymentHandler(svc portservices.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

var paymentSorts = []string{"createdAt", "amount", "status", "method", "completedAt"}

// POST /api/payments/initiate
func (h *PaymentHandler) Initiate(w http.ResponseWriter, r *http.Request) {
	var req portservices.InitiatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	result, err := h.svc.InitiateDigital(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, result)
}

// POST /api/payments/cash
func (h *PaymentHandler) RecordCash(w http.ResponseWriter, r *http.Request) {
	var req portservices.RecordCashRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	payment, err := h.svc.RecordCash(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, payment)
}

// POST /api/payments/verify
func (h *PaymentHandler) Verify(w http.ResponseWriter, r *http.Request) {
	var req portservices.VerifyPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	result, err := h.svc.Verify(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, result)
}

// GET /api/payments
func (h *PaymentHandler) List(w http.ResponseWriter, r *http.Request) {
	filter := parsePaymentFilter(r)
	p := pagination.Parse(r, paymentSorts, "createdAt")

	items, total, err := h.svc.List(r.Context(), filter, p.Search, p)
	if err != nil {
		handleError(w, err)
		return
	}
	response.Paginated(w, http.StatusOK, items, pagination.NewMeta(p.Page, p.Limit, total))
}

// GET /api/payments/{id}
func (h *PaymentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	payment, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, payment)
}

// GET /api/payments/stats
func (h *PaymentHandler) Stats(w http.ResponseWriter, r *http.Request) {
	filter := parsePaymentFilter(r)
	stats, err := h.svc.Stats(r.Context(), filter)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

// GET /api/payments/{id}/receipt
func (h *PaymentHandler) Receipt(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	receipt, err := h.svc.Receipt(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, receipt)
}

func parsePaymentFilter(r *http.Request) models.PaymentFilter {
	filter := models.PaymentFilter{
		Status:        parseOptionalString(r, "status"),
		Method:        parseOptionalString(r, "method"),
		StationID:     parseOptionalUUID(r, "stationId"),
		ProcessedByID: parseOptionalUUID(r, "processedById"),
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
