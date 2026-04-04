package service

import "context"

type requestIDKey struct{}

// WithRequestID returns a copy of ctx with the request ID stored.
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, requestID)
}

// RequestIDFromContext returns the request ID from ctx, or "" if not set.
func RequestIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey{}).(string)
	return id
}
