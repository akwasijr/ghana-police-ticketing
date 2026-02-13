package models

import "github.com/google/uuid"

// ---------------------------------------------------------------------------
// Analytics filter (shared across all analytics endpoints)
// ---------------------------------------------------------------------------

// AnalyticsFilter holds common query parameters for analytics.
type AnalyticsFilter struct {
	StartDate string     // required: YYYY-MM-DD
	EndDate   string     // required: YYYY-MM-DD
	RegionID  *uuid.UUID
	StationID *uuid.UUID
	OfficerID *uuid.UUID
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

// AnalyticsSummary is the KPI card data for the dashboard.
type AnalyticsSummary struct {
	TotalTickets     int     `json:"totalTickets"`
	TotalFines       float64 `json:"totalFines"`
	TotalCollected   float64 `json:"totalCollected"`
	CollectionRate   float64 `json:"collectionRate"`
	AveragePerOfficer float64 `json:"averagePerOfficer"`
	ActiveOfficers   int     `json:"activeOfficers"`
	ActiveStations   int     `json:"activeStations"`
}

// ---------------------------------------------------------------------------
// Trends
// ---------------------------------------------------------------------------

// TrendPoint is a single data point in a time series.
type TrendPoint struct {
	Period    string  `json:"period"`
	Tickets   int     `json:"tickets"`
	Fines     float64 `json:"fines"`
	Collected float64 `json:"collected"`
}

// ---------------------------------------------------------------------------
// Top offences
// ---------------------------------------------------------------------------

// TopOffence is a ranked offence by frequency.
type TopOffence struct {
	OffenceID       uuid.UUID `json:"offenceId"`
	Code            string    `json:"code"`
	Name            string    `json:"name"`
	Category        string    `json:"category"`
	Count           int       `json:"count"`
	TotalAmount     float64   `json:"totalAmount"`
	PercentageOfTotal float64 `json:"percentageOfTotal"`
}

// ---------------------------------------------------------------------------
// Regional breakdown
// ---------------------------------------------------------------------------

// RegionAnalytics is the per-region aggregation.
type RegionAnalytics struct {
	RegionID       uuid.UUID `json:"regionId"`
	RegionName     string    `json:"regionName"`
	RegionCode     string    `json:"regionCode"`
	Tickets        int       `json:"tickets"`
	TotalFines     float64   `json:"totalFines"`
	Collected      float64   `json:"collected"`
	CollectionRate float64   `json:"collectionRate"`
	ActiveOfficers int       `json:"activeOfficers"`
	ActiveStations int       `json:"activeStations"`
}

// ---------------------------------------------------------------------------
// Revenue report
// ---------------------------------------------------------------------------

// RevenueReport is the detailed revenue analytics.
type RevenueReport struct {
	TotalRevenue    float64          `json:"totalRevenue"`
	AveragePerTicket float64         `json:"averagePerTicket"`
	DailyAverage    float64          `json:"dailyAverage"`
	ByPeriod        []RevenueByPeriod  `json:"byPeriod"`
	ByMethod        []RevenueByMethod  `json:"byMethod"`
	ByStation       []RevenueByStation `json:"byStation"`
}

// RevenueByPeriod is revenue broken down by time period.
type RevenueByPeriod struct {
	Period string  `json:"period"`
	Amount float64 `json:"amount"`
}

// RevenueByMethod is revenue broken down by payment method.
type RevenueByMethod struct {
	Method     string  `json:"method"`
	Count      int     `json:"count"`
	Amount     float64 `json:"amount"`
	Percentage float64 `json:"percentage"`
}

// RevenueByStation is revenue broken down by station.
type RevenueByStation struct {
	StationID   uuid.UUID `json:"stationId"`
	StationName string    `json:"stationName"`
	Amount      float64   `json:"amount"`
	TicketCount int       `json:"ticketCount"`
}

// ---------------------------------------------------------------------------
// Officer performance
// ---------------------------------------------------------------------------

// OfficerPerformance is an officer's ranked performance.
type OfficerPerformance struct {
	OfficerID      uuid.UUID `json:"officerId"`
	OfficerName    string    `json:"officerName"`
	BadgeNumber    string    `json:"badgeNumber"`
	StationName    string    `json:"stationName"`
	TicketCount    int       `json:"ticketCount"`
	TotalFines     float64   `json:"totalFines"`
	CollectionRate float64   `json:"collectionRate"`
	Rank           int       `json:"rank"`
}
