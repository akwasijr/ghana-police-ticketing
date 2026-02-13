package handlers

import (
	"encoding/json"
	"net/http"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type SyncHandler struct {
	service portservices.SyncService
}

func NewSyncHandler(service portservices.SyncService) *SyncHandler {
	return &SyncHandler{service: service}
}

// BatchSync handles POST /sync
func (h *SyncHandler) BatchSync(w http.ResponseWriter, r *http.Request) {
	var req models.SyncRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}

	// Device ID from header or query
	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		deviceID = r.URL.Query().Get("deviceId")
	}

	result, err := h.service.BatchSync(r.Context(), &req, deviceID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, result)
}

// GetStatus handles GET /sync/status
func (h *SyncHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("deviceId")
	if deviceID == "" {
		deviceID = r.Header.Get("X-Device-ID")
	}

	status, err := h.service.GetStatus(r.Context(), deviceID)
	if err != nil {
		handleError(w, err)
		return
	}

	response.JSON(w, http.StatusOK, status)
}
