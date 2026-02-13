package models

import (
	"time"

	"github.com/google/uuid"
)

// AuditLog is the database model for an audit entry.
type AuditLog struct {
	ID              uuid.UUID   `json:"id"`
	Timestamp       time.Time   `json:"timestamp"`
	UserID          *uuid.UUID  `json:"userId,omitempty"`
	UserName        string      `json:"userName"`
	UserRole        string      `json:"userRole"`
	UserBadgeNumber *string     `json:"userBadgeNumber,omitempty"`
	Action          string      `json:"action"`
	EntityType      string      `json:"entityType"`
	EntityID        *string     `json:"entityId,omitempty"`
	EntityName      *string     `json:"entityName,omitempty"`
	Description     string      `json:"description"`
	OldValue        *string     `json:"oldValue,omitempty"`
	NewValue        *string     `json:"newValue,omitempty"`
	Metadata        *string     `json:"metadata,omitempty"`
	IPAddress       *string     `json:"ipAddress,omitempty"`
	UserAgent       *string     `json:"userAgent,omitempty"`
	SessionID       *string     `json:"sessionId,omitempty"`
	StationID       *uuid.UUID  `json:"stationId,omitempty"`
	StationName     *string     `json:"stationName,omitempty"`
	RegionID        *uuid.UUID  `json:"regionId,omitempty"`
	RegionName      *string     `json:"regionName,omitempty"`
	Severity        string      `json:"severity"`
	Success         bool        `json:"success"`
	ErrorMessage    *string     `json:"errorMessage,omitempty"`
	CreatedAt       time.Time   `json:"createdAt"`
}

// AuditFilter for list queries.
type AuditFilter struct {
	Action     *string
	EntityType *string
	UserID     *uuid.UUID
	Severity   *string
	DateFrom   *time.Time
	DateTo     *time.Time
	StationID  *uuid.UUID
	RegionID   *uuid.UUID
}

// AuditStats for the stats endpoint.
type AuditStats struct {
	TotalEntries   int                 `json:"totalEntries"`
	ByAction       map[string]int      `json:"byAction"`
	ByEntityType   map[string]int      `json:"byEntityType"`
	BySeverity     AuditSeverityCounts `json:"bySeverity"`
	ByUser         []UserActivityCount `json:"byUser"`
	RecentCritical []CriticalEntry     `json:"recentCritical"`
}

type AuditSeverityCounts struct {
	Info     int `json:"info"`
	Warning  int `json:"warning"`
	Critical int `json:"critical"`
}

type UserActivityCount struct {
	UserID   uuid.UUID `json:"userId"`
	UserName string    `json:"userName"`
	Count    int       `json:"count"`
}

type CriticalEntry struct {
	ID          uuid.UUID `json:"id"`
	Timestamp   time.Time `json:"timestamp"`
	Action      string    `json:"action"`
	EntityType  string    `json:"entityType"`
	Description string    `json:"description"`
	UserName    string    `json:"userName"`
	Severity    string    `json:"severity"`
}
