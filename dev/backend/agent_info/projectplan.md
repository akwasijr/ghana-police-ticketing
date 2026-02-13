# Ghana Police Ticketing System — Backend Project Plan

**Tech:** Go 1.22 | PostgreSQL 16 | Redis 7 | Docker | chi router | pgx driver
**Base Path:** `dev/backend/`
**API Specs:** `api_specifications/*.yaml`
**Architecture:** `dev_info/backend_architecture.md`

---

## Phase 1: Project Bootstrap & Foundation
**Goal:** Docker containers running, DB connected, migrations applied, health check returns 200.

### 1.1 Project Structure & Go Module
- [x] Create directory structure (cmd/, internal/, pkg/, migrations/, deployments/)
- [x] Initialize Go module (`go mod init`)
- [x] Add all dependencies to go.mod
- [x] Create `cmd/server/main.go` — entry point, DI wiring, graceful shutdown

### 1.2 Configuration & Error Handling
- [x] `internal/config/config.go` — env var loading with defaults
- [x] `internal/domain/errors/errors.go` — AppError type, error codes, sentinel errors
- [x] `pkg/response/response.go` — Success/Error JSON response helpers

### 1.3 Router & Middleware
- [x] `internal/router/router.go` — chi router setup with middleware chain
- [x] `internal/middleware/recovery.go` — panic recovery middleware
- [x] `internal/middleware/logging.go` — structured request logging
- [x] `internal/middleware/cors.go` — CORS configuration

### 1.4 Health Check Endpoint
- [x] `internal/adapters/handlers/health_handler.go` — health endpoint per `12_health_api.yaml`
- [x] Wire health handler into router

### 1.5 Database & Migrations
- [x] `migrations/000001_create_hierarchy_tables.up.sql` — regions, divisions, districts, stations + 16 region seeds
- [x] `migrations/000001_create_hierarchy_tables.down.sql`
- [x] `internal/domain/models/hierarchy.go` — Region, Division, District, Station structs
- [x] DB connection pool setup in main.go with auto-migration

### 1.6 Docker Setup
- [x] `deployments/docker-compose.yml` — Go app + PostgreSQL + Redis
- [x] `deployments/Dockerfile` — multi-stage build
- [x] `deployments/.env.example` and `deployments/.env`

### 1.7 Build & Verify
- [x] `go build ./cmd/server/` compiles with no errors
- [x] `docker-compose up --build` starts all 3 services
- [x] `GET /api/health` returns 200 with healthy status
- [x] 16 regions seeded in database
- [x] Structured JSON logs visible in output

---

## Phase 2: Authentication & Core Middleware
**Goal:** Login as super admin, JWT tokens work, protected endpoints enforce auth.

### 2.1 Domain Models
- [x] `internal/domain/models/user.go` — User, Officer, RefreshToken structs

### 2.2 Database Migration
- [x] `migrations/000002_create_user_tables.up.sql` — users, officers, refresh_tokens + super admin seed
- [x] `migrations/000002_create_user_tables.down.sql`

### 2.3 Auth Utilities
- [x] `pkg/jwt/jwt.go` — GenerateAccessToken, ValidateToken, GenerateRefreshToken
- [x] `pkg/hash/hash.go` — HashPassword, CheckPassword (bcrypt)

### 2.4 Repository Layer
- [x] `internal/ports/repositories/user_repository.go` — interface
- [x] `internal/adapters/repositories/postgres/user_repo.go` — implementation

### 2.5 Service Layer
- [x] `internal/ports/services/auth_service.go` — interface
- [x] `internal/services/auth_service.go` — login, logout, refresh, profile

### 2.6 Handler & Routes
- [x] `internal/adapters/handlers/auth_handler.go` — 8 routes per `01_auth_api.yaml`
- [x] `internal/middleware/auth.go` — JWT validation, context injection

### 2.7 Build & Verify
- [x] Login with super admin returns tokens
- [x] Profile endpoint works with Bearer token
- [x] Refresh issues new access token
- [x] Logout revokes refresh token
- [x] 401 on invalid/expired tokens

