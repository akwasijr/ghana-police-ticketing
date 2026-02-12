-- 000001: Create hierarchy tables (regions, divisions, districts, stations)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- ============================================================
-- SEED: Ghana's 16 Regions
-- ============================================================
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
