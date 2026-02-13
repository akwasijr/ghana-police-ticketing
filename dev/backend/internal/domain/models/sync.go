package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

// SyncRequest is the batch sync payload from the device.
type SyncRequest struct {
	LastSyncTimestamp time.Time       `json:"lastSyncTimestamp"`
	Tickets          []SyncTicketItem `json:"tickets"`
	Photos           []SyncPhotoItem  `json:"photos"`
}

// SyncTicketItem is a single ticket to sync from the device.
type SyncTicketItem struct {
	ID        string          `json:"id"`
	Action    string          `json:"action"` // "create" or "update"
	Data      json.RawMessage `json:"data"`
	Timestamp time.Time       `json:"timestamp"`
}

// SyncPhotoItem is a single photo to sync from the device.
type SyncPhotoItem struct {
	TicketID string `json:"ticketId"`
	PhotoID  string `json:"photoId"`
	Data     string `json:"data"` // base64-encoded
	Type     string `json:"type"` // vehicle, plate, evidence, other
}

// SyncTicketData is the parsed ticket data from a create action.
type SyncTicketData struct {
	ClientCreatedID      *uuid.UUID `json:"clientCreatedId,omitempty"`
	VehicleRegistration  string     `json:"vehicleRegistration"`
	VehicleType          *string    `json:"vehicleType,omitempty"`
	VehicleColor         *string    `json:"vehicleColor,omitempty"`
	VehicleMake          *string    `json:"vehicleMake,omitempty"`
	VehicleModel         *string    `json:"vehicleModel,omitempty"`
	DriverFirstName      string     `json:"driverFirstName"`
	DriverLastName       string     `json:"driverLastName"`
	DriverLicense        *string    `json:"driverLicense,omitempty"`
	DriverPhone          *string    `json:"driverPhone,omitempty"`
	DriverAddress        *string    `json:"driverAddress,omitempty"`
	OffenceIds           []uuid.UUID `json:"offenceIds"`
	TotalFine            float64    `json:"totalFine"`
	Location             string     `json:"location"`
	LocationLatitude     *float64   `json:"locationLatitude,omitempty"`
	LocationLongitude    *float64   `json:"locationLongitude,omitempty"`
	Notes                *string    `json:"notes,omitempty"`
	IssuedAt             *time.Time `json:"issuedAt,omitempty"`
}

// SyncTicketUpdateData is the parsed ticket data from an update action.
type SyncTicketUpdateData struct {
	ID     uuid.UUID `json:"id"` // server-assigned ticket ID
	Status *string   `json:"status,omitempty"`
	Notes  *string   `json:"notes,omitempty"`
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

// SyncResponse is the response from a batch sync operation.
type SyncResponse struct {
	SyncTimestamp time.Time       `json:"syncTimestamp"`
	Results       SyncResults     `json:"results"`
	ServerUpdates ServerUpdates   `json:"serverUpdates"`
}

// SyncResults holds the results for each submitted item.
type SyncResults struct {
	Tickets []SyncTicketResult `json:"tickets"`
	Photos  []SyncPhotoResult  `json:"photos"`
}

// SyncTicketResult is the outcome of syncing a single ticket.
type SyncTicketResult struct {
	LocalID  string  `json:"localId"`
	ServerID string  `json:"serverId"`
	Status   string  `json:"status"` // success, conflict, error
	Error    *string `json:"error,omitempty"`
}

// SyncPhotoResult is the outcome of syncing a single photo.
type SyncPhotoResult struct {
	LocalID  string  `json:"localId"`
	ServerID string  `json:"serverId"`
	Status   string  `json:"status"` // success, error
	URL      string  `json:"url,omitempty"`
}

// ServerUpdates holds server-side changes since the last sync.
type ServerUpdates struct {
	Tickets []ServerTicketUpdate `json:"tickets"`
}

// ServerTicketUpdate is a server-side change to push to the device.
type ServerTicketUpdate struct {
	ID     uuid.UUID              `json:"id"`
	Action string                 `json:"action"` // update, delete
	Data   map[string]any `json:"data,omitempty"`
}

// ---------------------------------------------------------------------------
// Sync status
// ---------------------------------------------------------------------------

// SyncStatus is the current sync status for a device.
type SyncStatus struct {
	LastSyncTimestamp     *time.Time `json:"lastSyncTimestamp"`
	PendingServerUpdates int        `json:"pendingServerUpdates"`
	DeviceID             string     `json:"deviceId"`
}

// ---------------------------------------------------------------------------
// Device sync record (DB model)
// ---------------------------------------------------------------------------

// DeviceSync tracks per-device sync state.
type DeviceSync struct {
	ID                uuid.UUID  `json:"id"`
	UserID            uuid.UUID  `json:"userId"`
	DeviceID          string     `json:"deviceId"`
	LastSyncTimestamp  time.Time  `json:"lastSyncTimestamp"`
	ItemsSynced       int        `json:"itemsSynced"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}
