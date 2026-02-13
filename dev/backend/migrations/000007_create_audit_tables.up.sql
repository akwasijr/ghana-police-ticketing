-- Audit logs table (immutable - no update/delete endpoints)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(200) NOT NULL DEFAULT '',
    user_role VARCHAR(50) NOT NULL DEFAULT '',
    user_badge_number VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(200),
    description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    station_id UUID,
    station_name VARCHAR(200),
    region_id UUID,
    region_name VARCHAR(200),
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_station_id ON audit_logs(station_id);
CREATE INDEX idx_audit_logs_region_id ON audit_logs(region_id);