---

## Phase 3: Hierarchy & Offence Management
**Goal:** Full CRUD for regions/divisions/districts/stations, offence catalog, RBAC.

### 3.1 Domain Models
- [x] `internal/domain/models/offence.go` — Offence, VehicleType structs

### 3.2 Database Migrations
- [x] `migrations/000003_create_core_tables.up.sql` — offences, vehicle_types, tickets, ticket_offences, ticket_photos, ticket_notes, ticket_number_seq
- [x] `migrations/000003_create_core_tables.down.sql`
- [x] `migrations/000004_seed_offences_vehicle_types.up.sql` — 15 offences, 10 vehicle types
- [x] `migrations/000004_seed_offences_vehicle_types.down.sql`

### 3.3 Repository Layer
- [x] `internal/ports/repositories/hierarchy_repository.go` — interface
- [x] `internal/ports/repositories/offence_repository.go` — interface
- [x] `internal/adapters/repositories/postgres/hierarchy_repo.go`
- [x] `internal/adapters/repositories/postgres/offence_repo.go`

### 3.4 Service Layer
- [x] `internal/ports/services/hierarchy_service.go` — interface + request/response types
- [x] `internal/ports/services/offence_service.go` — interface + request/response types
- [x] `internal/services/hierarchy_service.go` — with auto-derive and cascade protection
- [x] `internal/services/offence_service.go` — with fine validation and code immutability

### 3.5 Handlers & Middleware
- [x] `internal/adapters/handlers/hierarchy_handler.go` — 21 endpoints per `07_hierarchy_api.yaml`
- [x] `internal/adapters/handlers/offence_handler.go` — 6 endpoints per `06_offences_api.yaml`
- [x] `internal/adapters/handlers/helpers.go` — shared handler utilities (parseID, parseOptionalUUID, etc.)
- [x] `internal/middleware/rbac.go` — RequireRole middleware
- [x] `pkg/pagination/pagination.go` — pagination param parsing + Meta
- [x] `pkg/response/response.go` — added Paginated response helper

### 3.6 Build & Verify
- [x] Hierarchy CRUD with cascade protection (409 if active children)
- [x] Offence CRUD + toggle active/inactive
- [x] RBAC blocks unauthorized roles (RequireRole middleware)
- [x] Pagination works on station list endpoint
- [x] Auto-derive: districts get regionId from division, stations get divisionId+regionId from district
- [x] Station stats with by-region and by-type breakdowns

---

## Phase 4: Officer Management
**Goal:** Officer CRUD, jurisdiction scoping by role.

### 4.1 Repository Layer
- [x] `internal/ports/repositories/officer_repository.go` — interface
- [x] `internal/adapters/repositories/postgres/officer_repo.go` — transactional create/update, stats, search

### 4.2 Service Layer
- [x] `internal/ports/services/officer_service.go` — interface + request/result types
- [x] `internal/services/officer_service.go` — jurisdiction scoping, auto-derive regionId from station

### 4.3 Handler & Routes
- [x] `internal/adapters/handlers/officer_handler.go` — 7 endpoints per `05_officers_api.yaml`
- [x] `internal/domain/models/user.go` — added OfficerResponse, OfficerFilter, OfficerStats, TopOffenceItem
- [x] `pkg/hash/hash.go` — added GenerateTemporaryPassword()
- [x] Jurisdiction scoping embedded in service (applyJurisdictionFilter) — no separate middleware needed

### 4.4 Build & Verify
- [x] Officer CRUD works with badge/email uniqueness (409 on duplicate badge)
- [x] Create with auto-generated temp password + placeholder email
- [x] Password reset returns new temp password
- [x] Soft-delete (deactivate) confirmed (isActive→false)
- [x] Stats returns zero values correctly (no tickets yet)
- [x] Search by name works
- [x] Paginated list with proper response format

---

## Phase 5: Ticket Management (Core)
**Goal:** Full ticket lifecycle — create, list/filter, get, void, search, stats, photo upload.

