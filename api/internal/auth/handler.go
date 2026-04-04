package auth

import (
	"context"
	"net/http"
	"time"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"github.com/labstack/echo/v5"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type JWKSCache interface {
	Get(ctx context.Context) ([]byte, error)
}

type JWKSRateLimiter interface {
	Allow(key string) bool
}

// Handler is a thin gRPC bridge — parse → call service → marshal.
type Handler struct {
	log     *zap.Logger
	service *Service
}

func NewHandler(log *zap.Logger, service *Service) *Handler {
	return &Handler{log: log, service: service}
}

// JWKS returns a handler for GET /.well-known/jwks.json.
func (h *Handler) JWKS(cache JWKSCache, limit JWKSRateLimiter) echo.HandlerFunc {
	return func(c *echo.Context) error {
		if !limit.Allow(c.RealIP()) {
			return c.JSON(http.StatusTooManyRequests, map[string]string{"error": "too_many_requests"})
		}
		data, err := cache.Get(c.Request().Context())
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "key_discovery_failed"})
		}
		return c.Blob(http.StatusOK, "application/json", data)
	}
}

// ── Auth RPC delegations ──────────────────────────────────────────────────────

func (h *Handler) SendCustomerOTP(ctx context.Context, req *berberimv1.SendCustomerOTPRequest) (*berberimv1.SendCustomerOTPResponse, error) {
	tenantID, err := uuid.Parse(req.TenantId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}
	expiresIn, err := h.service.SendCustomerOTP(ctx, tenantID, req.PhoneNumber)
	if err != nil {
		return nil, err
	}
	return &berberimv1.SendCustomerOTPResponse{ExpiresInSeconds: expiresIn}, nil
}

func (h *Handler) VerifyCustomerOTP(ctx context.Context, req *berberimv1.VerifyCustomerOTPRequest) (*berberimv1.VerifyCustomerOTPResponse, error) {
	tenantID, err := uuid.Parse(req.TenantId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}
	result, err := h.service.VerifyCustomerOTP(ctx, tenantID, req.PhoneNumber, req.Code)
	if err != nil {
		return nil, err
	}
	return &berberimv1.VerifyCustomerOTPResponse{
		AccessToken:   result.AccessToken,
		RefreshToken:  result.RefreshToken,
		CustomerId:    result.CustomerID.String(),
		IsNewCustomer: result.IsNew,
	}, nil
}

func (h *Handler) VerifyCustomerSocialLogin(ctx context.Context, req *berberimv1.VerifyCustomerSocialLoginRequest) (*berberimv1.VerifyCustomerSocialLoginResponse, error) {
	tenantID, err := uuid.Parse(req.TenantId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}
	result, err := h.service.VerifyCustomerSocialLogin(ctx, tenantID, req.Provider, req.IdToken)
	if err != nil {
		return nil, err
	}
	return &berberimv1.VerifyCustomerSocialLoginResponse{
		AccessToken:   result.AccessToken,
		RefreshToken:  result.RefreshToken,
		CustomerId:    result.CustomerID.String(),
		IsNewCustomer: result.IsNew,
	}, nil
}

func (h *Handler) LoginTenantUser(ctx context.Context, req *berberimv1.LoginTenantUserRequest) (*berberimv1.LoginTenantUserResponse, error) {
	tenantID, err := uuid.Parse(req.TenantId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}
	result, err := h.service.LoginTenantUser(ctx, tenantID, req.Email, req.Password)
	if err != nil {
		return nil, err
	}
	return &berberimv1.LoginTenantUserResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		UserId:       result.UserID.String(),
		Role:         result.Role,
	}, nil
}

func (h *Handler) LoginPlatformUser(ctx context.Context, req *berberimv1.LoginPlatformUserRequest) (*berberimv1.LoginPlatformUserResponse, error) {
	result, err := h.service.LoginPlatformUser(ctx, req.Email, req.Password)
	if err != nil {
		return nil, err
	}
	return &berberimv1.LoginPlatformUserResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		UserId:       result.UserID.String(),
	}, nil
}

func (h *Handler) RefreshToken(ctx context.Context, req *berberimv1.RefreshTokenRequest) (*berberimv1.RefreshTokenResponse, error) {
	accessToken, err := h.service.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, err
	}
	return &berberimv1.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: req.RefreshToken,
	}, nil
}

func (h *Handler) Logout(ctx context.Context, req *berberimv1.LogoutRequest) (*berberimv1.LogoutResponse, error) {
	h.service.Logout(ctx, req.RefreshToken)
	return &berberimv1.LogoutResponse{}, nil
}

func (h *Handler) LogoutAll(ctx context.Context, _ *berberimv1.LogoutAllRequest) (*berberimv1.LogoutAllResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	count, err := h.service.LogoutAll(ctx, rc.TokenType, rc.UserID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.LogoutAllResponse{RevokedCount: count}, nil
}

func (h *Handler) ListSessions(ctx context.Context, _ *berberimv1.ListSessionsRequest) (*berberimv1.ListSessionsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	sessions, err := h.service.ListSessions(ctx, rc.TokenType, rc.UserID)
	if err != nil {
		return nil, err
	}
	currentSessionID := rc.SessionID.String()
	out := make([]*berberimv1.Session, 0, len(sessions))
	for _, ss := range sessions {
		out = append(out, &berberimv1.Session{
			Id:             ss.ID.String(),
			UserAgent:      strOrEmpty(ss.UserAgent),
			IpAddress:      strOrEmpty(ss.IPAddress),
			LastUsedAt:     ss.LastUsedAt.Format(time.RFC3339),
			ExpiresAt:      ss.ExpiresAt.Format(time.RFC3339),
			CreatedAt:      ss.CreatedAt.Format(time.RFC3339),
			IsCurrent:      ss.ID.String() == currentSessionID,
			DevicePlatform: strOrEmpty(ss.DevicePlatform),
			DeviceModel:    strOrEmpty(ss.DeviceModel),
			AppVersion:     strOrEmpty(ss.DeviceAppVersion),
			OsVersion:      strOrEmpty(ss.DeviceOSVersion),
		})
	}
	return &berberimv1.ListSessionsResponse{Sessions: out}, nil
}

func (h *Handler) RevokeSession(ctx context.Context, req *berberimv1.RevokeSessionRequest) (*berberimv1.RevokeSessionResponse, error) {
	sessionID, err := uuid.Parse(req.SessionId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid session_id: %v", err)
	}
	if err := h.service.RevokeSession(ctx, sessionID); err != nil {
		return nil, err
	}
	return &berberimv1.RevokeSessionResponse{}, nil
}
