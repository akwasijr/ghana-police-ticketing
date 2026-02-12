package middleware

import (
	"net/http"
	"runtime/debug"

	"github.com/ghana-police/ticketing-backend/pkg/response"
	"go.uber.org/zap"
)

func Recovery(logger *zap.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					logger.Error("panic recovered",
						zap.Any("panic", rec),
						zap.String("stack", string(debug.Stack())),
						zap.String("method", r.Method),
						zap.String("path", r.URL.Path),
					)
					response.InternalError(w)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
