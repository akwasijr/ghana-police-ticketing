package router

import (
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/ghana-police/ticketing-backend/internal/adapters/handlers"
	"github.com/ghana-police/ticketing-backend/internal/config"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
)

func New(cfg *config.Config, logger *zap.Logger, db *pgxpool.Pool, rdb *redis.Client) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logging(logger))
	r.Use(middleware.CORS(cfg))
	r.Use(chimw.RealIP)
	r.Use(chimw.RequestID)

	// Health check (no auth)
	healthHandler := handlers.NewHealthHandler(db, rdb)

	r.Route("/api", func(r chi.Router) {
		r.Get("/health", healthHandler.Check)
	})

	return r
}
