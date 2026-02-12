# Backend Architecture - Ghana Police Ticketing System

> REST API backend for the Ghana Police Service traffic ticketing platform.
> **Tech Stack:** Go 1.22 | PostgreSQL 16 | Redis 7 | Docker

---

## 1. System Overview

The backend serves three client interfaces through a single REST API:

| Client | Users | Key Features |
|--------|-------|-------------|
| **Handheld PWA** | Field officers | Ticket issuance, photo capture, offline-first with sync |
| **Dashboard** | Supervisors, Admins, Accountants | Station/region management, payments, objections, reports |
| **Super-Admin Panel** | National administrators | Cross-region oversight, system settings, user management |

**Core Capabilities:**
- JWT authentication with role-based access control (5 roles)
- Jurisdiction-scoped data access (officer -> station -> region -> national)
- Offline-first sync with server-wins conflict resolution
- Mobile money and multi-channel payment processing
- Audit logging for all write operations
- S3-compatible file storage for ticket photos and objection attachments

**Base URL:** `http://localhost:8000/api` (development)

---

## 2. Go Project Structure

Clean/hexagonal architecture separating domain logic from infrastructure.

```
dev/backend/
├── cmd/
│   └── server/
│       └── main.go                        # Entry point, DI wiring, graceful shutdown
│
├── internal/
│   ├── config/
│   │   └── config.go                      # Env var loading, validation
│   │
│   ├── domain/
│   │   ├── models/
│   │   │   ├── user.go                    # User, Officer, RefreshToken
│   │   │   ├── ticket.go                  # Ticket, TicketOffence, TicketPhoto, TicketNote
│   │   │   ├── payment.go                 # Payment
│   │   │   ├── objection.go               # Objection, ObjectionAttachment
│   │   │   ├── offence.go                 # Offence
│   │   │   ├── hierarchy.go               # Region, Division, District, Station
│   │   │   ├── audit.go                   # AuditLog
│   │   │   ├── sync.go                    # SyncRequest, SyncResponse, SyncTicket
│   │   │   ├── analytics.go               # Dashboard stats, report aggregates
│   │   │   └── settings.go                # SystemSetting, VehicleType
│   │   └── errors/
│   │       └── errors.go                  # Domain error types (NotFound, Conflict, etc.)
│   │
│   ├── ports/
│   │   ├── repositories/
│   │   │   ├── user_repository.go
│   │   │   ├── officer_repository.go
│   │   │   ├── ticket_repository.go
│   │   │   ├── payment_repository.go
│   │   │   ├── objection_repository.go
│   │   │   ├── offence_repository.go
│   │   │   ├── hierarchy_repository.go
│   │   │   ├── audit_repository.go
│   │   │   ├── settings_repository.go
│   │   │   └── analytics_repository.go
│   │   └── services/
│   │       ├── auth_service.go
│   │       ├── user_service.go
│   │       ├── officer_service.go
│   │       ├── ticket_service.go
│   │       ├── payment_service.go
│   │       ├── objection_service.go
│   │       ├── offence_service.go
│   │       ├── hierarchy_service.go
│   │       ├── audit_service.go
│   │       ├── sync_service.go
│   │       ├── analytics_service.go
│   │       ├── settings_service.go
│   │       └── storage_service.go         # File upload/download interface
│   │
│   ├── adapters/
│   │   ├── handlers/
│   │   │   ├── auth_handler.go
│   │   │   ├── user_handler.go
│   │   │   ├── officer_handler.go
│   │   │   ├── ticket_handler.go
│   │   │   ├── payment_handler.go
│   │   │   ├── objection_handler.go
│   │   │   ├── offence_handler.go
│   │   │   ├── hierarchy_handler.go
│   │   │   ├── audit_handler.go
│   │   │   ├── sync_handler.go
│   │   │   ├── analytics_handler.go
│   │   │   ├── settings_handler.go
│   │   │   └── health_handler.go
│   │   ├── repositories/
│   │   │   └── postgres/
│   │   │       ├── user_repo.go
│   │   │       ├── officer_repo.go
│   │   │       ├── ticket_repo.go
│   │   │       ├── payment_repo.go
│   │   │       ├── objection_repo.go
│   │   │       ├── offence_repo.go
│   │   │       ├── hierarchy_repo.go
│   │   │       ├── audit_repo.go
│   │   │       ├── settings_repo.go
│   │   │       ├── analytics_repo.go
│   │   │       └── migrations/            # SQL migration files
│   │   │           ├── 000001_create_hierarchy_tables.up.sql
│   │   │           ├── 000001_create_hierarchy_tables.down.sql
│   │   │           ├── 000002_create_user_tables.up.sql
│   │   │           ├── 000002_create_user_tables.down.sql
│   │   │           ├── 000003_create_core_tables.up.sql
│   │   │           ├── 000003_create_core_tables.down.sql
│   │   │           ├── 000004_create_payment_tables.up.sql
│   │   │           ├── 000004_create_payment_tables.down.sql
│   │   │           ├── 000005_create_system_tables.up.sql
│   │   │           ├── 000005_create_system_tables.down.sql
│   │   │           └── 000006_seed_data.up.sql
│   │   ├── storage/
│   │   │   ├── local_storage.go           # Local filesystem (development)
│   │   │   └── s3_storage.go              # S3-compatible (production)
│   │   └── payment_providers/
│   │       ├── momo_provider.go           # MTN Mobile Money
│   │       └── paystack_provider.go       # Paystack (cards, bank)
│   │
│   ├── middleware/
│   │   ├── auth.go                        # JWT validation, context injection
│   │   ├── rbac.go                        # Role-based permission checks
│   │   ├── jurisdiction.go                # Automatic jurisdiction scoping
│   │   ├── audit.go                       # Audit log creation for writes
│   │   ├── cors.go                        # CORS configuration
│   │   ├── ratelimit.go                   # Redis-backed rate limiting
│   │   ├── logging.go                     # Request/response logging
│   │   └── recovery.go                    # Panic recovery
│   │
│   ├── router/
│   │   └── router.go                      # Route registration, middleware chains
│   │
│   └── services/
│       ├── auth_service.go
│       ├── user_service.go
│       ├── officer_service.go
│       ├── ticket_service.go
│       ├── payment_service.go
│       ├── objection_service.go
│       ├── offence_service.go
│       ├── hierarchy_service.go
│       ├── audit_service.go
│       ├── sync_service.go
│       ├── analytics_service.go
│       └── settings_service.go
│
├── pkg/                                   # Shared, importable utilities
│   ├── jwt/
│   │   └── jwt.go                         # Token generation, parsing, claims
│   ├── hash/
│   │   └── hash.go                        # Bcrypt password hashing
│   ├── validator/
│   │   └── validator.go                   # Custom validation rules (Ghana phone, vehicle reg)
│   ├── response/
│   │   └── response.go                    # Standard JSON response helpers
│   ├── pagination/
│   │   └── pagination.go                  # Pagination param parsing, SQL builder
│   └── ticketnumber/
│       └── ticketnumber.go                # GPS-{YEAR}-{SEQ} generator
│
├── deployments/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
│
├── go.mod
└── go.sum
```

