-- Objections table
CREATE TABLE IF NOT EXISTS objections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    ticket_number VARCHAR(30) NOT NULL,
    vehicle_reg VARCHAR(30) NOT NULL,
    offence_type VARCHAR(500) NOT NULL,
    fine_amount DECIMAL(12,2) NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    evidence TEXT,
    driver_name VARCHAR(200) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    driver_email VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_deadline TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewed_by_id UUID REFERENCES users(id),
    review_notes TEXT,
    adjusted_fine DECIMAL(12,2),
    station_id UUID REFERENCES stations(id),
    region_id UUID REFERENCES regions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objections_ticket_id ON objections(ticket_id);
CREATE INDEX idx_objections_status ON objections(status);
CREATE INDEX idx_objections_station_id ON objections(station_id);
CREATE INDEX idx_objections_region_id ON objections(region_id);
CREATE INDEX idx_objections_submitted_at ON objections(submitted_at);

-- Objection attachments
CREATE TABLE IF NOT EXISTS objection_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objection_id UUID NOT NULL REFERENCES objections(id) ON DELETE CASCADE,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objection_attachments_objection_id ON objection_attachments(objection_id);