### 5.1 Domain Models
- [x] `internal/domain/models/ticket.go` — Ticket, TicketResponse, TicketListItem, TicketOffence, TicketPhoto, TicketNote, VehicleInfo, DriverInfo, GeoLocation, TicketFilter, TicketStats

### 5.2 Repository Layer
- [x] `internal/ports/repositories/ticket_repository.go` — interface with TicketOffenceInput
- [x] `internal/adapters/repositories/postgres/ticket_repo.go` — transactional create, dynamic filter builder, multi-table joins

### 5.3 Service & Storage
- [x] `internal/ports/services/ticket_service.go` — interface + CreateTicketRequest, OffenceInput, UpdateTicketRequest, PrintData, PhotoUploadResult
- [x] `internal/ports/services/storage_service.go` — interface (SaveFile, FileURL)
- [x] `internal/services/ticket_service.go` — jurisdiction scoping, offence resolution with fine validation, status transitions
- [x] `internal/adapters/storage/local_storage.go` — local file storage implementation
- [x] Ticket number generation via postgres sequence (TKT-YYYY-{REGION}-{SEQ:06d})

### 5.4 Handler
- [x] `internal/adapters/handlers/ticket_handler.go` — 9 endpoints per `02_tickets_api.yaml`
- [x] Router wired with RBAC (create/read=any auth, PATCH=admin+, void=supervisor+)

### 5.5 Build & Verify
- [x] Ticket creation generates TKT-2026-GA-000001 format + PAY-2026-GA-000001 reference
- [x] totalFine auto-calculated from offences (800+300=1100), due date = +14 days
- [x] List with status filter, search by vehicle reg, pagination
- [x] Void sets status=cancelled with reason and timestamp
- [x] Photo upload stores PNG, returns URL
- [x] clientCreatedId dedup returns 409 CONFLICT
- [x] Stats returns correct counts (total/paid/unpaid/overdue/cancelled + amounts)
- [x] Update: replace offences recalculates totalFine, append note with officer context
- [x] Get by ID and by ticket number both work

---

## Phase 6: Payments
**Goal:** Cash payments, mock digital payment, stats, receipts.

### 6.1 Domain Models & Migration
- [ ] `internal/domain/models/payment.go`
- [ ] `migrations/000004_create_payment_tables.up.sql`
- [ ] `migrations/000004_create_payment_tables.down.sql`

### 6.2 Repository Layer
- [ ] `internal/ports/repositories/payment_repository.go` — interface
- [ ] `internal/adapters/repositories/postgres/payment_repo.go`

### 6.3 Service Layer
- [ ] `internal/ports/services/payment_service.go` — interface
- [ ] `internal/services/payment_service.go`
- [ ] `internal/adapters/payment_providers/momo_provider.go` — mock stub

### 6.4 Handler
- [ ] `internal/adapters/handlers/payment_handler.go` — 7 endpoints per `03_payments_api.yaml`

### 6.5 Build & Verify
- [ ] Cash payment immediately completes + updates ticket to paid
- [ ] Mock digital initiate/verify works
- [ ] Receipt generated, payment stats aggregate by status/method

---

## Phase 7: Objections
**Goal:** File objection (7-day deadline), approve/reject with ticket status transitions.

### 7.1 Domain Models & Migration
- [ ] `internal/domain/models/objection.go`
- [ ] `migrations/000004b_create_objection_tables.up.sql`
- [ ] `migrations/000004b_create_objection_tables.down.sql`

### 7.2 Repository Layer
- [ ] `internal/ports/repositories/objection_repository.go` — interface
- [ ] `internal/adapters/repositories/postgres/objection_repo.go`

### 7.3 Service & Handler
- [ ] `internal/ports/services/objection_service.go` — interface
- [ ] `internal/services/objection_service.go`
- [ ] `internal/adapters/handlers/objection_handler.go` — 5 endpoints per `04_objections_api.yaml`

### 7.4 Build & Verify
- [ ] Filing enforces 7-day deadline + 1-per-ticket
- [ ] Approve -> ticket cancelled (or fine adjusted)
- [ ] Reject -> ticket reverts to unpaid/overdue
- [ ] Stats correct

