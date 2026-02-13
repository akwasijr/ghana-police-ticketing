package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	portservices "github.com/ghana-police/ticketing-backend/internal/ports/services"
	"github.com/go-chi/chi/v5"
)

// statusWriter wraps http.ResponseWriter to capture the status code.
type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	return w.ResponseWriter.Write(b)
}

// Audit middleware auto-captures POST/PUT/PATCH/DELETE operations.
func Audit(auditSvc portservices.AuditService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only audit state-changing methods
			if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
				next.ServeHTTP(w, r)
				return
			}

			// Wrap writer to capture status
			sw := &statusWriter{ResponseWriter: w}
			next.ServeHTTP(sw, r)

			// Build and log audit entry asynchronously
			go func() {
				entry := buildAuditEntry(r, sw.status)
				if entry != nil {
					auditSvc.Log(context.Background(), entry)
				}
			}()
		})
	}
}

func buildAuditEntry(r *http.Request, statusCode int) *portservices.AuditEntry {
	path := r.URL.Path

	action, entityType := resolveActionAndEntity(r.Method, path)
	if entityType == "" {
		return nil // skip paths we can't map
	}

	// Extract entity ID from chi route context
	entityID := ""
	if rctx := chi.RouteContext(r.Context()); rctx != nil {
		if id := rctx.URLParam("id"); id != "" {
			entityID = id
		}
	}

	// Build description
	success := statusCode >= 200 && statusCode < 400
	severity := "info"
	actionTitle := strings.ToUpper(action[:1]) + action[1:]
	desc := fmt.Sprintf("%s %s", actionTitle, entityType)
	if entityID != "" {
		desc = fmt.Sprintf("%s %s %s", actionTitle, entityType, entityID)
	}

	if action == "delete" || action == "change_status" {
		severity = "warning"
	}
	if !success {
		severity = "warning"
	}

	// Extract user context
	userID := GetUserID(r.Context())
	userRole := GetUserRole(r.Context())

	entry := &portservices.AuditEntry{
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		Description: desc,
		Severity:    severity,
		Success:     success,
		IPAddress:   r.RemoteAddr,
		UserAgent:   r.UserAgent(),
		UserName:    "",
		UserRole:    userRole,
	}

	if userID.String() != "00000000-0000-0000-0000-000000000000" {
		entry.UserID = &userID
	}

	if badge := r.Context().Value(BadgeNumberKey); badge != nil {
		if b, ok := badge.(string); ok {
			entry.UserBadge = b
		}
	}

	if stationID := GetStationID(r.Context()); stationID != nil {
		entry.StationID = stationID
	}
	if regionID := GetRegionID(r.Context()); regionID != nil {
		entry.RegionID = regionID
	}

	return entry
}

// resolveActionAndEntity maps HTTP method + URL path to action and entity type.
func resolveActionAndEntity(method, path string) (string, string) {
	// Normalize: remove /api/ prefix, trailing slash
	p := strings.TrimPrefix(path, "/api/")
	p = strings.TrimSuffix(p, "/")
	parts := strings.Split(p, "/")

	if len(parts) == 0 {
		return "", ""
	}

	// Map resource to entity type
	entityMap := map[string]string{
		"tickets":    "ticket",
		"payments":   "payment",
		"objections": "objection",
		"officers":   "officer",
		"regions":    "region",
		"divisions":  "division",
		"districts":  "district",
		"stations":   "station",
		"offences":   "offence",
		"auth":       "user",
	}

	resource := parts[0]
	entityType := entityMap[resource]
	if entityType == "" {
		return "", ""
	}

	// Determine action
	action := methodToAction(method)

	// Special sub-path actions
	if len(parts) >= 2 {
		subpath := parts[len(parts)-1]
		switch subpath {
		case "login":
			action = "login"
		case "logout":
			action = "logout"
		case "void":
			action = "change_status"
		case "review":
			action = "approve" // review is approve/reject
		case "verify":
			action = "update"
		case "photos":
			action = "create"
		case "toggle":
			action = "change_status"
		case "reset-password":
			action = "reset_password"
		case "change-password":
			action = "update"
		case "refresh", "forgot-password":
			return "", "" // skip non-auditable auth actions
		case "initiate", "cash":
			action = "create"
		}
	}

	return action, entityType
}

func methodToAction(method string) string {
	switch method {
	case http.MethodPost:
		return "create"
	case http.MethodPut:
		return "update"
	case http.MethodPatch:
		return "update"
	case http.MethodDelete:
		return "delete"
	default:
		return "unknown"
	}
}
