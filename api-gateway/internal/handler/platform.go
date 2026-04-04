package handler

import (
	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/metadata"
)

// PlatformHandler handles /api/v1/platform/* routes.
// All routes require: ValidateJWT + RequireTokenType("platform_user").
type PlatformHandler struct {
	base
}

func NewPlatformHandler(client berberimv1.BerberimAPIClient) *PlatformHandler {
	return &PlatformHandler{base{client: client}}
}

// POST /api/v1/platform/tenants
func (h *PlatformHandler) CreateTenant(c *echo.Context) error {
	var req berberimv1.CreateTenantRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateTenant(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/platform/tenants
func (h *PlatformHandler) ListTenants(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListTenants(ctx, &berberimv1.ListTenantsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/platform/tenants/:id
func (h *PlatformHandler) GetTenant(c *echo.Context) error {
	req := &berberimv1.GetTenantRequest{Id: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetTenant(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/platform/tenants/:id/status
func (h *PlatformHandler) SetTenantStatus(c *echo.Context) error {
	var req berberimv1.SetTenantStatusRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.TenantId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SetTenantStatus(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/platform/tenants/:tenant_id/users
func (h *PlatformHandler) CreateTenantUser(c *echo.Context) error {
	var req berberimv1.CreateTenantUserRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateTenantUser(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/platform/tenants/:tenant_id/users
func (h *PlatformHandler) ListTenantUsers(c *echo.Context) error {
	req := &berberimv1.ListTenantUsersRequest{}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListTenantUsers(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PUT /api/v1/platform/tenants/:tenant_id/users/:user_id/disable
func (h *PlatformHandler) DisableTenantUser(c *echo.Context) error {
	req := &berberimv1.DisableTenantUserRequest{
		UserId: c.Param("user_id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DisableTenantUser(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PUT /api/v1/platform/tenants/:tenant_id/users/:user_id/enable
func (h *PlatformHandler) EnableTenantUser(c *echo.Context) error {
	req := &berberimv1.EnableTenantUserRequest{
		UserId: c.Param("user_id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.EnableTenantUser(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/platform/tenants/:id
func (h *PlatformHandler) UpdateTenant(c *echo.Context) error {
	var req berberimv1.UpdateTenantRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.TenantId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateTenant(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/platform/tenants/:id/freeze
func (h *PlatformHandler) FreezeTenant(c *echo.Context) error {
	req := &berberimv1.FreezeTenantRequest{TenantId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.FreezeTenant(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/platform/tenants/:id/reactivate
func (h *PlatformHandler) ReactivateTenant(c *echo.Context) error {
	req := &berberimv1.ReactivateTenantRequest{TenantId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ReactivateTenant(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/platform/tenants/:id/cancel-subscription
func (h *PlatformHandler) CancelSubscription(c *echo.Context) error {
	req := &berberimv1.CancelTenantSubscriptionRequest{TenantId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CancelTenantSubscription(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/platform/tenants/:id/extend-subscription
func (h *PlatformHandler) ExtendSubscription(c *echo.Context) error {
	var req berberimv1.ExtendTenantSubscriptionRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.TenantId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ExtendTenantSubscription(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/platform/users
func (h *PlatformHandler) ListPlatformUsers(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListPlatformUsers(ctx, &berberimv1.ListPlatformUsersRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/platform/users
func (h *PlatformHandler) CreatePlatformUser(c *echo.Context) error {
	var req berberimv1.CreatePlatformUserRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreatePlatformUser(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/platform/users/:id
func (h *PlatformHandler) GetPlatformUser(c *echo.Context) error {
	req := &berberimv1.GetPlatformUserRequest{UserId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetPlatformUser(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/platform/users/:id
func (h *PlatformHandler) UpdatePlatformUser(c *echo.Context) error {
	var req berberimv1.UpdatePlatformUserRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.UserId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdatePlatformUser(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/platform/users/:id
func (h *PlatformHandler) DeletePlatformUser(c *echo.Context) error {
	req := &berberimv1.DeletePlatformUserRequest{UserId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeletePlatformUser(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}