**Layer Flow:**

```
HTTP Request
  -> middleware/ (auth, RBAC, jurisdiction, audit, rate limit)
    -> adapters/handlers/ (parse request, validate, call service)
      -> ports/services/ (interface)
        -> services/ (business logic implementation)
          -> ports/repositories/ (interface)
            -> adapters/repositories/postgres/ (SQL execution)
              -> PostgreSQL
```

---

## 3. Database Schema (PostgreSQL 16)

### 3.1 Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 3.2 Hierarchy Tables

```sql
-- ============================================================
-- REGIONS
-- ============================================================
CREATE TABLE regions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    capital     VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DIVISIONS
-- ============================================================
CREATE TABLE divisions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    region_id   UUID NOT NULL REFERENCES regions(id),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_divisions_region_id ON divisions(region_id);

-- ============================================================
-- DISTRICTS
-- ============================================================
CREATE TABLE districts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    division_id UUID NOT NULL REFERENCES divisions(id),
    region_id   UUID NOT NULL REFERENCES regions(id),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_districts_division_id ON districts(division_id);
CREATE INDEX idx_districts_region_id   ON districts(region_id);

-- ============================================================
-- STATIONS
-- ============================================================
CREATE TABLE stations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    district_id UUID NOT NULL REFERENCES districts(id),
    division_id UUID NOT NULL REFERENCES divisions(id),
    region_id   UUID NOT NULL REFERENCES regions(id),
    address     TEXT,
    phone       VARCHAR(20),
    email       VARCHAR(150),
    latitude    DECIMAL(10, 7),
    longitude   DECIMAL(10, 7),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('HQ', 'District', 'Outpost')),
    status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stations_district_id ON stations(district_id);
CREATE INDEX idx_stations_division_id ON stations(division_id);
CREATE INDEX idx_stations_region_id   ON stations(region_id);
CREATE INDEX idx_stations_type        ON stations(type);
```

### 3.3 User Tables

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         VARCHAR(255) NOT NULL,
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    phone                 VARCHAR(20),
    role                  VARCHAR(20)  NOT NULL CHECK (role IN (
                              'officer', 'supervisor', 'admin', 'accountant', 'super_admin'
                          )),
    is_active             BOOLEAN NOT NULL DEFAULT true,
    profile_photo_url     TEXT,
    last_login_at         TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role      ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_email     ON users(email);

