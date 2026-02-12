package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims represents the JWT access token claims.
type Claims struct {
	UserID      uuid.UUID `json:"sub"`
	Role        string    `json:"role"`
	OfficerID   *uuid.UUID `json:"officer_id,omitempty"`
	StationID   *uuid.UUID `json:"station_id,omitempty"`
	RegionID    *uuid.UUID `json:"region_id,omitempty"`
	BadgeNumber *string    `json:"badge_number,omitempty"`
	jwt.RegisteredClaims
}

// Manager handles JWT operations.
type Manager struct {
	secret        []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
}

func NewManager(secret string, accessExpiry, refreshExpiry time.Duration) *Manager {
	return &Manager{
		secret:        []byte(secret),
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
	}
}

// GenerateAccessToken creates a signed JWT access token.
func (m *Manager) GenerateAccessToken(claims *Claims) (string, error) {
	now := time.Now()
	claims.RegisteredClaims = jwt.RegisteredClaims{
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(m.accessExpiry)),
		ID:        uuid.New().String(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// ValidateToken parses and validates a JWT token string.
func (m *Manager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

// GenerateRefreshToken creates a random token string for refresh tokens.
func (m *Manager) GenerateRefreshToken() string {
	return uuid.New().String() + "-" + uuid.New().String()
}

// AccessExpiry returns the access token expiry duration.
func (m *Manager) AccessExpiry() time.Duration {
	return m.accessExpiry
}

// RefreshExpiry returns the refresh token expiry duration.
func (m *Manager) RefreshExpiry() time.Duration {
	return m.refreshExpiry
}
