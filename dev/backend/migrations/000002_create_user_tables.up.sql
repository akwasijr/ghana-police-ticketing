-- 000002: Create user tables (users, officers, refresh_tokens)

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

-- ============================================================
-- SEED: Default Super Admin User
-- Password: "Admin@2026!" (bcrypt hashed)
-- ============================================================
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role)
VALUES (
    uuid_generate_v4(),
    'admin@ghanapolice.gov.gh',
    '$2a$12$sE8ZRNOFlJR8VTMZstAGXee.CWAVJPNnnU60RxqQfUmv6TT/P7QZK',
    'System',
    'Administrator',
    '+233200000000',
    'super_admin'
);