-- ============================================================
-- OFFICERS (extends users for field officers)
-- ============================================================
CREATE TABLE officers (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL UNIQUE REFERENCES users(id),
    badge_number      VARCHAR(50) NOT NULL UNIQUE,
    rank              VARCHAR(50),
    station_id        UUID NOT NULL REFERENCES stations(id),
    region_id         UUID NOT NULL REFERENCES regions(id),
    assigned_device_id VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_officers_station_id ON officers(station_id);
CREATE INDEX idx_officers_region_id  ON officers(region_id);
CREATE INDEX idx_officers_badge      ON officers(badge_number);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    device_id   VARCHAR(100),
    device_info JSONB,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### 3.4 Core Tables

```sql
-- ============================================================
-- OFFENCES
-- ============================================================
CREATE TABLE offences (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code         VARCHAR(20)  NOT NULL UNIQUE,
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    legal_basis  VARCHAR(300),
    category     VARCHAR(30)  NOT NULL CHECK (category IN (
                     'speed', 'traffic_signal', 'licensing', 'documentation',
                     'vehicle_condition', 'dangerous_driving', 'parking', 'obstruction', 'other'
                 )),
    default_fine DECIMAL(10, 2) NOT NULL,
    min_fine     DECIMAL(10, 2) NOT NULL,
    max_fine     DECIMAL(10, 2) NOT NULL,
    points       INTEGER DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offences_category  ON offences(category);
CREATE INDEX idx_offences_is_active ON offences(is_active);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number       VARCHAR(20) NOT NULL UNIQUE,

    -- Status
    status              VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN (
                            'unpaid', 'paid', 'overdue', 'objection', 'cancelled'
                        )),

    -- Vehicle info
    vehicle_reg_number  VARCHAR(30) NOT NULL,
    vehicle_type        VARCHAR(50),
    vehicle_color       VARCHAR(30),
    vehicle_make        VARCHAR(50),
    vehicle_model       VARCHAR(50),

    -- Driver info
    driver_name         VARCHAR(200),
    driver_license      VARCHAR(50),
    driver_phone        VARCHAR(20),
    driver_address      TEXT,

    -- Location
    location_description TEXT,
    location_latitude   DECIMAL(10, 7),
    location_longitude  DECIMAL(10, 7),

    -- Fine
    total_fine          DECIMAL(10, 2) NOT NULL DEFAULT 0,

    -- Payment (denormalized for quick access)
    payment_reference   VARCHAR(50),
    payment_deadline    TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    paid_amount         DECIMAL(10, 2),
    paid_method         VARCHAR(20),

    -- Issuing context
    officer_id          UUID NOT NULL REFERENCES officers(id),
    station_id          UUID NOT NULL REFERENCES stations(id),
    district_id         UUID REFERENCES districts(id),
    division_id         UUID REFERENCES divisions(id),
    region_id           UUID NOT NULL REFERENCES regions(id),

    -- Notes
    notes               TEXT,

    -- Sync
    sync_status         VARCHAR(20) NOT NULL DEFAULT 'synced' CHECK (sync_status IN (
                            'pending', 'synced', 'conflict', 'failed'
                        )),
    synced_at           TIMESTAMPTZ,
    client_created_id   UUID UNIQUE,

    -- Print
    printed             BOOLEAN NOT NULL DEFAULT false,
    printed_at          TIMESTAMPTZ,

    -- Void
    voided_by           UUID REFERENCES users(id),
    voided_at           TIMESTAMPTZ,
    void_reason         TEXT,

    -- Dates
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Primary query indexes
CREATE INDEX idx_tickets_status            ON tickets(status);
CREATE INDEX idx_tickets_officer_id        ON tickets(officer_id);
CREATE INDEX idx_tickets_station_id        ON tickets(station_id);
CREATE INDEX idx_tickets_region_id         ON tickets(region_id);
CREATE INDEX idx_tickets_vehicle_reg       ON tickets(vehicle_reg_number);
CREATE INDEX idx_tickets_issued_at         ON tickets(issued_at);
CREATE INDEX idx_tickets_sync_status       ON tickets(sync_status);
CREATE INDEX idx_tickets_client_created_id ON tickets(client_created_id);

-- Composite indexes for jurisdiction-scoped queries
CREATE INDEX idx_tickets_station_status_date ON tickets(station_id, status, issued_at DESC);
CREATE INDEX idx_tickets_region_status_date  ON tickets(region_id, status, issued_at DESC);
CREATE INDEX idx_tickets_officer_date        ON tickets(officer_id, issued_at DESC);
CREATE INDEX idx_tickets_district_status     ON tickets(district_id, status);
CREATE INDEX idx_tickets_division_status     ON tickets(division_id, status);

-- ============================================================
-- TICKET_OFFENCES (junction table)
-- ============================================================
CREATE TABLE ticket_offences (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    offence_id UUID NOT NULL REFERENCES offences(id),
    fine_amount DECIMAL(10, 2) NOT NULL,
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_offences_ticket_id  ON ticket_offences(ticket_id);
CREATE INDEX idx_ticket_offences_offence_id ON ticket_offences(offence_id);

-- ============================================================
-- TICKET_PHOTOS
-- ============================================================
CREATE TABLE ticket_photos (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id         UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    type              VARCHAR(20) NOT NULL CHECK (type IN ('vehicle', 'plate', 'evidence', 'other')),
    storage_path      TEXT NOT NULL,
    thumbnail_path    TEXT,
    original_filename VARCHAR(255),
    file_size         INTEGER,
    mime_type         VARCHAR(50),
    width             INTEGER,
    height            INTEGER,
    latitude          DECIMAL(10, 7),
    longitude         DECIMAL(10, 7),
    uploaded          BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_photos_ticket_id ON ticket_photos(ticket_id);

-- ============================================================
-- TICKET_NOTES
-- ============================================================
CREATE TABLE ticket_notes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id  UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    officer_id UUID NOT NULL REFERENCES officers(id),
    edited     BOOLEAN NOT NULL DEFAULT false,
    edited_at  TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);
```

### 3.5 Payment & Objection Tables

```sql
-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(50)  NOT NULL UNIQUE,
    ticket_id         UUID NOT NULL REFERENCES tickets(id),

    -- Amounts
    amount            DECIMAL(10, 2) NOT NULL,
    currency          VARCHAR(3) NOT NULL DEFAULT 'GHS',
    original_fine     DECIMAL(10, 2) NOT NULL,
    late_fee          DECIMAL(10, 2) DEFAULT 0,
    discount          DECIMAL(10, 2) DEFAULT 0,

    -- Method
    method            VARCHAR(20) NOT NULL CHECK (method IN (
                          'momo', 'vodacash', 'airteltigo', 'bank', 'card', 'cash'
                      )),

    -- Mobile money fields
    phone_number      VARCHAR(20),
    network           VARCHAR(20),
    transaction_id    VARCHAR(100),

    -- Card fields
    card_last4        VARCHAR(4),
    card_brand        VARCHAR(20),

    -- Bank fields
    bank_name         VARCHAR(100),
    account_number    VARCHAR(50),

    -- Status
    status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                          'pending', 'processing', 'completed', 'failed', 'refunded'
                      )),
    status_message    TEXT,

    -- Payer info
    payer_name        VARCHAR(200),
    payer_phone       VARCHAR(20),
    payer_email       VARCHAR(255),

    -- Receipt
    receipt_number    VARCHAR(50) UNIQUE,

    -- Processing
    processed_by_id   UUID REFERENCES users(id),
    station_id        UUID REFERENCES stations(id),
    provider_response JSONB,

    -- Timestamps
    processed_at      TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_ticket_id  ON payments(ticket_id);
CREATE INDEX idx_payments_status     ON payments(status);
CREATE INDEX idx_payments_method     ON payments(method);
CREATE INDEX idx_payments_station_id ON payments(station_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_receipt    ON payments(receipt_number);

-- ============================================================
-- OBJECTIONS
-- ============================================================
CREATE TABLE objections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id       UUID NOT NULL REFERENCES tickets(id),
    reason          VARCHAR(200) NOT NULL,
    details         TEXT,
    contact_phone   VARCHAR(20),
    contact_email   VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending', 'approved', 'rejected'
                    )),
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    review_notes    TEXT,
    adjusted_fine   DECIMAL(10, 2),
    review_deadline TIMESTAMPTZ,
    filed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objections_ticket_id ON objections(ticket_id);
CREATE INDEX idx_objections_status    ON objections(status);
CREATE INDEX idx_objections_filed_at  ON objections(filed_at);

-- ============================================================
-- OBJECTION_ATTACHMENTS
-- ============================================================
CREATE TABLE objection_attachments (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objection_id  UUID NOT NULL REFERENCES objections(id) ON DELETE CASCADE,
    type          VARCHAR(20) NOT NULL CHECK (type IN ('image', 'document', 'video')),
    storage_path  TEXT NOT NULL,
    original_name VARCHAR(255),
    file_size     INTEGER,
    mime_type     VARCHAR(50),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objection_attachments_objection_id ON objection_attachments(objection_id);
```

### 3.6 System Tables

```sql
-- ============================================================
-- AUDIT_LOGS (immutable - no updated_at)
-- ============================================================
CREATE TABLE audit_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES users(id),
    user_name         VARCHAR(200),
    user_role         VARCHAR(20),
    user_badge_number VARCHAR(50),
    action            VARCHAR(50) NOT NULL,
    entity_type       VARCHAR(50) NOT NULL,
    entity_id         UUID,
    entity_name       VARCHAR(200),
    description       TEXT,
    old_value         JSONB,
    new_value         JSONB,
    metadata          JSONB,
    ip_address        INET,
    user_agent        TEXT,
    session_id        VARCHAR(100),
    station_id        UUID REFERENCES stations(id),
    region_id         UUID REFERENCES regions(id),
    severity          VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN (
                          'info', 'warning', 'critical'
                      )),
    success           BOOLEAN NOT NULL DEFAULT true,
    error_message     TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action      ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_station_id  ON audit_logs(station_id);
CREATE INDEX idx_audit_logs_region_id   ON audit_logs(region_id);
CREATE INDEX idx_audit_logs_severity    ON audit_logs(severity);

-- ============================================================
-- SYSTEM_SETTINGS (key-value store)
-- ============================================================
CREATE TABLE system_settings (
    key        VARCHAR(100) PRIMARY KEY,
    section    VARCHAR(50) NOT NULL,
    value      JSONB NOT NULL,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_settings_section ON system_settings(section);

-- ============================================================
-- VEHICLE_TYPES
-- ============================================================
CREATE TABLE vehicle_types (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.7 Index Summary

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `tickets` | `idx_tickets_station_status_date` | `(station_id, status, issued_at DESC)` | Supervisor: tickets at my station |
| `tickets` | `idx_tickets_region_status_date` | `(region_id, status, issued_at DESC)` | Admin: tickets in my region |
| `tickets` | `idx_tickets_officer_date` | `(officer_id, issued_at DESC)` | Officer: my tickets |
| `tickets` | `idx_tickets_district_status` | `(district_id, status)` | District-level filtering |
| `tickets` | `idx_tickets_division_status` | `(division_id, status)` | Division-level filtering |
| `tickets` | `idx_tickets_client_created_id` | `(client_created_id)` | Sync dedup lookups |
| `tickets` | `idx_tickets_vehicle_reg` | `(vehicle_reg_number)` | Vehicle history lookups |
| `payments` | `idx_payments_created_at` | `(created_at)` | Revenue reporting |
| `audit_logs` | `idx_audit_logs_created_at` | `(created_at DESC)` | Recent activity feed |
| `audit_logs` | `idx_audit_logs_entity` | `(entity_type, entity_id)` | Entity change history |

---

## 4. Key Go Dependencies

| Package | Import Path | Purpose |
|---------|-------------|---------|
| chi | `github.com/go-chi/chi/v5` | Lightweight HTTP router with middleware support |
| pgx | `github.com/jackc/pgx/v5` | High-performance PostgreSQL driver with connection pool |
| golang-jwt | `github.com/golang-jwt/jwt/v5` | JWT token generation and validation |
| bcrypt | `golang.org/x/crypto/bcrypt` | Password hashing |
| migrate | `github.com/golang-migrate/migrate/v4` | Database schema migrations |
| zap | `go.uber.org/zap` | Structured, leveled logging |
| validator | `github.com/go-playground/validator/v10` | Struct-based input validation |
| uuid | `github.com/google/uuid` | UUID v4 generation |
| cors | `github.com/rs/cors` | CORS middleware |
| go-redis | `github.com/redis/go-redis/v9` | Redis client for caching and rate limiting |
| minio-go | `github.com/minio/minio-go/v7` | S3-compatible object storage client |
| godotenv | `github.com/joho/godotenv` | Load .env files in development |

---

## 5. Authentication & Authorization Design

### 5.1 Token Structure

**Access Token (JWT, 15 min):**

```json
{
  "sub": "user-uuid",
  "role": "officer",
  "officer_id": "officer-uuid",
  "station_id": "station-uuid",
  "region_id": "region-uuid",
  "badge_number": "GPS-001",
  "iat": 1700000000,
  "exp": 1700000900
}
```

**Refresh Token (opaque, 7 days):** stored as bcrypt hash in `refresh_tokens` table.

### 5.2 Middleware Chain

```
Request
  -> recovery.go          (panic -> 500)
  -> logging.go           (request/response log)
  -> cors.go              (CORS headers)
  -> ratelimit.go         (Redis-backed sliding window)
  -> auth.go              (JWT validation, inject user context)
  -> rbac.go              (check role has required permission)
  -> jurisdiction.go      (inject scope filters into context)
  -> audit.go             (log write operations)
  -> handler
```

### 5.3 RBAC Permissions

Permissions are checked at the handler level via the `rbac` middleware:

```go
// Example route registration
r.With(rbac.Require("ticket:create")).Post("/", h.CreateTicket)
r.With(rbac.Require("ticket:view:station")).Get("/", h.ListTickets)
r.With(rbac.Require("ticket:void")).Patch("/{id}/void", h.VoidTicket)
```

| Permission | officer | supervisor | admin | accountant | super_admin |
|------------|:-------:|:----------:|:-----:|:----------:|:-----------:|
| `ticket:create` | Y | Y | Y | - | Y |
| `ticket:view:own` | Y | Y | Y | Y | Y |
| `ticket:view:station` | - | Y | Y | Y | Y |
| `ticket:view:all` | - | - | Y | Y | Y |
| `ticket:edit` | - | - | Y | - | Y |
| `ticket:void` | - | Y | Y | - | Y |
| `ticket:print` | Y | Y | Y | - | Y |
| `officer:view:station` | - | Y | Y | - | Y |
| `officer:view:all` | - | - | Y | - | Y |
| `officer:create` | - | - | Y | - | Y |
| `officer:edit` | - | - | Y | - | Y |
| `payment:view` | - | - | Y | Y | Y |
| `payment:process` | - | - | Y | Y | Y |
| `payment:reconcile` | - | - | - | Y | Y |
| `objection:view` | - | - | Y | - | Y |
| `objection:process` | - | - | Y | - | Y |
| `report:view:station` | - | Y | Y | Y | Y |
| `report:view:all` | - | - | Y | Y | Y |
| `report:export` | - | - | Y | Y | Y |

### 5.4 Jurisdiction Scoping

The `jurisdiction` middleware injects query filters based on the authenticated user:

```go
// Automatically applied to all list/query endpoints
switch user.Role {
case "officer":
    ctx = WithFilter(ctx, "officer_id", user.OfficerID)
case "supervisor":
    ctx = WithFilter(ctx, "station_id", user.StationID)
case "admin", "accountant":
    ctx = WithFilter(ctx, "region_id", user.RegionID)
case "super_admin":
    // No filter - sees everything
}
```

Repository implementations read these filters from context and apply them to SQL queries. Clients never pass jurisdiction parameters -- the server enforces them.

---

## 6. Offline Sync Architecture

### 6.1 Design Principles

- Client generates UUIDs for all entities (tickets, photos, notes)
- Server uses `client_created_id` for idempotent deduplication
- **Server-wins** conflict resolution: if timestamps conflict, server data takes precedence
- Batch submission to minimize HTTP round trips

### 6.2 Sync Flow

```
Officer Device (offline)                         Server
       |                                           |
       |  1. Create tickets locally (UUID + data)  |
       |  2. Capture photos, store locally          |
       |                                           |
       |--- POST /api/sync ----------------------->|
       |    {                                      |
       |      lastSyncTimestamp: "...",             |
       |      tickets: [ {..., clientCreatedId} ],  |
       |      photos: [ (multipart) ]              |
       |    }                                      |
       |                                           |
       |    3. Server dedup by client_created_id   |
       |    4. Insert/update, resolve conflicts    |
       |    5. Process photos -> storage           |
       |                                           |
       |<-- 200 OK -------------------------------|
       |    {                                      |
       |      synced: [ {clientId, serverId} ],    |
       |      conflicts: [ {clientId, resolution} ],|
       |      serverUpdates: [ tickets since last ] |
       |    }                                      |
       |                                           |
       |  6. Update local DB with server IDs       |
       |  7. Apply server updates to local state   |
```

### 6.3 Sync Endpoint

```
POST /api/sync
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `lastSyncTimestamp` | ISO 8601 string | Last successful sync time |
| `tickets` | JSON array | Tickets created/modified offline |
| `photos` | File[] | Photo files with ticket reference |

**Constraints:**
- Max 50 items per sync batch (`SYNC_CONFIG.BATCH_SIZE`)
- Max 5 retry attempts before marking as failed
- Max 5 MB per photo, max 4 photos per ticket
- Re-submitting the same `client_created_id` returns the existing server record (idempotent)

### 6.4 Conflict Resolution

```go
// Server-wins strategy
if existingTicket != nil && existingTicket.UpdatedAt.After(incomingTicket.UpdatedAt) {
    // Keep server version, return as conflict with resolution
    return SyncConflict{
        ClientID:   incoming.ClientCreatedID,
        Resolution: "server_wins",
        ServerData: existingTicket,
    }
}
```

---

## 7. Containerization

### 7.1 docker-compose.yml

```yaml
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: deployments/Dockerfile
    container_name: gps-api
    ports:
      - "${API_PORT:-8000}:8000"
    env_file:
      - deployments/.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - uploads:/app/uploads

  postgres:
    image: postgres:16-alpine
    container_name: gps-postgres
    ports:
      - "${DB_PORT:-5432}:5432"
    environment:
      POSTGRES_DB: ${DB_NAME:-gps_ticketing}
      POSTGRES_USER: ${DB_USER:-gps_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-gps_password}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-gps_user} -d ${DB_NAME:-gps_ticketing}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: gps-redis
    ports:
      - "${REDIS_PORT:-6379}:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD:-gps_redis_pass}
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-gps_redis_pass}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
  uploads:
```

### 7.2 Dockerfile (multi-stage)

```dockerfile
# ---- Build Stage ----
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /build/server ./cmd/server/main.go

# ---- Runtime Stage ----
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /build/server .
COPY --from=builder /build/internal/adapters/repositories/postgres/migrations ./migrations

RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["./server"]
```

### 7.3 .env.example

```env
# ============================================================
# Server
# ============================================================
APP_ENV=development
API_PORT=8000
API_READ_TIMEOUT=15s
API_WRITE_TIMEOUT=15s
API_IDLE_TIMEOUT=60s

# ============================================================
# Database (PostgreSQL)
# ============================================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=gps_ticketing
DB_USER=gps_user
DB_PASSWORD=gps_password
DB_SSL_MODE=disable
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=5m

# ============================================================
# Redis
# ============================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=gps_redis_pass
REDIS_DB=0

# ============================================================
# JWT
# ============================================================
JWT_SECRET=change-this-to-a-long-random-secret-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=168h

# ============================================================
# CORS
# ============================================================
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,X-Device-ID,Accept

# ============================================================
# Storage
# ============================================================
STORAGE_DRIVER=local
STORAGE_LOCAL_PATH=./uploads
# S3_ENDPOINT=
# S3_BUCKET=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
# S3_REGION=
# S3_USE_SSL=true

# ============================================================
# Rate Limiting
# ============================================================
RATE_LIMIT_AUTH=10
RATE_LIMIT_WRITE=60
RATE_LIMIT_READ=120
RATE_LIMIT_UPLOAD=20
RATE_LIMIT_SYNC=10
RATE_LIMIT_WINDOW=60s

# ============================================================
# Logging
# ============================================================
LOG_LEVEL=debug
LOG_FORMAT=json

# ============================================================
# Business Rules
# ============================================================
TICKET_PREFIX=GPS
PAYMENT_GRACE_DAYS=14
OBJECTION_DEADLINE_DAYS=7
MAX_PHOTOS_PER_TICKET=4
MAX_PHOTO_SIZE_MB=5
SYNC_BATCH_SIZE=50
SYNC_MAX_RETRIES=5

# ============================================================
# Payment Providers (optional, for production)
# ============================================================
# MOMO_API_KEY=
# MOMO_API_SECRET=
# MOMO_SUBSCRIPTION_KEY=
# MOMO_BASE_URL=
# PAYSTACK_SECRET_KEY=
# PAYSTACK_PUBLIC_KEY=
```

---

## 8. Seed Data

### 8.1 Ghana Regions (16)

```sql
INSERT INTO regions (id, name, code, capital) VALUES
    (uuid_generate_v4(), 'Greater Accra',  'GA', 'Accra'),
    (uuid_generate_v4(), 'Ashanti',        'AS', 'Kumasi'),
    (uuid_generate_v4(), 'Western',        'WR', 'Sekondi-Takoradi'),
    (uuid_generate_v4(), 'Eastern',        'ER', 'Koforidua'),
    (uuid_generate_v4(), 'Central',        'CR', 'Cape Coast'),
    (uuid_generate_v4(), 'Northern',       'NR', 'Tamale'),
    (uuid_generate_v4(), 'Volta',          'VR', 'Ho'),
    (uuid_generate_v4(), 'Upper East',     'UE', 'Bolgatanga'),
    (uuid_generate_v4(), 'Upper West',     'UW', 'Wa'),
    (uuid_generate_v4(), 'Bono',           'BA', 'Sunyani'),
    (uuid_generate_v4(), 'Bono East',      'BE', 'Techiman'),
    (uuid_generate_v4(), 'Ahafo',          'AH', 'Goaso'),
    (uuid_generate_v4(), 'Savannah',       'SV', 'Damongo'),
    (uuid_generate_v4(), 'North East',     'NE', 'Nalerigu'),
    (uuid_generate_v4(), 'Oti',            'OT', 'Dambai'),
    (uuid_generate_v4(), 'Western North',  'WN', 'Sefwi Wiawso');
```

### 8.2 Default Traffic Offences (15)

```sql
INSERT INTO offences (id, code, name, description, legal_basis, category, default_fine, min_fine, max_fine, points) VALUES
    (uuid_generate_v4(), 'SPD-001', 'Exceeding Speed Limit',
     'Driving above the posted speed limit in a designated zone',
     'Road Traffic Act 2004 (Act 683), Section 15(1)',
     'speed', 200.00, 100.00, 500.00, 3),

    (uuid_generate_v4(), 'SPD-002', 'Reckless Speeding',
     'Driving at excessive speed endangering other road users',
     'Road Traffic Act 2004 (Act 683), Section 15(2)',
     'speed', 500.00, 300.00, 1000.00, 6),

    (uuid_generate_v4(), 'TRF-001', 'Red Light Violation',
     'Failing to stop at a red traffic signal',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 42',
     'traffic_signal', 300.00, 200.00, 600.00, 4),

    (uuid_generate_v4(), 'TRF-002', 'Failure to Obey Traffic Signs',
     'Ignoring or disobeying mandatory traffic signs',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 38',
     'traffic_signal', 150.00, 100.00, 400.00, 2),

    (uuid_generate_v4(), 'DOC-001', 'Driving Without License',
     'Operating a motor vehicle without a valid driver''s license',
     'Road Traffic Act 2004 (Act 683), Section 30',
     'licensing', 400.00, 200.00, 800.00, 6),

    (uuid_generate_v4(), 'DOC-002', 'Expired Vehicle Registration',
     'Operating a vehicle with expired registration',
     'Road Traffic Act 2004 (Act 683), Section 8',
     'documentation', 250.00, 150.00, 500.00, 0),

    (uuid_generate_v4(), 'DOC-003', 'No Insurance',
     'Driving without valid third-party insurance',
     'Motor Vehicles (Third Party Insurance) Act 1958, Section 1',
     'documentation', 500.00, 300.00, 1000.00, 0),

    (uuid_generate_v4(), 'VEH-001', 'No Seatbelt',
     'Driver or passenger not wearing a seatbelt',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 115',
     'vehicle_condition', 100.00, 50.00, 200.00, 2),

    (uuid_generate_v4(), 'VEH-002', 'Defective Lights',
     'Operating a vehicle with non-functional headlights or taillights',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 96',
     'vehicle_condition', 150.00, 100.00, 300.00, 0),

    (uuid_generate_v4(), 'DNG-001', 'Using Mobile Phone While Driving',
     'Operating a mobile phone without hands-free while driving',
     'Road Traffic Act 2004 (Act 683), Section 15(3)',
     'dangerous_driving', 200.00, 150.00, 400.00, 3),

    (uuid_generate_v4(), 'DNG-002', 'Drunk Driving',
     'Operating a vehicle while under the influence of alcohol',
     'Road Traffic Act 2004 (Act 683), Section 16',
     'dangerous_driving', 1000.00, 500.00, 2000.00, 10),

    (uuid_generate_v4(), 'DNG-003', 'Dangerous Overtaking',
     'Overtaking in a prohibited zone or in a dangerous manner',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 54',
     'dangerous_driving', 300.00, 200.00, 600.00, 4),

    (uuid_generate_v4(), 'PRK-001', 'Illegal Parking',
     'Parking in a no-parking zone or prohibited area',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 66',
     'parking', 100.00, 50.00, 200.00, 0),

    (uuid_generate_v4(), 'PRK-002', 'Double Parking',
     'Parking alongside another parked vehicle blocking traffic',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 67',
     'parking', 150.00, 100.00, 300.00, 0),

    (uuid_generate_v4(), 'PRK-003', 'Parking in Handicap Zone',
     'Parking in a zone designated for persons with disabilities without permit',
     'Road Traffic Regulations 2012 (L.I. 2180), Regulation 68',
     'parking', 300.00, 200.00, 500.00, 0);
```

### 8.3 Vehicle Types (10)

```sql
INSERT INTO vehicle_types (id, name) VALUES
    (uuid_generate_v4(), 'Saloon Car'),
    (uuid_generate_v4(), 'SUV/4x4'),
    (uuid_generate_v4(), 'Pickup Truck'),
    (uuid_generate_v4(), 'Bus'),
    (uuid_generate_v4(), 'Minibus (Trotro)'),
    (uuid_generate_v4(), 'Motorcycle'),
    (uuid_generate_v4(), 'Tricycle (Aboboyaa)'),
    (uuid_generate_v4(), 'Commercial Truck'),
    (uuid_generate_v4(), 'Taxi'),
    (uuid_generate_v4(), 'Other');
```

### 8.4 Default Super Admin User

```sql
-- Password: "Admin@2026!" (bcrypt hashed)
-- IMPORTANT: Change this password immediately after first login in production.
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
VALUES (
    uuid_generate_v4(),
    'admin@ghanapolice.gov.gh',
    '$2a$12$LJ3m4ys3Lk0TSwHilNnIOeVn8.VNIWmOg0tFKXRYBYzGaqxUhyvMG',
    'System',
    'Administrator',
    '+233200000000',
    'super_admin'
);
```

### 8.5 Default System Settings

```sql
INSERT INTO system_settings (key, section, value) VALUES
    ('payment_grace_days', 'tickets', '14'),
    ('objection_deadline_days', 'tickets', '7'),
    ('max_photos_per_ticket', 'tickets', '4'),
    ('max_photo_size_mb', 'storage', '5'),
    ('sync_batch_size', 'sync', '50'),
    ('sync_max_retries', 'sync', '5'),
    ('ticket_number_prefix', 'tickets', '"GPS"'),
    ('default_currency', 'payments', '"GHS"'),
    ('late_fee_percentage', 'payments', '10'),
    ('system_timezone', 'general', '"Africa/Accra"');
```

---

## Quick Reference

### Business Constants

| Constant | Value |
|----------|-------|
| Ticket Number Prefix | `GPS` |
| Ticket Number Format | `GPS-{YEAR}-{6-DIGIT-SEQ}` (e.g., `GPS-2026-000142`) |
| Payment Grace Period | 14 days |
| Objection Deadline | 7 days from ticket issue |
| Max Photos Per Ticket | 4 |
| Max Photo Size | 5 MB |
| Sync Batch Size | 50 items |
| Sync Max Retries | 5 |
| Conflict Resolution | Server-wins |
| Currency | GHS (Ghana Cedi, GH₵) |
| Phone Format | `+233XXXXXXXXX` or `0XXXXXXXXX` |
| Server Timezone | `Africa/Accra` (GMT+0) |

### Standard API Response

```json
{
  "success": true,
  "data": { },
  "message": "...",
  "timestamp": "2026-01-15T10:30:00Z"
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `UNAUTHORIZED` | 401 | Missing/expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
