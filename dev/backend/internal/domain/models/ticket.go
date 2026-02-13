package models

import (
	"time"

	"github.com/google/uuid"
)

// Ticket is the database model for a traffic ticket.
type Ticket struct {
	ID                 uuid.UUID  `json:"id"`
	TicketNumber       string     `json:"ticketNumber"`
	Status             string     `json:"status"`
	VehicleRegNumber   string     `json:"vehicleRegNumber"`
	VehicleType        *string    `json:"vehicleType,omitempty"`
	VehicleColor       *string    `json:"vehicleColor,omitempty"`
	VehicleMake        *string    `json:"vehicleMake,omitempty"`
	VehicleModel       *string    `json:"vehicleModel,omitempty"`
	DriverName         *string    `json:"driverName,omitempty"`
	DriverLicense      *string    `json:"driverLicense,omitempty"`
	DriverPhone        *string    `json:"driverPhone,omitempty"`
	DriverAddress      *string    `json:"driverAddress,omitempty"`
	LocationDesc       *string    `json:"locationDescription,omitempty"`
	LocationLatitude   *float64   `json:"locationLatitude,omitempty"`
	LocationLongitude  *float64   `json:"locationLongitude,omitempty"`
	TotalFine          float64    `json:"totalFine"`
	PaymentReference   *string    `json:"paymentReference,omitempty"`
	PaymentDeadline    *time.Time `json:"paymentDeadline,omitempty"`
	PaidAt             *time.Time `json:"paidAt,omitempty"`
	PaidAmount         *float64   `json:"paidAmount,omitempty"`
	PaidMethod         *string    `json:"paidMethod,omitempty"`
	OfficerID          uuid.UUID  `json:"officerId"`
	StationID          uuid.UUID  `json:"stationId"`
	DistrictID         *uuid.UUID `json:"districtId,omitempty"`
	DivisionID         *uuid.UUID `json:"divisionId,omitempty"`
	RegionID           uuid.UUID  `json:"regionId"`
	Notes              *string    `json:"notes,omitempty"`
	SyncStatus         string     `json:"syncStatus"`
	SyncedAt           *time.Time `json:"syncedAt,omitempty"`
	ClientCreatedID    *uuid.UUID `json:"clientCreatedId,omitempty"`
	Printed            bool       `json:"printed"`
	PrintedAt          *time.Time `json:"printedAt,omitempty"`
	VoidedBy           *uuid.UUID `json:"voidedBy,omitempty"`
	VoidedAt           *time.Time `json:"voidedAt,omitempty"`
	VoidReason         *string    `json:"voidReason,omitempty"`
	IssuedAt           time.Time  `json:"issuedAt"`
	DueDate            *time.Time `json:"dueDate,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

// TicketResponse is the full API response for a single ticket.
type TicketResponse struct {
	ID               uuid.UUID       `json:"id"`
	TicketNumber     string          `json:"ticketNumber"`
	Status           string          `json:"status"`
	IssuedAt         time.Time       `json:"issuedAt"`
	DueDate          *time.Time      `json:"dueDate,omitempty"`
	TotalFine        float64         `json:"totalFine"`
	Vehicle          VehicleInfo     `json:"vehicle"`
	Driver           DriverInfo      `json:"driver"`
	Offences         []TicketOffence `json:"offences"`
	Location         GeoLocation     `json:"location"`
	Photos           []TicketPhoto   `json:"photos"`
	Notes            *string         `json:"notes,omitempty"`
	NotesList        []TicketNote    `json:"notesList"`
	OfficerID        uuid.UUID       `json:"officerId"`
	OfficerName      string          `json:"officerName"`
	OfficerBadge     string          `json:"officerBadgeNumber"`
	StationID        uuid.UUID       `json:"stationId"`
	StationName      string          `json:"stationName,omitempty"`
	DistrictID       *uuid.UUID      `json:"districtId,omitempty"`
	DivisionID       *uuid.UUID      `json:"divisionId,omitempty"`
	RegionID         uuid.UUID       `json:"regionId"`
	PaymentReference *string         `json:"paymentReference,omitempty"`
	PaidAt           *time.Time      `json:"paidAt,omitempty"`
	PaidAmount       *float64        `json:"paidAmount,omitempty"`
	PaymentMethod    *string         `json:"paymentMethod,omitempty"`
	ObjectionFiled   bool            `json:"objectionFiled"`
	SyncStatus       string          `json:"syncStatus"`
	Printed          bool            `json:"printed"`
	PrintedAt        *time.Time      `json:"printedAt,omitempty"`
	VoidedBy         *uuid.UUID      `json:"voidedBy,omitempty"`
	VoidedAt         *time.Time      `json:"voidedAt,omitempty"`
	VoidReason       *string         `json:"voidReason,omitempty"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

// TicketListItem is the compact list representation.
type TicketListItem struct {
	ID           uuid.UUID  `json:"id"`
	TicketNumber string     `json:"ticketNumber"`
	VehicleReg   string     `json:"vehicleReg"`
	Status       string     `json:"status"`
	TotalFine    float64    `json:"totalFine"`
	IssuedAt     time.Time  `json:"issuedAt"`
	DueDate      *time.Time `json:"dueDate,omitempty"`
	OfficerName  string     `json:"officerName"`
	OfficerID    uuid.UUID  `json:"officerId"`
	StationID    uuid.UUID  `json:"stationId"`
	StationName  string     `json:"stationName"`
	RegionID     uuid.UUID  `json:"regionId"`
	OffenceCount int        `json:"offenceCount"`
	SyncStatus   string     `json:"syncStatus"`
}

// VehicleInfo for request/response.
type VehicleInfo struct {
	RegistrationNumber string  `json:"registrationNumber"`
	Make               *string `json:"make,omitempty"`
	Model              *string `json:"model,omitempty"`
	Color              *string `json:"color,omitempty"`
	Type               string  `json:"type"`
	OwnerName          *string `json:"ownerName,omitempty"`
	OwnerPhone         *string `json:"ownerPhone,omitempty"`
}

// DriverInfo for request/response.
type DriverInfo struct {
	FirstName     string  `json:"firstName"`
	LastName      string  `json:"lastName"`
	LicenseNumber *string `json:"licenseNumber,omitempty"`
	Phone         *string `json:"phone,omitempty"`
	Address       *string `json:"address,omitempty"`
	IDType        *string `json:"idType,omitempty"`
	IDNumber      *string `json:"idNumber,omitempty"`
}

// GeoLocation for request/response.
type GeoLocation struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Accuracy  *float64 `json:"accuracy,omitempty"`
	Address   *string  `json:"address,omitempty"`
	Landmark  *string  `json:"landmark,omitempty"`
}

