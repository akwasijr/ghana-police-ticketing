-- 000003: Create core tables (offences, vehicle_types, tickets, ticket_offences, ticket_photos, ticket_notes)

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
-- VEHICLE_TYPES
-- ============================================================
CREATE TABLE vehicle_types (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number       VARCHAR(20) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (status IN (
                            'unpaid', 'paid', 'overdue', 'objection', 'cancelled'
                        )),
    vehicle_reg_number  VARCHAR(30) NOT NULL,
    vehicle_type        VARCHAR(50),
    vehicle_color       VARCHAR(30),
    vehicle_make        VARCHAR(50),
    vehicle_model       VARCHAR(50),
    driver_name         VARCHAR(200),
    driver_license      VARCHAR(50),
    driver_phone        VARCHAR(20),
    driver_address      TEXT,
    location_description TEXT,
    location_latitude   DECIMAL(10, 7),
    location_longitude  DECIMAL(10, 7),
    total_fine          DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_reference   VARCHAR(50),
    payment_deadline    TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    paid_amount         DECIMAL(10, 2),
    paid_method         VARCHAR(20),
    officer_id          UUID NOT NULL REFERENCES officers(id),
    station_id          UUID NOT NULL REFERENCES stations(id),
    district_id         UUID REFERENCES districts(id),
    division_id         UUID REFERENCES divisions(id),
    region_id           UUID NOT NULL REFERENCES regions(id),
    notes               TEXT,
    sync_status         VARCHAR(20) NOT NULL DEFAULT 'synced' CHECK (sync_status IN (
                            'pending', 'synced', 'conflict', 'failed'
                        )),
    synced_at           TIMESTAMPTZ,
    client_created_id   UUID UNIQUE,
    printed             BOOLEAN NOT NULL DEFAULT false,
    printed_at          TIMESTAMPTZ,
    voided_by           UUID REFERENCES users(id),
    voided_at           TIMESTAMPTZ,
    void_reason         TEXT,
    issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status            ON tickets(status);
CREATE INDEX idx_tickets_officer_id        ON tickets(officer_id);
CREATE INDEX idx_tickets_station_id        ON tickets(station_id);
CREATE INDEX idx_tickets_region_id         ON tickets(region_id);
CREATE INDEX idx_tickets_vehicle_reg       ON tickets(vehicle_reg_number);
CREATE INDEX idx_tickets_issued_at         ON tickets(issued_at);
CREATE INDEX idx_tickets_sync_status       ON tickets(sync_status);
CREATE INDEX idx_tickets_client_created_id ON tickets(client_created_id);
CREATE INDEX idx_tickets_station_status_date ON tickets(station_id, status, issued_at DESC);
CREATE INDEX idx_tickets_region_status_date  ON tickets(region_id, status, issued_at DESC);
CREATE INDEX idx_tickets_officer_date        ON tickets(officer_id, issued_at DESC);
CREATE INDEX idx_tickets_district_status     ON tickets(district_id, status);
CREATE INDEX idx_tickets_division_status     ON tickets(division_id, status);

-- Ticket number sequence
CREATE SEQUENCE ticket_number_seq START WITH 1;

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
