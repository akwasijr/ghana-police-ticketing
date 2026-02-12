package models

import (
	"time"

	"github.com/google/uuid"
)

type Region struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Capital   *string   `json:"capital,omitempty"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Division struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	RegionID  uuid.UUID `json:"regionId"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Joined fields
	RegionName string `json:"regionName,omitempty"`
}

type District struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Code       string    `json:"code"`
	DivisionID uuid.UUID `json:"divisionId"`
	RegionID   uuid.UUID `json:"regionId"`
	IsActive   bool      `json:"isActive"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	// Joined fields
	DivisionName string `json:"divisionName,omitempty"`
	RegionName   string `json:"regionName,omitempty"`
}

type Station struct {
	ID         uuid.UUID `json:"id"`
	Name       string    `json:"name"`
	Code       string    `json:"code"`
	DistrictID uuid.UUID `json:"districtId"`
	DivisionID uuid.UUID `json:"divisionId"`
	RegionID   uuid.UUID `json:"regionId"`
	Address    *string   `json:"address,omitempty"`
	Phone      *string   `json:"phone,omitempty"`
	Email      *string   `json:"email,omitempty"`
	Latitude   *float64  `json:"latitude,omitempty"`
	Longitude  *float64  `json:"longitude,omitempty"`
	Type       string    `json:"type"`
	Status     string    `json:"status"`
	IsActive   bool      `json:"isActive"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	// Joined fields
	DistrictName string `json:"districtName,omitempty"`
	DivisionName string `json:"divisionName,omitempty"`
	RegionName   string `json:"regionName,omitempty"`
}
