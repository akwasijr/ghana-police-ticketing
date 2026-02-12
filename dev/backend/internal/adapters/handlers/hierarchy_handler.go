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

type HierarchyHandler struct {
	svc portservices.HierarchyService
}

func NewHierarchyHandler(svc portservices.HierarchyService) *HierarchyHandler {
	return &HierarchyHandler{svc: svc}
}

// ============================================================
// REGIONS
// ============================================================

func (h *HierarchyHandler) ListRegions(w http.ResponseWriter, r *http.Request) {
	regions, err := h.svc.ListRegions(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, regions)
}

func (h *HierarchyHandler) GetRegion(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	region, err := h.svc.GetRegion(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, region)
}

func (h *HierarchyHandler) CreateRegion(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateRegionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	region, err := h.svc.CreateRegion(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, region)
}

func (h *HierarchyHandler) UpdateRegion(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateRegionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	region, err := h.svc.UpdateRegion(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, region)
}

func (h *HierarchyHandler) DeleteRegion(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.svc.DeleteRegion(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	response.JSONMessage(w, http.StatusOK, "Region deactivated successfully")
}

// ============================================================
// DIVISIONS
// ============================================================

func (h *HierarchyHandler) ListDivisions(w http.ResponseWriter, r *http.Request) {
	regionID := parseOptionalUUID(r, "regionId")
	divisions, err := h.svc.ListDivisions(r.Context(), regionID)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, divisions)
}

func (h *HierarchyHandler) GetDivision(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	div, err := h.svc.GetDivision(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, div)
}

func (h *HierarchyHandler) CreateDivision(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateDivisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	div, err := h.svc.CreateDivision(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, div)
}

func (h *HierarchyHandler) UpdateDivision(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateDivisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	div, err := h.svc.UpdateDivision(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, div)
}

func (h *HierarchyHandler) DeleteDivision(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.svc.DeleteDivision(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	response.JSONMessage(w, http.StatusOK, "Division deactivated successfully")
}

// ============================================================
// DISTRICTS
// ============================================================

func (h *HierarchyHandler) ListDistricts(w http.ResponseWriter, r *http.Request) {
	divisionID := parseOptionalUUID(r, "divisionId")
	regionID := parseOptionalUUID(r, "regionId")
	districts, err := h.svc.ListDistricts(r.Context(), divisionID, regionID)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, districts)
}

func (h *HierarchyHandler) GetDistrict(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	dist, err := h.svc.GetDistrict(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, dist)
}

func (h *HierarchyHandler) CreateDistrict(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateDistrictRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	dist, err := h.svc.CreateDistrict(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, dist)
}

func (h *HierarchyHandler) UpdateDistrict(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateDistrictRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	dist, err := h.svc.UpdateDistrict(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, dist)
}

func (h *HierarchyHandler) DeleteDistrict(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.svc.DeleteDistrict(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	response.JSONMessage(w, http.StatusOK, "District deactivated successfully")
}

// ============================================================
// STATIONS
// ============================================================

var stationSorts = []string{"name", "code", "type", "createdAt"}

func (h *HierarchyHandler) ListStations(w http.ResponseWriter, r *http.Request) {
	filter := models.StationFilter{
		RegionID:   parseOptionalUUID(r, "regionId"),
		DivisionID: parseOptionalUUID(r, "divisionId"),
		DistrictID: parseOptionalUUID(r, "districtId"),
		IsActive:   parseOptionalBool(r, "isActive"),
		Type:       parseOptionalString(r, "type"),
	}
	p := pagination.Parse(r, stationSorts, "name")

	stations, total, err := h.svc.ListStations(r.Context(), filter, p.Search, p)
	if err != nil {
		handleError(w, err)
		return
	}

	response.Paginated(w, http.StatusOK, stations, pagination.NewMeta(p.Page, p.Limit, total))
}

func (h *HierarchyHandler) GetStation(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	station, err := h.svc.GetStation(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, station)
}

func (h *HierarchyHandler) CreateStation(w http.ResponseWriter, r *http.Request) {
	var req portservices.CreateStationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	station, err := h.svc.CreateStation(r.Context(), &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusCreated, station)
}

func (h *HierarchyHandler) UpdateStation(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var req portservices.UpdateStationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, apperrors.NewValidationError("Invalid request body", nil))
		return
	}
	station, err := h.svc.UpdateStation(r.Context(), id, &req)
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, station)
}

func (h *HierarchyHandler) DeleteStation(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.svc.DeleteStation(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}
	response.JSONMessage(w, http.StatusOK, "Station deactivated successfully")
}

func (h *HierarchyHandler) GetStationStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.GetStationStats(r.Context())
	if err != nil {
		handleError(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

// handleError maps AppError to response; falls back to 500.
func handleError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*apperrors.AppError); ok {
		response.Error(w, appErr)
	} else {
		response.InternalError(w)
	}
}
