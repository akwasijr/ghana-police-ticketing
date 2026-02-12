package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	db  *pgxpool.Pool
	rdb *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, rdb *redis.Client) *HealthHandler {
	return &HealthHandler{db: db, rdb: rdb}
}

type healthResponse struct {
	Status    string        `json:"status"`
	Version   string        `json:"version"`
	Timestamp string        `json:"timestamp"`
	Services  serviceStatus `json:"services"`
}

type serviceStatus struct {
	Database bool `json:"database"`
	Cache    bool `json:"cache"`
	Storage  bool `json:"storage"`
}

func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	services := serviceStatus{
		Database: h.checkDB(ctx),
		Cache:    h.checkRedis(ctx),
		Storage:  true, // Local storage always available
	}

	status := "healthy"
	httpStatus := http.StatusOK

	if !services.Database {
		status = "unhealthy"
		httpStatus = http.StatusServiceUnavailable
	} else if !services.Cache || !services.Storage {
		status = "degraded"
	}

	resp := healthResponse{
		Status:    status,
		Version:   "1.0.0",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Services:  services,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	json.NewEncoder(w).Encode(resp)
}

func (h *HealthHandler) checkDB(ctx context.Context) bool {
	return h.db.Ping(ctx) == nil
}

func (h *HealthHandler) checkRedis(ctx context.Context) bool {
	return h.rdb.Ping(ctx).Err() == nil
}
