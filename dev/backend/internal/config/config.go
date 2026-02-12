package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	AppEnv          string
	APIPort         int
	APIReadTimeout  time.Duration
	APIWriteTimeout time.Duration
	APIIdleTimeout  time.Duration

	// Database
	DBHost            string
	DBPort            int
	DBName            string
	DBUser            string
	DBPassword        string
	DBSSLMode         string
	DBMaxOpenConns    int
	DBMaxIdleConns    int
	DBConnMaxLifetime time.Duration

	// Redis
	RedisHost     string
	RedisPort     int
	RedisPassword string
	RedisDB       int

	// JWT
	JWTSecret             string
	JWTAccessTokenExpiry  time.Duration
	JWTRefreshTokenExpiry time.Duration

	// CORS
	CORSAllowedOrigins []string
	CORSAllowedMethods []string
	CORSAllowedHeaders []string

	// Storage
	StorageDriver    string
	StorageLocalPath string

	// Logging
	LogLevel  string
	LogFormat string

	// Business Rules
	TicketPrefix         string
	PaymentGraceDays     int
	ObjectionDeadlineDays int
	MaxPhotosPerTicket   int
	MaxPhotoSizeMB       int
	SyncBatchSize        int
	SyncMaxRetries       int
}

func Load() (*Config, error) {
	// Try loading .env from deployments/ first, then current dir
	_ = godotenv.Load("deployments/.env")
	_ = godotenv.Load(".env")

	cfg := &Config{
		// Server
		AppEnv:          getEnv("APP_ENV", "development"),
		APIPort:         getEnvInt("API_PORT", 8000),
		APIReadTimeout:  getEnvDuration("API_READ_TIMEOUT", 15*time.Second),
		APIWriteTimeout: getEnvDuration("API_WRITE_TIMEOUT", 15*time.Second),
		APIIdleTimeout:  getEnvDuration("API_IDLE_TIMEOUT", 60*time.Second),

		// Database
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnvInt("DB_PORT", 5432),
		DBName:            getEnv("DB_NAME", "gps_ticketing"),
		DBUser:            getEnv("DB_USER", "gps_user"),
		DBPassword:        getEnv("DB_PASSWORD", "gps_password"),
		DBSSLMode:         getEnv("DB_SSL_MODE", "disable"),
		DBMaxOpenConns:    getEnvInt("DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 10),
		DBConnMaxLifetime: getEnvDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),

		// Redis
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnvInt("REDIS_PORT", 6379),
		RedisPassword: getEnv("REDIS_PASSWORD", "gps_redis_pass"),
		RedisDB:       getEnvInt("REDIS_DB", 0),

		// JWT
		JWTSecret:             getEnv("JWT_SECRET", "change-this-to-a-long-random-secret-in-production"),
		JWTAccessTokenExpiry:  getEnvDuration("JWT_ACCESS_TOKEN_EXPIRY", 15*time.Minute),
		JWTRefreshTokenExpiry: getEnvDuration("JWT_REFRESH_TOKEN_EXPIRY", 168*time.Hour),

		// CORS
		CORSAllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:5173", "http://localhost:3000"}),
		CORSAllowedMethods: getEnvSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}),
		CORSAllowedHeaders: getEnvSlice("CORS_ALLOWED_HEADERS", []string{"Authorization", "Content-Type", "X-Device-ID", "Accept"}),

		// Storage
		StorageDriver:    getEnv("STORAGE_DRIVER", "local"),
		StorageLocalPath: getEnv("STORAGE_LOCAL_PATH", "./uploads"),

		// Logging
		LogLevel:  getEnv("LOG_LEVEL", "debug"),
		LogFormat: getEnv("LOG_FORMAT", "json"),

		// Business Rules
		TicketPrefix:         getEnv("TICKET_PREFIX", "GPS"),
		PaymentGraceDays:     getEnvInt("PAYMENT_GRACE_DAYS", 14),
		ObjectionDeadlineDays: getEnvInt("OBJECTION_DEADLINE_DAYS", 7),
		MaxPhotosPerTicket:   getEnvInt("MAX_PHOTOS_PER_TICKET", 4),
		MaxPhotoSizeMB:       getEnvInt("MAX_PHOTO_SIZE_MB", 5),
		SyncBatchSize:        getEnvInt("SYNC_BATCH_SIZE", 50),
		SyncMaxRetries:       getEnvInt("SYNC_MAX_RETRIES", 5),
	}

	if cfg.JWTSecret == "change-this-to-a-long-random-secret-in-production" && cfg.AppEnv == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production")
	}

	return cfg, nil
}

func (c *Config) DatabaseDSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			return d
		}
	}
	return fallback
}

func getEnvSlice(key string, fallback []string) []string {
	if v := os.Getenv(key); v != "" {
		return strings.Split(v, ",")
	}
	return fallback
}
