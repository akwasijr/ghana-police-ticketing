package response

import (
	"encoding/json"
	"net/http"
	"time"

	apperrors "github.com/ghana-police/ticketing-backend/internal/domain/errors"
)

// SuccessResponse is the standard success envelope.
type SuccessResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Message   string      `json:"message,omitempty"`
	Timestamp string      `json:"timestamp"`
}

// ErrorBody is the error detail within an error response.
type ErrorBody struct {
	Code    string              `json:"code"`
	Message string              `json:"message"`
	Details map[string][]string `json:"details,omitempty"`
}

// ErrorResponse is the standard error envelope.
type ErrorResponse struct {
	Success   bool      `json:"success"`
	Error     ErrorBody `json:"error"`
	Timestamp string    `json:"timestamp"`
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// JSON writes a success response.
func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(SuccessResponse{
		Success:   true,
		Data:      data,
		Timestamp: now(),
	})
}

// JSONMessage writes a success response with a message.
func JSONMessage(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(SuccessResponse{
		Success:   true,
		Message:   message,
		Timestamp: now(),
	})
}

// Error writes an error response from an AppError.
func Error(w http.ResponseWriter, err *apperrors.AppError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.HTTPStatus)
	json.NewEncoder(w).Encode(ErrorResponse{
		Success: false,
		Error: ErrorBody{
			Code:    err.Code,
			Message: err.Message,
			Details: err.Details,
		},
		Timestamp: now(),
	})
}

// InternalError writes a generic 500 error.
func InternalError(w http.ResponseWriter) {
	Error(w, apperrors.NewInternal(nil))
}
