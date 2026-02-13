package router

import (
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/ghana-police/ticketing-backend/internal/adapters/handlers"
	"github.com/ghana-police/ticketing-backend/internal/adapters/payment_providers"
	"github.com/ghana-police/ticketing-backend/internal/adapters/repositories/postgres"
	"github.com/ghana-police/ticketing-backend/internal/adapters/storage"
	"github.com/ghana-police/ticketing-backend/internal/config"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
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
	hierarchyRepo := postgres.NewHierarchyRepo(db)
	offenceRepo := postgres.NewOffenceRepo(db)
	officerRepo := postgres.NewOfficerRepo(db)
	ticketRepo := postgres.NewTicketRepo(db)
	paymentRepo := postgres.NewPaymentRepo(db)
	objectionRepo := postgres.NewObjectionRepo(db)

	// Storage
	storageService := storage.NewLocalStorage(cfg.StorageLocalPath, "/uploads")

	// Payment providers
	providerRegistry := portservices.NewProviderRegistry()
	providerRegistry.Register(payment_providers.NewCashProvider())
	providerRegistry.Register(payment_providers.NewMomoMockProvider())

	// Services
	authService := services.NewAuthService(userRepo, jwtManager, logger)
	hierarchyService := services.NewHierarchyService(hierarchyRepo, logger)
	offenceService := services.NewOffenceService(offenceRepo, logger)
	officerService := services.NewOfficerService(officerRepo, hierarchyRepo, userRepo, logger)
	ticketService := services.NewTicketService(ticketRepo, offenceRepo, hierarchyRepo, storageService, logger)
	paymentService := services.NewPaymentService(paymentRepo, ticketRepo, providerRegistry, logger)
	objectionService := services.NewObjectionService(objectionRepo, ticketRepo, logger)

	// Handlers
	healthHandler := handlers.NewHealthHandler(db, rdb)
	authHandler := handlers.NewAuthHandler(authService)
	hierarchyHandler := handlers.NewHierarchyHandler(hierarchyService)
	offenceHandler := handlers.NewOffenceHandler(offenceService)
	officerHandler := handlers.NewOfficerHandler(officerService)
	ticketHandler := handlers.NewTicketHandler(ticketService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	objectionHandler := handlers.NewObjectionHandler(objectionService)

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

		// Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(jwtManager))

			// Regions
			r.Route("/regions", func(r chi.Router) {
				r.Get("/", hierarchyHandler.ListRegions)
				r.Get("/{id}", hierarchyHandler.GetRegion)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("super_admin"))
					r.Post("/", hierarchyHandler.CreateRegion)
					r.Put("/{id}", hierarchyHandler.UpdateRegion)
					r.Delete("/{id}", hierarchyHandler.DeleteRegion)
				})
			})

			// Divisions
			r.Route("/divisions", func(r chi.Router) {
				r.Get("/", hierarchyHandler.ListDivisions)
				r.Get("/{id}", hierarchyHandler.GetDivision)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("super_admin"))
					r.Post("/", hierarchyHandler.CreateDivision)
					r.Put("/{id}", hierarchyHandler.UpdateDivision)
					r.Delete("/{id}", hierarchyHandler.DeleteDivision)
				})
			})

			// Districts
			r.Route("/districts", func(r chi.Router) {
				r.Get("/", hierarchyHandler.ListDistricts)
				r.Get("/{id}", hierarchyHandler.GetDistrict)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("super_admin"))
					r.Post("/", hierarchyHandler.CreateDistrict)
					r.Put("/{id}", hierarchyHandler.UpdateDistrict)
					r.Delete("/{id}", hierarchyHandler.DeleteDistrict)
				})
			})

			// Stations
			r.Route("/stations", func(r chi.Router) {
				r.Get("/", hierarchyHandler.ListStations)
				r.Get("/{id}", hierarchyHandler.GetStation)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "super_admin"))
					r.Get("/stats", hierarchyHandler.GetStationStats)
					r.Post("/", hierarchyHandler.CreateStation)
					r.Put("/{id}", hierarchyHandler.UpdateStation)
				})
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("super_admin"))
					r.Delete("/{id}", hierarchyHandler.DeleteStation)
				})
			})

			// Officers
			r.Route("/officers", func(r chi.Router) {
				r.Get("/", officerHandler.List)
				r.Get("/{id}", officerHandler.Get)
				r.Get("/{id}/stats", officerHandler.GetStats)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "super_admin"))
					r.Post("/", officerHandler.Create)
					r.Put("/{id}", officerHandler.Update)
					r.Delete("/{id}", officerHandler.Delete)
					r.Post("/{id}/reset-password", officerHandler.ResetPassword)
				})
			})

			// Tickets
			r.Route("/tickets", func(r chi.Router) {
				r.Get("/", ticketHandler.List)
				r.Get("/stats", ticketHandler.Stats)
				r.Get("/search", ticketHandler.Search)
				r.Get("/number/{ticketNumber}", ticketHandler.GetByNumber)
				r.Get("/{id}", ticketHandler.Get)
				r.Post("/", ticketHandler.Create)
				r.Post("/{id}/photos", ticketHandler.UploadPhoto)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "super_admin"))
					r.Patch("/{id}", ticketHandler.Update)
				})
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("supervisor", "admin", "super_admin"))
					r.Post("/{id}/void", ticketHandler.Void)
				})
			})

			// Payments
			r.Route("/payments", func(r chi.Router) {
				r.Get("/", paymentHandler.List)
				r.Get("/stats", paymentHandler.Stats)
				r.Get("/{id}", paymentHandler.Get)
				r.Get("/{id}/receipt", paymentHandler.Receipt)
				r.Post("/verify", paymentHandler.Verify)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "super_admin", "accountant"))
					r.Post("/initiate", paymentHandler.Initiate)
					r.Post("/cash", paymentHandler.RecordCash)
				})
			})

			// Objections
			r.Route("/objections", func(r chi.Router) {
				r.Post("/", objectionHandler.File)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "super_admin"))
					r.Get("/", objectionHandler.List)
					r.Get("/stats", objectionHandler.Stats)
					r.Get("/{id}", objectionHandler.Get)
					r.Post("/{id}/review", objectionHandler.Review)
				})
			})

			// Offences
			r.Route("/offences", func(r chi.Router) {
				r.Get("/", offenceHandler.List)
				r.Get("/{id}", offenceHandler.Get)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("admin", "super_admin"))
					r.Post("/", offenceHandler.Create)
					r.Put("/{id}", offenceHandler.Update)
					r.Patch("/{id}/toggle", offenceHandler.Toggle)
				})
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole("super_admin"))
					r.Delete("/{id}", offenceHandler.Delete)
				})
			})
		})
	})

	return r
}
