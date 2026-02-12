package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                  uuid.UUID  `json:"id"`
	Email               string     `json:"email"`
	PasswordHash        string     `json:"-"`
	FirstName           string     `json:"firstName"`
	LastName            string     `json:"lastName"`
	Phone               *string    `json:"phone,omitempty"`
	Role                string     `json:"role"`
	IsActive            bool       `json:"isActive"`
	ProfilePhotoURL     *string    `json:"profilePhoto,omitempty"`
	LastLoginAt         *time.Time `json:"lastLogin,omitempty"`
	PasswordChangedAt   *time.Time `json:"-"`
	FailedLoginAttempts int        `json:"-"`
	LockedUntil         *time.Time `json:"-"`
	CreatedAt           time.Time  `json:"createdAt"`
	UpdatedAt           time.Time  `json:"-"`

	// Joined: officer details (if role == officer/supervisor)
	Officer *OfficerInfo `json:"officer,omitempty"`
}

// FullName returns first + last name.
func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}

// UserResponse is the API response shape for a user.
type UserResponse struct {
	ID           uuid.UUID    `json:"id"`
	Email        string       `json:"email"`
	FirstName    string       `json:"firstName"`
	LastName     string       `json:"lastName"`
	FullName     string       `json:"fullName"`
	Phone        *string      `json:"phone,omitempty"`
	Role         string       `json:"role"`
	IsActive     bool         `json:"isActive"`
	CreatedAt    time.Time    `json:"createdAt"`
	LastLogin    *time.Time   `json:"lastLogin,omitempty"`
	ProfilePhoto *string      `json:"profilePhoto,omitempty"`
	Officer      *OfficerInfo `json:"officer,omitempty"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:           u.ID,
		Email:        u.Email,
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		FullName:     u.FullName(),
		Phone:        u.Phone,
		Role:         u.Role,
		IsActive:     u.IsActive,
		CreatedAt:    u.CreatedAt,
		LastLogin:    u.LastLoginAt,
		ProfilePhoto: u.ProfilePhotoURL,
		Officer:      u.Officer,
	}
}

type OfficerInfo struct {
	ID              uuid.UUID    `json:"id"`
	BadgeNumber     string       `json:"badgeNumber"`
	Rank            *string      `json:"rank,omitempty"`
	RankDisplay     string       `json:"rankDisplay,omitempty"`
	Station         *StationInfo `json:"station,omitempty"`
	StationID       uuid.UUID    `json:"stationId"`
	RegionID        uuid.UUID    `json:"regionId"`
	AssignedDeviceID *string     `json:"assignedDeviceId,omitempty"`
}

type StationInfo struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
	Code string    `json:"code"`
}

type Officer struct {
	ID               uuid.UUID `json:"id"`
	UserID           uuid.UUID `json:"userId"`
	BadgeNumber      string    `json:"badgeNumber"`
	Rank             *string   `json:"rank,omitempty"`
	StationID        uuid.UUID `json:"stationId"`
	RegionID         uuid.UUID `json:"regionId"`
	AssignedDeviceID *string   `json:"assignedDeviceId,omitempty"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type RefreshToken struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"userId"`
	TokenHash  string     `json:"-"`
	DeviceID   *string    `json:"deviceId,omitempty"`
	DeviceInfo any        `json:"deviceInfo,omitempty"`
	ExpiresAt  time.Time  `json:"expiresAt"`
	RevokedAt  *time.Time `json:"revokedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
}

// OfficerResponse is the API response for officer management endpoints.
type OfficerResponse struct {
	ID               uuid.UUID    `json:"id"`
	UserID           uuid.UUID    `json:"userId"`
	BadgeNumber      string       `json:"badgeNumber"`
	Rank             *string      `json:"rank,omitempty"`
	RankDisplay      string       `json:"rankDisplay"`
	FirstName        string       `json:"firstName"`
	LastName         string       `json:"lastName"`
	FullName         string       `json:"fullName"`
	Email            string       `json:"email"`
	Phone            *string      `json:"phone,omitempty"`
	Role             string       `json:"role"`
	IsActive         bool         `json:"isActive"`
	Station          *StationInfo `json:"station,omitempty"`
	StationID        uuid.UUID    `json:"stationId"`
	RegionID         uuid.UUID    `json:"regionId"`
	AssignedDeviceID *string      `json:"assignedDeviceId,omitempty"`
	LastLogin        *time.Time   `json:"lastLogin,omitempty"`
	CreatedAt        time.Time    `json:"createdAt"`
}

// OfficerFilter holds query parameters for officer listing.
type OfficerFilter struct {
	StationID *uuid.UUID
	RegionID  *uuid.UUID
	Rank      *string
	Role      *string
	IsActive  *bool
}

// OfficerStats holds officer performance statistics.
type OfficerStats struct {
	TotalTickets      int              `json:"totalTickets"`
	TicketsThisMonth  int              `json:"ticketsThisMonth"`
	TicketsThisWeek   int              `json:"ticketsThisWeek"`
	TicketsToday      int              `json:"ticketsToday"`
	TotalFinesIssued  float64          `json:"totalFinesIssued"`
	TotalCollected    float64          `json:"totalCollected"`
	CollectionRate    float64          `json:"collectionRate"`
	AverageFineAmount float64          `json:"averageFineAmount"`
	TopOffences       []TopOffenceItem `json:"topOffences"`
}

type TopOffenceItem struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// RankDisplayMap maps rank codes to display names.
var RankDisplayMap = map[string]string{
	"constable":               "Constable",
	"lance_corporal":          "Lance Corporal",
	"corporal":                "Corporal",
	"sergeant":                "Sergeant",
	"staff_sergeant":          "Staff Sergeant",
	"warrant_officer_ii":      "Warrant Officer II",
	"warrant_officer_i":       "Warrant Officer I",
	"inspector":               "Inspector",
	"chief_inspector":         "Chief Inspector",
	"assistant_superintendent": "Assistant Superintendent",
	"deputy_superintendent":   "Deputy Superintendent",
	"superintendent":          "Superintendent",
	"chief_superintendent":    "Chief Superintendent",
	"assistant_commissioner":  "Assistant Commissioner",
	"deputy_commissioner":     "Deputy Commissioner",
	"commissioner":            "Commissioner",
}