// TicketOffence is an offence linked to a ticket.
type TicketOffence struct {
	ID         uuid.UUID `json:"id"`
	OffenceID  uuid.UUID `json:"offenceId"`
	Code       string    `json:"code"`
	Name       string    `json:"name"`
	Category   string    `json:"category"`
	Fine       float64   `json:"fine"`
	CustomFine *float64  `json:"customFine,omitempty"`
	Notes      *string   `json:"notes,omitempty"`
}

// TicketPhoto is a photo attached to a ticket.
type TicketPhoto struct {
	ID           uuid.UUID `json:"id"`
	Type         string    `json:"type"`
	URL          string    `json:"url"`
	ThumbnailURL string    `json:"thumbnailUrl"`
	Timestamp    time.Time `json:"timestamp"`
}

// TicketNote is a note added to a ticket.
type TicketNote struct {
	ID          uuid.UUID  `json:"id"`
	Content     string     `json:"content"`
	OfficerID   uuid.UUID  `json:"officerId"`
	OfficerName string     `json:"officerName"`
	Timestamp   time.Time  `json:"timestamp"`
	Edited      bool       `json:"edited"`
	EditedAt    *time.Time `json:"editedAt,omitempty"`
}

// TicketFilter holds query parameters for ticket listing.
type TicketFilter struct {
	Status    *string
	DateFrom  *time.Time
	DateTo    *time.Time
	OfficerID *uuid.UUID
	StationID *uuid.UUID
	RegionID  *uuid.UUID
	MinAmount *float64
	MaxAmount *float64
	Category  *string
}

// TicketStats holds aggregate ticket statistics.
type TicketStats struct {
	Total           int     `json:"total"`
	Paid            int     `json:"paid"`
	Unpaid          int     `json:"unpaid"`
	Overdue         int     `json:"overdue"`
	Objection       int     `json:"objection"`
	Cancelled       int     `json:"cancelled"`
	TotalAmount     float64 `json:"totalAmount"`
	CollectedAmount float64 `json:"collectedAmount"`
	PendingAmount   float64 `json:"pendingAmount"`
}
