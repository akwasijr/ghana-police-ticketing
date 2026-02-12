package models

import (
	"time"

	"github.com/google/uuid"
)

type Offence struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	LegalBasis  *string   `json:"legalBasis,omitempty"`
	Category    string    `json:"category"`
	DefaultFine float64   `json:"defaultFine"`
	MinFine     float64   `json:"minFine"`
	MaxFine     float64   `json:"maxFine"`
	Points      int       `json:"points"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Valid offence categories (matches DB CHECK constraint)
var OffenceCategories = []string{
	"speed", "traffic_signal", "licensing", "documentation",
	"vehicle_condition", "dangerous_driving", "parking", "obstruction", "other",
}

// VehicleType represents a vehicle type in the system.
type VehicleType struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}
