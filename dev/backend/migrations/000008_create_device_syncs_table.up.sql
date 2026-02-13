-- Device sync tracking
CREATE TABLE IF NOT EXISTS device_syncs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    device_id       VARCHAR(255) NOT NULL,
    last_sync_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items_synced    INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

CREATE INDEX idx_device_syncs_user_id ON device_syncs(user_id);
CREATE INDEX idx_device_syncs_device_id ON device_syncs(device_id);