---

## Phase 8: Audit Logging
**Goal:** Auto-log all write operations, read-only audit endpoints.

### 8.1 Domain Models & Migration
- [ ] `internal/domain/models/audit.go`
- [ ] `migrations/000005_create_system_tables.up.sql` — audit_logs, system_settings
- [ ] `migrations/000005_create_system_tables.down.sql`

### 8.2 Repository Layer
- [ ] `internal/ports/repositories/audit_repository.go` — interface
- [ ] `internal/adapters/repositories/postgres/audit_repo.go`

### 8.3 Service, Handler & Middleware
- [ ] `internal/ports/services/audit_service.go` — interface
- [ ] `internal/services/audit_service.go`
- [ ] `internal/adapters/handlers/audit_handler.go` — 3 endpoints per `08_audit_api.yaml`
- [ ] `internal/middleware/audit.go` — auto-capture write operations

### 8.4 Build & Verify
- [ ] Every POST/PUT/PATCH/DELETE creates audit entry
- [ ] Login/logout logged
- [ ] Filter by action/entity/severity works
- [ ] Entries immutable

---

## Phase 9: Offline Sync
**Goal:** Batch sync tickets + photos, dedup, server-wins conflict resolution.

### 9.1 Domain Models
- [ ] `internal/domain/models/sync.go`

### 9.2 Service & Handler
- [ ] `internal/ports/services/sync_service.go` — interface
- [ ] `internal/services/sync_service.go`
- [ ] `internal/adapters/handlers/sync_handler.go` — 2 endpoints per `09_sync_api.yaml`

### 9.3 Build & Verify
- [ ] Batch <= 50 items processed
- [ ] clientCreatedId dedup returns existing
- [ ] Server-wins on timestamp conflict
- [ ] Photos decoded + stored
- [ ] Server updates since lastSync returned

---

## Phase 10: Analytics, Lookup & Settings
**Goal:** Dashboard analytics, reference data endpoint, system settings CRUD.

### 10.1 Domain Models
- [ ] `internal/domain/models/analytics.go`
- [ ] `internal/domain/models/settings.go`

### 10.2 Repository Layer
- [ ] `internal/ports/repositories/analytics_repository.go` — interface
- [ ] `internal/ports/repositories/settings_repository.go` — interface
- [ ] `internal/adapters/repositories/postgres/analytics_repo.go`
- [ ] `internal/adapters/repositories/postgres/settings_repo.go`

### 10.3 Service & Handler
- [ ] `internal/ports/services/analytics_service.go` — interface
- [ ] `internal/ports/services/settings_service.go` — interface
- [ ] `internal/services/analytics_service.go`
- [ ] `internal/services/settings_service.go`
- [ ] `internal/adapters/handlers/analytics_handler.go` — 6 endpoints per `10_analytics_api.yaml`
- [ ] `internal/adapters/handlers/lookup_handler.go` — 1 endpoint per `11_lookup_api.yaml`
- [ ] `internal/adapters/handlers/settings_handler.go` — 4 endpoints per `14_settings_api.yaml`

### 10.4 Build & Verify
- [ ] Analytics endpoints return correct aggregates
- [ ] Lookup returns combined reference data with If-Modified-Since/304
- [ ] Settings CRUD by section works

---

## Migration Summary

| # | Phase | Tables |
|---|-------|--------|
| 000001 | 1 | regions, divisions, districts, stations + 16 region seeds |
| 000002 | 2 | users, officers, refresh_tokens + super admin seed |
| 000003 | 3 | offences, vehicle_types, tickets, ticket_offences, ticket_photos, ticket_notes, ticket_number_seq |
| 000004 | 3 | Seed data (15 offences, 10 vehicle types) |
| 000005 | 6 | payments |
| 000006 | 7 | objections, objection_attachments |
| 000007 | 8 | audit_logs, system_settings |

## Final Verification

After Phase 10: all ~75 endpoints operational, full ticket lifecycle works end-to-end (create -> pay/object -> audit logged), offline sync functional.
