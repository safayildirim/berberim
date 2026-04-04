// Package identity carries request-scoped caller identity extracted from gRPC
// incoming metadata. It is the single authoritative source for who is making a
// request inside the backend — never read user/tenant identity from the proto
// request body.
package identity

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type contextKey struct{}

// RequestContext holds caller identity extracted from gRPC incoming metadata.
// Populated by the InjectIdentity interceptor; all service methods should
// accept this as an explicit argument rather than reading from metadata directly.
type RequestContext struct {
	UserID    uuid.UUID
	TenantID  uuid.UUID // zero value for platform_user tokens
	TokenType string    // "customer" | "tenant_user" | "platform_user"
	Role      string    // "admin" | "staff" | "" (empty for customer/platform_user)
	SessionID uuid.UUID // jti claim — identifies the specific session
	RequestID string
}

// WithRequestContext returns a copy of ctx carrying rc.
func WithRequestContext(ctx context.Context, rc RequestContext) context.Context {
	return context.WithValue(ctx, contextKey{}, rc)
}

// FromContext retrieves the RequestContext stored by WithRequestContext.
// Returns (zero, false) if not present.
func FromContext(ctx context.Context) (RequestContext, bool) {
	rc, ok := ctx.Value(contextKey{}).(RequestContext)
	return rc, ok
}

// MustFromContext retrieves the RequestContext or panics. Only call in
// code paths guaranteed to have the InjectIdentity interceptor applied.
func MustFromContext(ctx context.Context) RequestContext {
	rc, ok := FromContext(ctx)
	if !ok {
		panic("identity.RequestContext missing — InjectIdentity interceptor not applied")
	}
	return rc
}

// FromGRPCMeta extracts identity fields from incoming gRPC metadata.
// Called by the InjectIdentity interceptor. Returns a gRPC status error on
// missing or malformed mandatory fields (x-user-id, x-actor-type).
func FromGRPCMeta(ctx context.Context) (RequestContext, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return RequestContext{}, status.Error(codes.Unauthenticated, "missing metadata")
	}

	userIDStr := first(md, "x-user-id")
	if userIDStr == "" {
		return RequestContext{}, status.Error(codes.Unauthenticated, "missing x-user-id")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return RequestContext{}, status.Error(codes.Unauthenticated, fmt.Sprintf("invalid x-user-id: %v", err))
	}

	tokenType := first(md, "x-actor-type")
	if tokenType == "" {
		return RequestContext{}, status.Error(codes.Unauthenticated, "missing x-actor-type")
	}

	var tenantID uuid.UUID
	if tid := first(md, "x-tenant-id"); tid != "" {
		tenantID, err = uuid.Parse(tid)
		if err != nil {
			return RequestContext{}, status.Error(codes.Unauthenticated, fmt.Sprintf("invalid x-tenant-id: %v", err))
		}
	}

	var sessionID uuid.UUID
	if sid := first(md, "x-session-id"); sid != "" {
		sessionID, _ = uuid.Parse(sid) // best-effort
	}

	return RequestContext{
		UserID:    userID,
		TenantID:  tenantID,
		TokenType: tokenType,
		Role:      first(md, "x-user-role"),
		SessionID: sessionID,
		RequestID: first(md, "x-request-id"),
	}, nil
}

// RequireTenant returns an error if the identity has no TenantID (zero UUID).
// Use in service methods that must be tenant-scoped.
func (rc RequestContext) RequireTenant() error {
	if rc.TenantID == uuid.Nil {
		return status.Error(codes.PermissionDenied, "token not scoped to a tenant")
	}
	return nil
}

// first returns the first value for key in md, or "".
func first(md metadata.MD, key string) string {
	vals := md.Get(key)
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}
