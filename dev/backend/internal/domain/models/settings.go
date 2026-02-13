package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ---------------------------------------------------------------------------
// Settings sections (stored as JSONB rows in system_settings table)
// ---------------------------------------------------------------------------

// ValidSettingsSections is the list of valid section names.
var ValidSettingsSections = []string{"system", "ticket", "notifications", "security", "data", "device"}

// SystemSettingRow is the DB row for a settings section.
type SystemSettingRow struct {
	ID        uuid.UUID       `json:"id"`
	Section   string          `json:"section"`
	Value     json.RawMessage `json:"value"`
	UpdatedBy *uuid.UUID      `json:"updatedBy,omitempty"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

// AllSettings groups all settings sections.
type AllSettings struct {
	System        json.RawMessage `json:"system"`
	Ticket        json.RawMessage `json:"ticket"`
	Notifications json.RawMessage `json:"notifications"`
	Security      json.RawMessage `json:"security"`
	Data          json.RawMessage `json:"data"`
	Device        json.RawMessage `json:"device"`
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

// DefaultSettings returns defaults for each section.
func DefaultSettings() map[string]json.RawMessage {
	return map[string]json.RawMessage{
		"system":        json.RawMessage(`{"organizationName":"Ghana Police Service","timezone":"Africa/Accra","dateFormat":"DD/MM/YYYY","currency":"GHS","maintenanceMode":false}`),
		"ticket":        json.RawMessage(`{"prefix":"GPS","paymentGraceDays":14,"objectionDeadlineDays":7,"maxPhotos":4,"maxPhotoSizeMB":5,"autoOverdueEnabled":true}`),
		"notifications": json.RawMessage(`{"smsEnabled":true,"emailEnabled":true,"overdueReminderDays":[7,14],"paymentConfirmation":true}`),
		"security":      json.RawMessage(`{"maxLoginAttempts":5,"lockoutDurationMinutes":30,"accessTokenExpiryMinutes":15,"refreshTokenExpiryDays":7,"passwordMinLength":8,"requirePasswordChange":true}`),
		"data":          json.RawMessage(`{"syncBatchSize":50,"maxSyncRetries":5,"conflictResolution":"server-wins","dataRetentionDays":365}`),
		"device":        json.RawMessage(`{"gpsRequired":true,"cameraRequired":false,"offlineEnabled":true,"autoSyncIntervalSeconds":300}`),
	}
}

// ---------------------------------------------------------------------------
// Lookup response
// ---------------------------------------------------------------------------

// LookupData is the combined reference data for offline caching.
type LookupData struct {
	Offences     []LookupOffence     `json:"offences"`
	Regions      []LookupRegion      `json:"regions"`
	Stations     []LookupStation     `json:"stations"`
	VehicleTypes []LookupVehicleType `json:"vehicleTypes"`
	LastUpdated  time.Time           `json:"lastUpdated"`
}

// LookupOffence is a minimal offence for the lookup endpoint.
type LookupOffence struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	DefaultFine float64   `json:"defaultFine"`
	MinFine     float64   `json:"minFine"`
	MaxFine     float64   `json:"maxFine"`
}

// LookupRegion is a minimal region for the lookup endpoint.
type LookupRegion struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Code string    `json:"code"`
}

// LookupStation is a minimal station for the lookup endpoint.
type LookupStation struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Code     string    `json:"code"`
	RegionID uuid.UUID `json:"regionId"`
}

// LookupVehicleType is a minimal vehicle type for the lookup endpoint.
type LookupVehicleType struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}
