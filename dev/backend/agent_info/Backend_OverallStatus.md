# Backend - Overall Development Status

**Module:** Ghana Police Ticketing System — Backend API
**Tech Stack:** Go 1.25 | PostgreSQL 16 | Redis 7 | Docker | chi | pgx
**Module Path:** `github.com/ghana-police/ticketing-backend`
**Base Path:** `dev/backend/`

---

## Current Status: Phase 4 Complete

### Phase 1: Project Bootstrap & Foundation - COMPLETE
- Go module initialized with all dependencies (chi, pgx, zap, jwt, bcrypt, migrate, cors, redis, godotenv, uuid)
- Clean architecture directory structure: `cmd/` → `internal/` (config, domain, ports, adapters, middleware, router, services) → `pkg/`
- `cmd/server/main.go`: entry point with DB pool, Redis client, migration runner, graceful shutdown
- `internal/config/config.go`: env var loading with type-safe defaults for all 40+ vars
- `internal/domain/errors/errors.go`: AppError type with all API error codes
- `pkg/response/response.go`: standard JSON Success/Error/Paginated envelope
- `internal/domain/models/hierarchy.go`: Region, Division, District, Station structs
- Middleware chain: Recovery → Logging → CORS → RealIP → RequestID
- Health endpoint at `GET /api/health`
- Migration `000001`: 4 hierarchy tables + 16 Ghana regions seeded
- Docker: multi-stage Dockerfile, docker-compose with 3 services

### Phase 2: Authentication & Core Middleware - COMPLETE
- User/Officer/RefreshToken models, JWT Manager (HS256), bcrypt hashing
- Migration `000002`: users, officers, refresh_tokens + super admin seed
- Auth service: login (email/badge), logout, refresh, profile, change-password, lockout (5 attempts → 30min)
- 8 auth endpoints, JWT validation middleware with context helpers

### Phase 3: Hierarchy & Offence Management - COMPLETE
- `internal/domain/models/offence.go`: Offence, VehicleType structs with OffenceCategories
- `internal/domain/models/hierarchy.go`: Added StationFilter, StationStats, RegionCount, TypeCount, OfficerCount
- Migration `000003`: offences, vehicle_types, tickets, ticket_offences, ticket_photos, ticket_notes, ticket_number_seq
- Migration `000004`: Seed 15 Ghana traffic offences (SPD/TSG/LIC/DOC/VEH/DNG/PRK/OBS/OTH), 10 vehicle types
- `internal/middleware/rbac.go`: RequireRole middleware (any role list)
- `pkg/pagination/pagination.go`: Parse params (page/limit/sort/search), Offset(), NewMeta()
- `pkg/response/response.go`: Added Paginated response helper for paginated list endpoints
- `internal/adapters/handlers/helpers.go`: Shared handler utilities (parseID, parseOptionalUUID/Bool/String)
- Hierarchy repository (full CRUD for 4 entities): list, get, create, update, deactivate, cascade checks, code uniqueness
- Hierarchy service: auto-derive (districts get regionId from division, stations get divisionId+regionId from district), cascade protection
- Hierarchy handler: 21 endpoints — 5 per entity (regions/divisions/districts) + 6 for stations (list/get/create/update/delete/stats)
- Offence repository: list (filter+search), get, create, update, deactivate, toggle, code exists, ticket reference checks
- Offence service: fine validation (min <= default <= max), code immutability if referenced by tickets, toggle with active ticket check
- Offence handler: 6 endpoints — list/get/create/update/delete/toggle
- Router: all 27 new endpoints wired with auth + RBAC (super_admin for hierarchy write, admin+super_admin for stations/offences write)
- Verified: 16 regions, 15 offences seeded, CRUD with auto-derive, cascade protection (409), pagination, search, filter, stats

### Key Files (Phase 3 additions)
| File | Purpose |
|------|---------|
| `internal/domain/models/offence.go` | Offence, VehicleType models |
| `internal/middleware/rbac.go` | RequireRole middleware |
| `pkg/pagination/pagination.go` | Pagination parsing & metadata |
| `internal/adapters/handlers/helpers.go` | Shared handler utilities |
| `internal/ports/repositories/hierarchy_repository.go` | Hierarchy repo interface |
| `internal/ports/repositories/offence_repository.go` | Offence repo interface |
| `internal/adapters/repositories/postgres/hierarchy_repo.go` | Hierarchy repo SQL implementation |
| `internal/adapters/repositories/postgres/offence_repo.go` | Offence repo SQL implementation |
| `internal/ports/services/hierarchy_service.go` | Hierarchy service interface + request types |
| `internal/ports/services/offence_service.go` | Offence service interface + request types |
| `internal/services/hierarchy_service.go` | Hierarchy business logic |
| `internal/services/offence_service.go` | Offence business logic |
| `internal/adapters/handlers/hierarchy_handler.go` | 21 hierarchy endpoints |
| `internal/adapters/handlers/offence_handler.go` | 6 offence endpoints |
| `migrations/000003_create_core_tables.*.sql` | Core tables (tickets, offences, etc.) |
| `migrations/000004_seed_offences_vehicle_types.*.sql` | Offence + vehicle type seeds |

