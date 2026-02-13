-- 000005: Create payment tables

CREATE TABLE payments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(50)    NOT NULL UNIQUE,
    ticket_id         UUID           NOT NULL REFERENCES tickets(id),
    ticket_number     VARCHAR(30)    NOT NULL,
    amount            DECIMAL(10, 2) NOT NULL,
    currency          VARCHAR(5)     NOT NULL DEFAULT 'GHS',
    original_fine     DECIMAL(10, 2) NOT NULL DEFAULT 0,
    late_fee          DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount          DECIMAL(10, 2) NOT NULL DEFAULT 0,
    method            VARCHAR(20)    NOT NULL CHECK (method IN ('momo', 'vodacash', 'airteltigo', 'bank', 'card', 'cash')),
    phone_number      VARCHAR(20),
    network           VARCHAR(30),
    transaction_id    VARCHAR(100),
    status            VARCHAR(20)    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    status_message    TEXT,
    payer_name        VARCHAR(200)   NOT NULL,
    payer_phone       VARCHAR(20),
    payer_email       VARCHAR(200),
    receipt_number    VARCHAR(50)    UNIQUE,
    processed_by_id   UUID           REFERENCES users(id),
    station_id        UUID           REFERENCES stations(id),
    provider_response JSONB,
    processed_at      TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_ticket_id ON payments(ticket_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_payment_reference ON payments(payment_reference);
CREATE INDEX idx_payments_receipt_number ON payments(receipt_number);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_station_id ON payments(station_id);

-- Sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;
