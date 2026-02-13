-- System settings (JSONB per section)
CREATE TABLE IF NOT EXISTS system_settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section     VARCHAR(50) NOT NULL UNIQUE,
    value       JSONB NOT NULL DEFAULT '{}',
    updated_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO system_settings (section, value) VALUES
('system', '{"organizationName":"Ghana Police Service","timezone":"Africa/Accra","dateFormat":"DD/MM/YYYY","currency":"GHS","maintenanceMode":false}'),
('ticket', '{"prefix":"GPS","paymentGraceDays":14,"objectionDeadlineDays":7,"maxPhotos":4,"maxPhotoSizeMB":5,"autoOverdueEnabled":true}'),
('notifications', '{"smsEnabled":true,"emailEnabled":true,"overdueReminderDays":[7,14],"paymentConfirmation":true}'),
('security', '{"maxLoginAttempts":5,"lockoutDurationMinutes":30,"accessTokenExpiryMinutes":15,"refreshTokenExpiryDays":7,"passwordMinLength":8,"requirePasswordChange":true}'),
('data', '{"syncBatchSize":50,"maxSyncRetries":5,"conflictResolution":"server-wins","dataRetentionDays":365}'),
('device', '{"gpsRequired":true,"cameraRequired":false,"offlineEnabled":true,"autoSyncIntervalSeconds":300}')
ON CONFLICT (section) DO NOTHING;
