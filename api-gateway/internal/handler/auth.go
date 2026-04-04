package handler

import (
	"net/http"

	"github.com/berberim/api-gateway/internal/apierr"
	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/metadata"
)

// AuthHandler handles all /auth/* routes.
type AuthHandler struct {
	base
}

func NewAuthHandler(client berberimv1.BerberimAPIClient) *AuthHandler {
	return &AuthHandler{base{client: client}}
}

// POST /api/v1/public/auth/customers/login
func (h *AuthHandler) SendCustomerOTP(c *echo.Context) error {
	var req berberimv1.SendCustomerOTPRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SendCustomerOTP(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/auth/customers/login/verify
func (h *AuthHandler) VerifyCustomerOTP(c *echo.Context) error {
	var req berberimv1.VerifyCustomerOTPRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.VerifyCustomerOTP(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/auth/customers/login/social
func (h *AuthHandler) VerifySocialLogin(c *echo.Context) error {
	var req berberimv1.VerifyCustomerSocialLoginRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.VerifyCustomerSocialLogin(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/auth/customers/refresh
func (h *AuthHandler) RefreshToken(c *echo.Context) error {
	var req berberimv1.RefreshTokenRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.RefreshToken(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/auth/customers/logout
func (h *PublicHandler) Logout(c *echo.Context) error {
	var req berberimv1.LogoutRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.Logout(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /auth/tenant-users/login
func (h *AuthHandler) LoginTenantUser(c *echo.Context) error {
	var req berberimv1.LoginTenantUserRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.LoginTenantUser(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /auth/platform-users/login
func (h *AuthHandler) LoginPlatformUser(c *echo.Context) error {
	var req berberimv1.LoginPlatformUserRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.LoginPlatformUser(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /auth/logout
func (h *AuthHandler) Logout(c *echo.Context) error {
	var req berberimv1.LogoutRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.Logout(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /auth/logout-all  (JWT required)
// Identity comes exclusively from the validated JWT — never from the request body.
func (h *AuthHandler) LogoutAll(c *echo.Context) error {
	// Pass empty request; backend reads user_id and user_type from gRPC metadata.
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.LogoutAll(ctx, &berberimv1.LogoutAllRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /auth/sessions  (JWT required)
// Identity and session ID come from the validated JWT — never from query params.
func (h *AuthHandler) ListSessions(c *echo.Context) error {
	// Pass empty request; backend reads identity from gRPC metadata.
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListSessions(ctx, &berberimv1.ListSessionsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /auth/sessions/:session_id  (JWT required)
func (h *AuthHandler) RevokeSession(c *echo.Context) error {
	req := &berberimv1.RevokeSessionRequest{
		SessionId: c.Param("session_id"),
	}
	if req.SessionId == "" {
		return apierr.Write(c, http.StatusBadRequest, apierr.New("invalid_argument", "session_id is required"))
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.RevokeSession(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}
