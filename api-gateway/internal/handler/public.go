package handler

import (
	"net/http"

	"github.com/berberim/api-gateway/internal/apierr"
	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/metadata"
)

// PublicHandler handles /api/v1/public/* routes.
// No authentication required. Tenant is resolved from X-Tenant-ID header
// or the tenant_id query/body parameter.
type PublicHandler struct {
	base
}

func NewPublicHandler(client berberimv1.BerberimAPIClient) *PublicHandler {
	return &PublicHandler{base{client: client}}
}

// GET /api/v1/public/tenants/:tenant_id/bootstrap
func (h *PublicHandler) GetBootstrap(c *echo.Context) error {
	tenantID := c.Param("tenant_id")
	if tenantID == "" {
		return apierr.Write(c, http.StatusBadRequest, apierr.New("invalid_argument", "tenant_id is required"))
	}

	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetPublicBootstrap(ctx, &berberimv1.GetPublicBootstrapRequest{Id: tenantID})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/public/services?tenant_id=
func (h *PublicHandler) ListServices(c *echo.Context) error {
	req := &berberimv1.ListServicesRequest{
		TenantId: c.QueryParam("tenant_id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListServices(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/public/services/:serviceId?tenant_id=
func (h *PublicHandler) GetService(c *echo.Context) error {
	req := &berberimv1.GetPublicServiceRequest{
		TenantId:  c.QueryParam("tenant_id"),
		ServiceId: c.Param("serviceId"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetPublicService(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/public/staff?tenant_id=
func (h *PublicHandler) ListStaff(c *echo.Context) error {
	req := &berberimv1.ListPublicStaffRequest{
		TenantId: c.QueryParam("tenant_id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListPublicStaff(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/public/staff/:staffId?tenant_id=
func (h *PublicHandler) GetStaff(c *echo.Context) error {
	req := &berberimv1.GetPublicStaffRequest{
		TenantId: c.QueryParam("tenant_id"),
		StaffId:  c.Param("staffId"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetPublicStaff(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/public/staff/:staffId/services?tenant_id=
func (h *PublicHandler) ListStaffServices(c *echo.Context) error {
	req := &berberimv1.ListPublicStaffServicesRequest{
		TenantId: c.QueryParam("tenant_id"),
		StaffId:  c.Param("staffId"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListPublicStaffServices(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/availability/search
func (h *PublicHandler) SearchAvailability(c *echo.Context) error {
	var req berberimv1.SearchAvailabilityRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SearchAvailability(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/availability/search-multi-day
func (h *PublicHandler) SearchMultiDayAvailability(c *echo.Context) error {
	var req berberimv1.SearchMultiDayAvailabilityRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SearchMultiDayAvailability(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/public/availability/days?tenant_id=&service_ids=...&staff_id=&from=&to=
func (h *PublicHandler) GetAvailabilityDays(c *echo.Context) error {
	req := &berberimv1.GetAvailabilityDaysRequest{
		TenantId:   c.QueryParam("tenant_id"),
		StaffId:    c.QueryParam("staff_id"),
		From:       c.QueryParam("from"),
		To:         c.QueryParam("to"),
		ServiceIds: c.QueryParams()["service_ids"],
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAvailabilityDays(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}
