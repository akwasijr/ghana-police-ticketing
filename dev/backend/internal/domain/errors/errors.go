package errors

import (
	"fmt"
	"net/http"
)

// Error codes matching API specification
const (
	CodeValidation      = "VALIDATION_ERROR"
	CodeInvalidCreds    = "INVALID_CREDENTIALS"
	CodeUnauthorized    = "UNAUTHORIZED"
	CodeTokenExpired    = "TOKEN_EXPIRED"
	CodeForbidden       = "FORBIDDEN"
	CodeNotFound        = "NOT_FOUND"
	CodeConflict        = "CONFLICT"
	CodeRateLimited     = "RATE_LIMITED"
	CodeInternal        = "INTERNAL_ERROR"
	CodeServiceDown     = "SERVICE_UNAVAILABLE"
)

// AppError is the standard application error type.
type AppError struct {
	Code       string            `json:"code"`
	Message    string            `json:"message"`
	Details    map[string][]string `json:"details,omitempty"`
	HTTPStatus int               `json:"-"`
	Err        error             `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// Constructor helpers

func NewValidationError(message string, details map[string][]string) *AppError {
	return &AppError{
		Code:       CodeValidation,
		Message:    message,
		Details:    details,
		HTTPStatus: http.StatusBadRequest,
	}
}

func NewInvalidCredentials(message string) *AppError {
	return &AppError{
		Code:       CodeInvalidCreds,
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

func NewUnauthorized(message string) *AppError {
	return &AppError{
		Code:       CodeUnauthorized,
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

func NewTokenExpired() *AppError {
	return &AppError{
		Code:       CodeTokenExpired,
		Message:    "Access token has expired",
		HTTPStatus: http.StatusUnauthorized,
	}
}

func NewForbidden(message string) *AppError {
	return &AppError{
		Code:       CodeForbidden,
		Message:    message,
		HTTPStatus: http.StatusForbidden,
	}
}

func NewNotFound(entity string) *AppError {
	return &AppError{
		Code:       CodeNotFound,
		Message:    fmt.Sprintf("%s not found", entity),
		HTTPStatus: http.StatusNotFound,
	}
}

func NewConflict(message string) *AppError {
	return &AppError{
		Code:       CodeConflict,
		Message:    message,
		HTTPStatus: http.StatusConflict,
	}
}

func NewRateLimited() *AppError {
	return &AppError{
		Code:       CodeRateLimited,
		Message:    "Too many requests",
		HTTPStatus: http.StatusTooManyRequests,
	}
}

func NewInternal(err error) *AppError {
	return &AppError{
		Code:       CodeInternal,
		Message:    "An unexpected error occurred",
		HTTPStatus: http.StatusInternalServerError,
		Err:        err,
	}
}

func NewServiceUnavailable(service string) *AppError {
	return &AppError{
		Code:       CodeServiceDown,
		Message:    fmt.Sprintf("%s is currently unavailable", service),
		HTTPStatus: http.StatusServiceUnavailable,
	}
}
