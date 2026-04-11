package handler

import (
	"strconv"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/metadata"
)

// CustomerHandler handles /api/v1/customer/* routes.
// All routes require: ValidateJWT + RequireTokenType("customer") + RequireTenantHeader.
// The tenant_id is sourced from X-Tenant-ID header (injected into AuthContext by middleware).
// The customer_id is sourced from the JWT sub claim.
type CustomerHandler struct {
	base
}

func NewCustomerHandler(client berberimv1.BerberimAPIClient) *CustomerHandler {
	return &CustomerHandler{base{client: client}}
}

// GET /api/v1/customer/tenants
func (h *CustomerHandler) ListTenants(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListCustomerTenants(ctx, &berberimv1.ListCustomerTenantsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/tenants/link
func (h *CustomerHandler) ClaimLinkCode(c *echo.Context) error {
	var req berberimv1.ClaimLinkCodeRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ClaimLinkCode(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/availability?service_ids=id1,id2&date=
func (h *CustomerHandler) SearchAvailability(c *echo.Context) error {
	req := &berberimv1.SearchAvailabilityRequest{
		ServiceIds:  splitCSV(c.QueryParam("service_ids")),
		Date:        c.QueryParam("date"),
		StaffUserId: c.QueryParam("staff_user_id"), // optional — filters to one staff member
		// tenant_id resolved from metadata
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SearchAvailability(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/availability/search-multi-day
func (h *CustomerHandler) SearchMultiDayAvailability(c *echo.Context) error {
	var req berberimv1.SearchMultiDayAvailabilityRequest
	if !bindBody(c, &req) {
		return nil
	}
	// tenant_id resolved from JWT metadata on backend
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SearchMultiDayAvailability(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/services
func (h *CustomerHandler) ListServices(c *echo.Context) error {
	// tenant_id from metadata (populated via X-Tenant-ID header)
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListServices(ctx, &berberimv1.ListServicesRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/booking-limit
func (h *CustomerHandler) GetBookingLimitStatus(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetBookingLimitStatus(ctx, &berberimv1.GetBookingLimitStatusRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/appointments
func (h *CustomerHandler) CreateAppointment(c *echo.Context) error {
	var req berberimv1.CreateAppointmentRequest
	if !bindBody(c, &req) {
		return nil
	}
	// created_via is always customer_app on this surface
	req.CreatedVia = "customer_app"
	// customer_id is taken from JWT on the backend — do not allow client to set it
	req.CustomerId = ""
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateAppointment(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/appointments
func (h *CustomerHandler) ListMyAppointments(c *echo.Context) error {
	req := &berberimv1.ListAppointmentsRequest{
		Status:   c.QueryParam("status"),
		DateFrom: c.QueryParam("date_from"),
		DateTo:   c.QueryParam("date_to"),
	}
	// customer_id is injected by backend from JWT metadata — not from query params
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListAppointments(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/appointments/:id
func (h *CustomerHandler) GetAppointment(c *echo.Context) error {
	req := &berberimv1.GetAppointmentRequest{
		AppointmentId: c.Param("id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAppointment(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/appointments/:id/cancel
func (h *CustomerHandler) CancelAppointment(c *echo.Context) error {
	var req berberimv1.CancelAppointmentRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.AppointmentId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CancelAppointment(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/appointments/:id/reschedule
func (h *CustomerHandler) RescheduleAppointment(c *echo.Context) error {
	var req berberimv1.RescheduleAppointmentRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.AppointmentId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.RescheduleAppointment(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/loyalty/balance
func (h *CustomerHandler) GetLoyaltyBalance(c *echo.Context) error {
	// customer_id resolved from JWT on the backend
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetLoyaltyBalance(ctx, &berberimv1.GetLoyaltyBalanceRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/me
func (h *CustomerHandler) GetProfile(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetCustomerProfile(ctx, &berberimv1.GetCustomerProfileRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/customer/me
func (h *CustomerHandler) UpdateProfile(c *echo.Context) error {
	var req berberimv1.UpdateCustomerProfileRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateCustomerProfile(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/loyalty/transactions
func (h *CustomerHandler) GetLoyaltyTransactions(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetLoyaltyTransactions(ctx, &berberimv1.GetLoyaltyTransactionsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/reviews
func (h *CustomerHandler) CreateReview(c *echo.Context) error {
	var req berberimv1.CreateStaffReviewRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateStaffReview(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/customer/reviews/:id
func (h *CustomerHandler) UpdateReview(c *echo.Context) error {
	var req berberimv1.UpdateStaffReviewRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.ReviewId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateStaffReview(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/customer/reviews/:id
func (h *CustomerHandler) DeleteReview(c *echo.Context) error {
	req := &berberimv1.DeleteStaffReviewRequest{ReviewId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteStaffReview(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/appointments/:id/review
func (h *CustomerHandler) GetMyReviewForAppointment(c *echo.Context) error {
	req := &berberimv1.GetMyReviewForAppointmentRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetMyReviewForAppointment(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/loyalty/rewards
func (h *CustomerHandler) ListRewards(c *echo.Context) error {
	req := &berberimv1.ListRewardsRequest{ActiveOnly: true}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListRewards(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/push-devices
func (h *CustomerHandler) RegisterPushDevice(c *echo.Context) error {
	var req berberimv1.RegisterPushDeviceRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.RegisterPushDevice(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/customer/push-devices/:id
func (h *CustomerHandler) DeletePushDevice(c *echo.Context) error {
	req := &berberimv1.DeletePushDeviceRequest{DeviceId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeletePushDevice(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/notifications
func (h *CustomerHandler) ListNotifications(c *echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	req := &berberimv1.ListCustomerNotificationsRequest{
		Page:     int32(page),
		PageSize: int32(pageSize),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListCustomerNotifications(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/customer/notifications/:id/read
func (h *CustomerHandler) MarkNotificationRead(c *echo.Context) error {
	req := &berberimv1.MarkNotificationReadRequest{
		NotificationId: c.Param("id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.MarkNotificationRead(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/customer/notifications/read-all
func (h *CustomerHandler) MarkAllNotificationsRead(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.MarkAllNotificationsRead(ctx, &berberimv1.MarkAllNotificationsReadRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/customer/notifications/unread-count
func (h *CustomerHandler) GetUnreadNotificationCount(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetUnreadNotificationCount(ctx, &berberimv1.GetUnreadNotificationCountRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/customer/avatar/upload-url
func (h *CustomerHandler) GenerateAvatarUploadURL(c *echo.Context) error {
	var req berberimv1.GenerateAvatarUploadURLRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GenerateCustomerAvatarUploadURL(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PUT /api/v1/customer/avatar/confirm
func (h *CustomerHandler) ConfirmAvatarUpload(c *echo.Context) error {
	var req berberimv1.ConfirmAvatarUploadRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ConfirmCustomerAvatarUpload(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}
