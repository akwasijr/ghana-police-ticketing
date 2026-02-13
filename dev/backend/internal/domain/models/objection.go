package models

import (
	"time"

	"github.com/google/uuid"
)

// Objection statuses
const (
	ObjectionStatusPending  = "pending"
	ObjectionStatusApproved = "approved"
	ObjectionStatusRejected = "rejected"
)

// Objection is the database model.
type Objection struct {
	ID             uuid.UUID  `json:"id"`
	TicketID       uuid.UUID  `json:"ticketId"`
	TicketNumber   string     `json:"ticketNumber"`
	VehicleReg     string     `json:"vehicleReg"`
	OffenceType    string     `json:"offenceType"`
	FineAmount     float64    `json:"fineAmount"`
	Reason         string     `json:"reason"`
	Details        *string    `json:"details,omitempty"`
	Evidence       *string    `json:"evidence,omitempty"`
	DriverName     string     `json:"driverName"`
	DriverPhone    string     `json:"driverPhone"`
	DriverEmail    *string    `json:"driverEmail,omitempty"`
	Status         string     `json:"status"`
	SubmittedAt    time.Time  `json:"submittedAt"`
	ReviewDeadline time.Time  `json:"reviewDeadline"`
	ReviewedAt     *time.Time `json:"reviewedAt,omitempty"`
	ReviewedByID   *uuid.UUID `json:"reviewedById,omitempty"`
	ReviewNotes    *string    `json:"reviewNotes,omitempty"`
	AdjustedFine   *float64   `json:"adjustedFine,omitempty"`
	StationID      *uuid.UUID `json:"stationId,omitempty"`
	RegionID       *uuid.UUID `json:"regionId,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// ObjectionResponse is the full API response with joined hierarchy/reviewer data.
type ObjectionResponse struct {
	ID             uuid.UUID              `json:"id"`
	TicketID       uuid.UUID              `json:"ticketId"`
	TicketNumber   string                 `json:"ticketNumber"`
	VehicleReg     string                 `json:"vehicleReg"`
	Reason         string                 `json:"reason"`
	Details        *string                `json:"details,omitempty"`
	Evidence       *string                `json:"evidence,omitempty"`
	Attachments    []ObjectionAttachment  `json:"attachments"`
	Status         string                 `json:"status"`
	SubmittedAt    time.Time              `json:"submittedAt"`
	ReviewDeadline time.Time              `json:"reviewDeadline"`
	ReviewedAt     *time.Time             `json:"reviewedAt,omitempty"`
	ReviewedBy     *string                `json:"reviewedBy,omitempty"`
	ReviewedByID   *uuid.UUID             `json:"reviewedById,omitempty"`
	ReviewNotes    *string                `json:"reviewNotes,omitempty"`
	AdjustedFine   *float64               `json:"adjustedFine,omitempty"`
	DriverName     string                 `json:"driverName"`
	DriverPhone    string                 `json:"driverPhone"`
	DriverEmail    *string                `json:"driverEmail,omitempty"`
	OffenceType    string                 `json:"offenceType"`
	FineAmount     float64                `json:"fineAmount"`
	StationID      *uuid.UUID             `json:"stationId,omitempty"`
	StationName    *string                `json:"stationName,omitempty"`
	DistrictID     *uuid.UUID             `json:"districtId,omitempty"`
	DistrictName   *string                `json:"districtName,omitempty"`
	DivisionID     *uuid.UUID             `json:"divisionId,omitempty"`
	DivisionName   *string                `json:"divisionName,omitempty"`
	RegionID       *uuid.UUID             `json:"regionId,omitempty"`
	RegionName     *string                `json:"regionName,omitempty"`
	CreatedAt      time.Time              `json:"createdAt"`
	UpdatedAt      time.Time              `json:"updatedAt"`
}

// ObjectionAttachment represents a supporting document.
type ObjectionAttachment struct {
	ID         uuid.UUID `json:"id"`
	Type       string    `json:"type"`
	URL        string    `json:"url"`
	Name       string    `json:"name"`
	UploadedAt time.Time `json:"uploadedAt"`
}

// ObjectionFilter for list queries.
type ObjectionFilter struct {
	Status    *string
	DateFrom  *time.Time
	DateTo    *time.Time
	StationID *uuid.UUID
	RegionID  *uuid.UUID
	MinAmount *float64
	MaxAmount *float64
}

// ObjectionStats for the stats endpoint.
type ObjectionStats struct {
	Total                  int     `json:"total"`
	Pending                int     `json:"pending"`
	Approved               int     `json:"approved"`
	Rejected               int     `json:"rejected"`
	ApprovalRate           float64 `json:"approvalRate"`
	AvgResolutionTimeHours float64 `json:"avgResolutionTimeHours"`
}
