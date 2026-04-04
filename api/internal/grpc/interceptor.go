package grpchandler

import (
	"context"
	"time"

	"github.com/berberim/api/internal/identity"
	"github.com/berberim/api/internal/requestmeta"
	"github.com/berberim/api/internal/service"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// metaKeyRequestID is the gRPC metadata key for request ID.
const metaKeyRequestID = "x-request-id"

// InjectRequestID is a unary server interceptor that reads x-request-id from incoming
// metadata and injects it into context so handlers and the service layer can use
// service.RequestIDFromContext(ctx).
func InjectRequestID() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, _ *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		md, ok := metadata.FromIncomingContext(ctx)
		if ok {
			if ids := md.Get(metaKeyRequestID); len(ids) > 0 && ids[0] != "" {
				ctx = service.WithRequestID(ctx, ids[0])
			}
		}
		return handler(ctx, req)
	}
}

// InjectClientMeta parses request network/device metadata from incoming gRPC
// metadata and stores it in context for downstream service methods.
func InjectClientMeta() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, _ *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		meta := requestmeta.FromGRPCMeta(ctx)
		ctx = requestmeta.WithContext(ctx, meta)
		return handler(ctx, req)
	}
}

// InjectIdentity is a unary server interceptor that extracts caller identity
// from incoming gRPC metadata and stores it as identity.RequestContext in the
// context. Must be chained after InjectRequestID.
//
// Public endpoints (SendCustomerOTP, VerifyCustomerOTP, LoginTenantUser,
// LoginPlatformUser, RefreshToken, Logout) do not have identity in metadata —
// the interceptor skips injection silently for those; the handlers must not
// call identity.MustFromContext for unauthenticated RPCs.
func InjectIdentity() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, _ *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		rc, err := identity.FromGRPCMeta(ctx)
		if err == nil {
			ctx = identity.WithRequestContext(ctx, rc)
		}
		// Do not reject — unauthenticated RPCs are allowed through.
		// Individual handlers enforce auth requirements via identity.MustFromContext.
		return handler(ctx, req)
	}
}

// RequestIDFromContext returns the request ID from context (injected by InjectRequestID).
// Falls back to gRPC incoming metadata if not set (e.g. in tests without the interceptor).
func RequestIDFromContext(ctx context.Context) string {
	if id := service.RequestIDFromContext(ctx); id != "" {
		return id
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return ""
	}
	ids := md.Get(metaKeyRequestID)
	if len(ids) == 0 {
		return ""
	}
	return ids[0]
}

// LoggingUnaryServerInterceptor returns a unary interceptor that logs every RPC
// (method, duration, status). Intended to be chained last.
func LoggingUnaryServerInterceptor(log *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()
		resp, err := handler(ctx, req)
		duration := time.Since(start)
		code := status.Code(err)
		fields := []zap.Field{
			zap.String("method", info.FullMethod),
			zap.Duration("duration", duration),
			zap.String("grpc_code", code.String()),
		}
		if requestID := RequestIDFromContext(ctx); requestID != "" {
			fields = append(fields, zap.String("request_id", requestID))
		}
		if rc, ok := identity.FromContext(ctx); ok {
			fields = append(fields, zap.String("user_id", rc.UserID.String()))
			if rc.TenantID.String() != "00000000-0000-0000-0000-000000000000" {
				fields = append(fields, zap.String("tenant_id", rc.TenantID.String()))
			}
		}
		if err != nil {
			fields = append(fields, zap.Error(err))
		}
		if code == codes.OK {
			log.Info("rpc completed", fields...)
		} else {
			log.Warn("rpc failed", fields...)
		}
		return resp, err
	}
}
