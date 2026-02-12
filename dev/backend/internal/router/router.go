package router

import (
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/ghana-police/ticketing-backend/internal/adapters/handlers"
	"github.com/ghana-police/ticketing-backend/internal/adapters/repositories/postgres"
	"github.com/ghana-police/ticketing-backend/internal/config"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	"github.com/ghana-police/ticketing-backend/internal/services"
	jwtpkg "github.com/ghana-police/ticketing-backend/pkg/jwt"
)

func New(cfg *config.Config, logger *zap.Logger, db *pgxpool.Pool, rdb *redis.Client) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recovery(logger))
	r.Use(middleware.Logging(logger))
	r.Use(middleware.CORS(cfg))
	r.Use(chimw.RealIP)
	r.Use(chimw.RequestID)

	// JWT manager
	jwtManager := jwtpkg.NewManager(cfg.JWTSecret, cfg.JWTAccessTokenExpiry, cfg.JWTRefreshTokenExpiry)

	// Repositories
	userRepo := postgres.NewUserRepo(db)

	// Services
	authService := services.NewAuthService(userRepo, jwtManager, logger)

	// Handlers
	healthHandler := handlers.NewHealthHandler(db, rdb)
	authHandler := handlers.NewAuthHandler(authService)

	r.Route("/api", func(r chi.Router) {
		// Public endpoints
		r.Get("/health", healthHandler.Check)

		// Auth routes (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.Refresh)
			r.Post("/forgot-password", authHandler.ForgotPassword)
			r.Post("/reset-password", authHandler.ResetPassword)

			// Protected auth routes
			r.Group(func(r chi.Router) {
				r.Use(middleware.Auth(jwtManager))
				r.Post("/logout", authHandler.Logout)
				r.Get("/profile", authHandler.GetProfile)
				r.Put("/profile", authHandler.UpdateProfile)
				r.Post("/change-password", authHandler.ChangePassword)
			})
		})
	})

	return r
}
