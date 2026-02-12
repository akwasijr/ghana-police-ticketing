package services

import (
	"context"
	"errors"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
	"github.com/ghana-police/ticketing-backend/internal/domain/models"
	"github.com/ghana-police/ticketing-backend/internal/ports/repositories"
	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

type offenceService struct {
	repo   repositories.OffenceRepository
	logger *zap.Logger
}

func NewOffenceService(repo repositories.OffenceRepository, logger *zap.Logger) portservices.OffenceService {
	return &offenceService{repo: repo, logger: logger}
}

func (s *offenceService) List(ctx context.Context, category *string, isActive *bool, search string) ([]models.Offence, error) {
	return s.repo.List(ctx, category, isActive, search)
}

func (s *offenceService) Get(ctx context.Context, id uuid.UUID) (*models.Offence, error) {
	offence, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Offence")
		}
		return nil, apperrors.NewInternal(err)
	}
	return offence, nil
}

func (s *offenceService) Create(ctx context.Context, req *portservices.CreateOffenceRequest) (*models.Offence, error) {
	if req.Code == "" || req.Name == "" || req.Category == "" {
		return nil, apperrors.NewValidationError("Code, name and category are required", nil)
	}

	// Validate fine ranges
	if err := validateFines(req.MinFine, req.MaxFine, req.DefaultFine); err != nil {
		return nil, err
	}

	exists, err := s.repo.CodeExists(ctx, req.Code, nil)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	if exists {
		return nil, apperrors.NewConflict("Offence code already exists")
	}

	points := 0
	if req.Points != nil {
		points = *req.Points
	}

	offence := &models.Offence{
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		LegalBasis:  req.LegalBasis,
		Category:    req.Category,
		DefaultFine: req.DefaultFine,
		MinFine:     req.MinFine,
		MaxFine:     req.MaxFine,
		Points:      points,
	}
	if err := s.repo.Create(ctx, offence); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return offence, nil
}

func (s *offenceService) Update(ctx context.Context, id uuid.UUID, req *portservices.UpdateOffenceRequest) (*models.Offence, error) {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Offence")
		}
		return nil, apperrors.NewInternal(err)
	}

	// Check code immutability if referenced by tickets
	if req.Code != nil && *req.Code != current.Code {
		referenced, err := s.repo.IsReferencedByTickets(ctx, id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if referenced {
			return nil, apperrors.NewConflict("Cannot change code of an offence that has been used in tickets")
		}

		exists, err := s.repo.CodeExists(ctx, *req.Code, &id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if exists {
			return nil, apperrors.NewConflict("Offence code already exists")
		}
		current.Code = *req.Code
	}

	if req.Name != nil {
		current.Name = *req.Name
	}
	if req.Description != nil {
		current.Description = req.Description
	}
	if req.LegalBasis != nil {
		current.LegalBasis = req.LegalBasis
	}
	if req.Category != nil {
		current.Category = *req.Category
	}
	if req.DefaultFine != nil {
		current.DefaultFine = *req.DefaultFine
	}
	if req.MinFine != nil {
		current.MinFine = *req.MinFine
	}
	if req.MaxFine != nil {
		current.MaxFine = *req.MaxFine
	}
	if req.Points != nil {
		current.Points = *req.Points
	}

	// Validate fine ranges after all updates applied
	if err := validateFines(current.MinFine, current.MaxFine, current.DefaultFine); err != nil {
		return nil, err
	}

	if err := s.repo.Update(ctx, current); err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return current, nil
}

func (s *offenceService) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return apperrors.NewNotFound("Offence")
		}
		return apperrors.NewInternal(err)
	}

	has, err := s.repo.HasActiveTickets(ctx, id)
	if err != nil {
		return apperrors.NewInternal(err)
	}
	if has {
		return apperrors.NewConflict("Cannot deactivate offence used in active tickets")
	}

	return s.repo.Deactivate(ctx, id)
}

func (s *offenceService) Toggle(ctx context.Context, id uuid.UUID) (*models.Offence, error) {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.NewNotFound("Offence")
		}
		return nil, apperrors.NewInternal(err)
	}

	newActive := !current.IsActive

	// If deactivating, check for active tickets
	if !newActive {
		has, err := s.repo.HasActiveTickets(ctx, id)
		if err != nil {
			return nil, apperrors.NewInternal(err)
		}
		if has {
			return nil, apperrors.NewConflict("Cannot deactivate offence used in active tickets")
		}
	}

	offence, err := s.repo.SetActive(ctx, id, newActive)
	if err != nil {
		return nil, apperrors.NewInternal(err)
	}
	return offence, nil
}

func validateFines(minFine, maxFine, defaultFine float64) *apperrors.AppError {
	if minFine < 0 {
		return apperrors.NewValidationError("Minimum fine cannot be negative", nil)
	}
	if maxFine < minFine {
		return apperrors.NewValidationError("Maximum fine must be >= minimum fine", nil)
	}
	if defaultFine < minFine || defaultFine > maxFine {
		return apperrors.NewValidationError("Default fine must be between minimum and maximum fine", nil)
	}
	return nil
}
