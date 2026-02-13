package handlers

import (
	"net/http"
	"time"

	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/response"
)

type LookupHandler struct {
	svc portservices.LookupService
}

func NewLookupHandler(svc portservices.LookupService) *LookupHandler {
	return &LookupHandler{svc: svc}
}

// GET /api/lookup
func (h *LookupHandler) GetLookupData(w http.ResponseWriter, r *http.Request) {
	var ifModifiedSince *time.Time
	if v := r.Header.Get("If-Modified-Since"); v != "" {
		if t, err := time.Parse(time.RFC1123, v); err == nil {
			ifModifiedSince = &t
		}
	}

	data, modified, err := h.svc.GetLookupData(r.Context(), ifModifiedSince)
	if err != nil {
		handleError(w, err)
		return
	}

	if !modified {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	w.Header().Set("Last-Modified", data.LastUpdated.UTC().Format(time.RFC1123))
	response.JSON(w, http.StatusOK, data)
}
