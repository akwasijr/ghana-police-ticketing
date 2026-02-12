package middleware

import (
	"net/http"

	"github.com/ghana-police/ticketing-backend/internal/config"
	"github.com/rs/cors"
)

func CORS(cfg *config.Config) func(http.Handler) http.Handler {
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   cfg.CORSAllowedMethods,
		AllowedHeaders:   cfg.CORSAllowedHeaders,
		AllowCredentials: true,
		MaxAge:           300,
	})
	return c.Handler
}
