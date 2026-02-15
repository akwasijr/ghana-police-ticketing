# Sevalla Deployment Guide

## Architecture Overview

The Ghana Police Ticketing platform deploys as **two separate Sevalla applications**:

| Service  | Type           | Port | Image           |
|----------|----------------|------|-----------------|
| Backend  | Docker app     | 8000 | Go + Alpine     |
| Frontend | Docker app     | 80   | Nginx + Alpine  |

Infrastructure (already provisioned on Sevalla):
- **PostgreSQL 16** - managed database
- **Redis 7** - managed cache (optional; backend falls back gracefully)

---

## 1. Backend Deployment

### Build & Push

The backend Dockerfile is at `dev/backend/deployments/Dockerfile`. It uses a multi-stage build:
- **Stage 1**: `golang:1.25-alpine` - compiles the Go binary
- **Stage 2**: `alpine:3.19` - minimal runtime with the compiled binary + migrations

### Sevalla Configuration

1. Create a new **Docker** application on Sevalla
2. Set the **build context** to `dev/backend` and **Dockerfile path** to `deployments/Dockerfile`
3. Configure environment variables (see section below)
4. Connect to the managed PostgreSQL instance
5. Set the **exposed port** to `8000`

### Required Environment Variables

```env
# Server
APP_ENV=production
API_PORT=8000

# Database (use Sevalla managed DB connection details)
DB_HOST=<sevalla-pg-host>
DB_PORT=5432
DB_NAME=gps_ticketing
DB_USER=<sevalla-pg-user>
DB_PASSWORD=<sevalla-pg-password>
DB_SSL_MODE=require

# Redis (use Sevalla managed Redis, or omit for no cache)
REDIS_HOST=<sevalla-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<sevalla-redis-password>

# JWT - MUST be a strong random secret in production
JWT_SECRET=<generate-a-64-char-random-string>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=168h

# CORS - set to the frontend production URL
CORS_ALLOWED_ORIGINS=https://<frontend-app>.sevalla.app
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,X-Device-ID,Accept

# Storage
STORAGE_DRIVER=local
STORAGE_LOCAL_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 2. Frontend Deployment

### Build & Push

The frontend Dockerfile is at `dev/frontend/Dockerfile`. It uses a multi-stage build:
- **Stage 1**: `node:22-alpine` - runs `npm ci && npm run build`
- **Stage 2**: `nginx:1.27-alpine` - serves the static SPA with proper routing

### Sevalla Configuration

1. Create a new **Docker** application on Sevalla
2. Set the **build context** to `dev/frontend`
3. Set **build arguments**:
   - `VITE_API_BASE_URL=https://<backend-app>.sevalla.app/api`
   - `VITE_USE_MOCK=false`
4. Set the **exposed port** to `80`

### Build Arguments (set at build time)

```env
VITE_API_BASE_URL=https://<backend-app>.sevalla.app/api
VITE_USE_MOCK=false
```

> These are baked into the static build. To change the API URL, you must rebuild.

---

## 3. Post-Deployment Checklist

1. **Database migrations**: The backend runs migrations automatically on startup. Verify by checking logs for "migrations applied successfully".

2. **Seed data**: Create the first super_admin user by calling:
   ```
   POST https://<backend>/api/v1/auth/register
   ```
   Or use the backend's built-in seed command if available.

3. **CORS**: Ensure the backend's `CORS_ALLOWED_ORIGINS` includes the exact frontend URL (including protocol, no trailing slash).

4. **Health checks**:
   - Backend: `GET https://<backend>/api/v1/health`
   - Frontend: `GET https://<frontend>/health`

5. **SSL**: Sevalla provides automatic SSL certificates. Ensure all URLs use `https://`.

6. **Custom domain** (optional): Configure DNS CNAME records pointing to Sevalla app URLs.

---

## 4. Local Docker Testing

Before deploying to Sevalla, test the full stack locally:

```bash
# From the project root
docker compose up --build

# Services will be available at:
# Frontend: http://localhost:7000
# Backend:  http://localhost:8000
# Postgres: localhost:5432
# Redis:    localhost:6379
```

To stop:
```bash
docker compose down
```

To reset data:
```bash
docker compose down -v  # removes volumes
```

---

## 5. Environment Variable Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| APP_ENV | Yes | development | `development` or `production` |
| API_PORT | No | 8000 | HTTP server port |
| DB_HOST | Yes | localhost | PostgreSQL host |
| DB_PORT | No | 5432 | PostgreSQL port |
| DB_NAME | Yes | gps_ticketing | Database name |
| DB_USER | Yes | gps_user | Database user |
| DB_PASSWORD | Yes | - | Database password |
| DB_SSL_MODE | No | disable | `disable`, `require`, `verify-full` |
| REDIS_HOST | No | localhost | Redis host |
| REDIS_PORT | No | 6379 | Redis port |
| REDIS_PASSWORD | No | - | Redis password |
| JWT_SECRET | **Yes** | - | JWT signing secret (min 32 chars) |
| CORS_ALLOWED_ORIGINS | Yes | - | Comma-separated allowed origins |
| LOG_LEVEL | No | debug | `debug`, `info`, `warn`, `error` |

### Frontend (Build Args)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| VITE_API_BASE_URL | Yes | http://localhost:8000/api | Backend API URL |
| VITE_USE_MOCK | No | false | Enable mock data mode |