### Architecture Patterns
- **RBAC**: `RequireRole("super_admin")` for hierarchy write, `RequireRole("admin", "super_admin")` for station/offence write
- **Cascade Protection**: Cannot deactivate entity with active children (region→divisions, division→districts, etc.)
- **Auto-derive**: Stations auto-derive divisionId+regionId from parent district; districts auto-derive regionId from parent division
- **Pagination**: Station list uses `page/limit/sortBy/sortOrder/search` with proper `{data, pagination}` response
- **Fine Validation**: defaultFine must be between minFine and maxFine; code immutable after ticket usage

### API Endpoints (Total: 35)
| Group | Count | Auth | RBAC |
|-------|-------|------|------|
| Health | 1 | None | None |
| Auth | 8 | Mixed | None |
| Regions | 5 | All auth | Write: super_admin |
| Divisions | 5 | All auth | Write: super_admin |
| Districts | 5 | All auth | Write: super_admin |
| Stations | 6 | All auth | Write: admin+super_admin, Delete: super_admin |
| Offences | 6 | All auth | Write: admin+super_admin, Delete: super_admin |

### Phase 4: Officer Management - COMPLETE
- `internal/domain/models/user.go`: Added OfficerResponse, OfficerFilter, OfficerStats, TopOffenceItem, StationInfo, RankDisplayMap
- `pkg/hash/hash.go`: Added GenerateTemporaryPassword() — 12-char crypto/rand from safe charset
- Officer repository: transactional create (INSERT user + INSERT officer in tx), update, deactivate, stats (time-based ticket counts, financials, top offences), badge/email uniqueness checks
- Officer service: jurisdiction scoping via applyJurisdictionFilter (officer/supervisor→station, admin/accountant→region, super_admin→all), auto-derive regionId from station on create/update, temp password generation, placeholder email (officer_{badge}@gps.internal)
- Officer handler: 7 endpoints — List, Get, Create, Update, Delete, GetStats, ResetPassword
- Router: /officers route group with auth + RBAC (read=any authenticated, write=admin+super_admin)
- Verified: create with temp password, get, list with pagination, update (partial), stats (zero values), reset-password, soft-delete (isActive→false), duplicate badge (409), search by name

### Key Files (Phase 4 additions)
| File | Purpose |
|------|---------|
| `internal/domain/models/user.go` | OfficerResponse, OfficerFilter, OfficerStats types |
| `pkg/hash/hash.go` | Added GenerateTemporaryPassword |
| `internal/ports/repositories/officer_repository.go` | Officer repo interface |
| `internal/adapters/repositories/postgres/officer_repo.go` | Officer repo SQL with tx, stats |
| `internal/ports/services/officer_service.go` | Officer service interface + request types |
| `internal/services/officer_service.go` | Officer business logic with jurisdiction |
| `internal/adapters/handlers/officer_handler.go` | 7 officer endpoints |

### Architecture Patterns (Phase 4 additions)
- **Jurisdiction Scoping**: Embedded in service layer via `applyJurisdictionFilter()` — no separate middleware needed
- **Transactional Officer Creation**: User + Officer inserted in single DB transaction
- **Auto-derive**: Officers auto-derive regionId from assigned station
- **Placeholder Email**: Officers without email get `officer_{badge_lower}@gps.internal`
- **Soft Delete**: Officer delete deactivates user (is_active=false), doesn't remove data

### API Endpoints (Total: 42)
| Group | Count | Auth | RBAC |
|-------|-------|------|------|
| Health | 1 | None | None |
| Auth | 8 | Mixed | None |
| Regions | 5 | All auth | Write: super_admin |
| Divisions | 5 | All auth | Write: super_admin |
| Districts | 5 | All auth | Write: super_admin |
| Stations | 6 | All auth | Write: admin+super_admin, Delete: super_admin |
| Offences | 6 | All auth | Write: admin+super_admin, Delete: super_admin |
| Officers | 7 | All auth | Write: admin+super_admin |

### Next: Phase 5 — Ticket Management (Core)
- Full ticket lifecycle: create, list/filter, get, void, search, stats, photo upload (9 endpoints per `02_tickets_api.yaml`)
- Ticket number generation (GPS-YYYY-NNNNNN via postgres sequence)
- Multi-offence per ticket, totalFine auto-calculation, due date = +14 days
- File storage for ticket photos
