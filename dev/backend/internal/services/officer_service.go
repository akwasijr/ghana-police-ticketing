package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/middleware"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/ghana-police/ticketing-backend/pkg/hash"
	"github.com/ghana-police/ticketing-backend/pkg/pagination"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

type officerService struct {
	officerRepo   repositories.OfficerRepository
	hierarchyRepo repositories.HierarchyRepository
	userRepo      repositories.UserRepository
	logger        *zap.Logger
}

func NewOfficerService(
	officerRepo repositories.OfficerRepository,
	hierarchyRepo repositories.HierarchyRepository,
	userRepo repositories.UserRepository,
	logger *zap.Logger,
) portservices.OfficerService {
	return &officerService{
		officerRepo:   officerRepo,
		hierarchyRepo: hierarchyRepo,
		userRepo:      userRepo,
		logger:        logger,
	}
}

// applyJurisdictionFilter scopes the filter based on the caller's role.
func applyJurisdictionFilter(ctx context.Context, filter *models.OfficerFilter) {
	role := middleware.GetUserRole(ctx)
	switch role {
	case "officer", "supervisor":
		stationID := middleware.GetStationID(ctx)
		if stationID != nil {
			filter.StationID = stationID
		}
	case "admin", "accountant":
		regionID := middleware.GetRegionID(ctx)
		if regionID != nil && filter.RegionID == nil {
			filter.RegionID = regionID
		}
	// super_admin: no additional filter
	}
}

func (s *officerService) List(ctx context.Context, filter models.OfficerFilter, search string, p pagination.Params) ([]models.OfficerResponse, int, error) {
	applyJurisdictionFilter(ctx, &filter)
	return s.officerRepo.List(ctx, filter, search, p)
}

func (s *officerService) Get(ctx context.Context, officerID uuid.UUID) (*models.OfficerResponse, error) {
	officer, err := s.officerRepo.GetByID(ctx, officerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Officer")
		}
		return nil, apperrors.NewInternal(err)
	}
	return officer, nil
}

func (s *officerService) Create(ctx context.Context, req *portservices.CreateOfficerRequest) (*portservices.CreateOfficerResult, error) {
	if req.FirstName == "" || req.LastName == "" || req.BadgeNumber == "" || req.Rank == "" || req.Phone == "" {
		return nil, apperrors.NewValidationError("firstName, lastName, badgeNumber, rank, and phone are required", nil)
	}

	// Check badge uniqueness
	exists, err := s.officerRepo.BadgeNumberExists(ctx, req.BadgeNumber, nil)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Badge number already exists")
	}

	// Determine email
	email := fmt.Sprintf("officer_%s@gps.internal", strings.ToLower(req.BadgeNumber))
	if req.Email != nil && *req.Email != "" {
		email = *req.Email
		exists, err := s.officerRepo.EmailExists(ctx, email, nil)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("Email already exists")
		}
	}

	// Look up station to auto-derive regionID
	station, err := s.hierarchyRepo.GetStationByID(ctx, req.StationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewValidationError("Station not found", nil)
		}
		return nil, apperrors.NewInternal(err)
	}

	// Password
	var tempPassword *string
	password := ""
	if req.Password != nil && *req.Password != "" {
		if len(*req.Password) < 8 {
			return nil, apperrors.NewValidationError("Password must be at least 8 characters", nil)
		}
		password = *req.Password
	} else {
		tp := hash.GenerateTemporaryPassword()
		tempPassword = &tp
		password = tp
	}

	passwordHash, err := hash.HashPassword(password)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Default role
	role := "officer"
	if req.Role != nil && *req.Role != "" {
		role = *req.Role
	}

	user := &models.User{
		Email:        email,
		PasswordHash: passwordHash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        &req.Phone,
		Role:         role,
	}

	officer := &models.Officer{
		BadgeNumber: req.BadgeNumber,
		Rank:        &req.Rank,
		StationID:   req.StationID,
		RegionID:    station.RegionID,
	}

	if err := s.officerRepo.Create(ctx, user, officer); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	// Fetch the complete response
	resp, err := s.officerRepo.GetByID(ctx, officer.ID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return &portservices.CreateOfficerResult{
		Officer:           resp,
		TemporaryPassword: tempPassword,
	}, nil
}

func (s *officerService) Update(ctx context.Context, officerID uuid.UUID, req *portservices.UpdateOfficerRequest) (*models.OfficerResponse, error) {
	current, err := s.officerRepo.GetByID(ctx, officerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Officer")
		}
		return nil, apperrors.NewInternal(err)
	}

	// Build user update
	user := &models.User{
		ID:        current.UserID,
		FirstName: current.FirstName,
		LastName:  current.LastName,
		Email:     current.Email,
		Phone:     current.Phone,
		Role:      current.Role,
		IsActive:  current.IsActive,
	}

	officer := &models.Officer{
		ID:               current.ID,
		Rank:             current.Rank,
		StationID:        current.StationID,
		RegionID:         current.RegionID,
		AssignedDeviceID: current.AssignedDeviceID,
	}

	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.Email != nil {
		exists, err := s.officerRepo.EmailExists(ctx, *req.Email, &current.UserID)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("Email already exists")
		}
		user.Email = *req.Email
	}
	if req.Phone != nil {
		user.Phone = req.Phone
	}
	if req.Role != nil {
		user.Role = *req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if req.Rank != nil {
		officer.Rank = req.Rank
	}
	if req.AssignedDeviceID != nil {
		officer.AssignedDeviceID = req.AssignedDeviceID
	}
	if req.StationID != nil {
		// Auto-derive regionID from new station
		station, err := s.hierarchyRepo.GetStationByID(ctx, *req.StationID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, apperrors.NewValidationError("Station not found", nil)
			}
			return nil, apperrors.NewInternal(err)
		}
		officer.StationID = *req.StationID
		officer.RegionID = station.RegionID
	}

	if err := s.officerRepo.Update(ctx, user, officer); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return s.officerRepo.GetByID(ctx, officerID)
}

func (s *officerService) Delete(ctx context.Context, officerID uuid.UUID) error {
	_, err := s.officerRepo.GetByID(ctx, officerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperrors.NewNotFound("Officer")
		}
		return apperrors.NewInternal(err)
	}

	return s.officerRepo.Deactivate(ctx, officerID)
}

func (s *officerService) GetStats(ctx context.Context, officerID uuid.UUID) (*models.OfficerStats, error) {
	// Verify officer exists
	_, err := s.officerRepo.GetByID(ctx, officerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Officer")
		}
		return nil, apperrors.NewInternal(err)
	}

	stats, err := s.officerRepo.GetStats(ctx, officerID)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return stats, nil
}

func (s *officerService) ResetPassword(ctx context.Context, officerID uuid.UUID) (*portservices.ResetPasswordResult, error) {
	userID, err := s.officerRepo.GetUserIDByOfficerID(ctx, officerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Officer")
		}
		return nil, apperrors.NewInternal(err)
	}

	tempPassword := hash.GenerateTemporaryPassword()
	passwordHash, err := hash.HashPassword(tempPassword)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}

	if err := s.userRepo.UpdatePassword(ctx, userID, passwordHash); err != nil {
		return nil, apperrors.NewInternal(err)
	}

	return &portservices.ResetPasswordResult{
		TemporaryPassword: tempPassword,
		Message:           "Password has been reset. Please communicate the temporary password securely to the officer.",
	}, nil
}
