package handler

import (
	"strconv"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/metadata"
)

// TenantHandler handles /api/v1/tenant/* routes.
// All routes require: ValidateJWT + RequireTokenType("tenant_user") + RequireTenantFromJWT.
type TenantHandler struct {
	base
}

func NewTenantHandler(client berberimv1.BerberimAPIClient) *TenantHandler {
	return &TenantHandler{base{client: client}}
}

// ── Tenant settings ───────────────────────────────────────────────────────────

// GET /api/v1/tenant/settings
func (h *TenantHandler) GetSettings(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetTenantSettings(ctx, &berberimv1.GetTenantSettingsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/settings
func (h *TenantHandler) UpdateSettings(c *echo.Context) error {
	var req berberimv1.UpdateTenantSettingsRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateTenantSettings(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/notification-settings
func (h *TenantHandler) GetNotificationSettings(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetNotificationSettings(ctx, &berberimv1.GetNotificationSettingsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/notification-settings
func (h *TenantHandler) UpdateNotificationSettings(c *echo.Context) error {
	var req berberimv1.UpdateNotificationSettingsRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateNotificationSettings(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Services catalog ──────────────────────────────────────────────────────────

// GET /api/v1/tenant/services
func (h *TenantHandler) ListServices(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListServices(ctx, &berberimv1.ListServicesRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/services
func (h *TenantHandler) CreateService(c *echo.Context) error {
	var req berberimv1.CreateServiceRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateService(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/services/:id
func (h *TenantHandler) GetService(c *echo.Context) error {
	req := &berberimv1.GetServiceRequest{ServiceId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetService(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/services/:id
func (h *TenantHandler) UpdateService(c *echo.Context) error {
	var req berberimv1.UpdateServiceRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.ServiceId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateService(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/tenant/services/:id
func (h *TenantHandler) DeleteService(c *echo.Context) error {
	req := &berberimv1.DeleteServiceRequest{ServiceId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteService(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Staff management ──────────────────────────────────────────────────────────

// GET /api/v1/tenant/staff
func (h *TenantHandler) ListStaff(c *echo.Context) error {
	req := &berberimv1.ListTenantUsersRequest{Role: "staff"}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListTenantUsers(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/staff
func (h *TenantHandler) CreateStaff(c *echo.Context) error {
	var req berberimv1.CreateTenantUserRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.Role = "staff"
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateTenantUser(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/staff/:id
func (h *TenantHandler) GetStaff(c *echo.Context) error {
	req := &berberimv1.GetStaffMemberRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffMember(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/staff/:id
func (h *TenantHandler) UpdateStaff(c *echo.Context) error {
	var req berberimv1.UpdateStaffMemberRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateStaffMember(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/tenant/staff/:id
func (h *TenantHandler) DeleteStaff(c *echo.Context) error {
	req := &berberimv1.DeleteStaffMemberRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteStaffMember(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/staff/:id/status
func (h *TenantHandler) SetStaffStatus(c *echo.Context) error {
	var req berberimv1.SetStaffStatusRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SetStaffStatus(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Staff-service assignments ──────────────────────────────────────────────────

// GET /api/v1/tenant/staff/:id/services
func (h *TenantHandler) GetStaffServices(c *echo.Context) error {
	req := &berberimv1.GetStaffServicesRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffServices(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PUT /api/v1/tenant/staff/:id/services  (full replacement)
func (h *TenantHandler) SetStaffServices(c *echo.Context) error {
	var req berberimv1.SetStaffServicesRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SetStaffServices(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/push-devices
func (h *TenantHandler) RegisterPushDevice(c *echo.Context) error {
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

// DELETE /api/v1/tenant/push-devices/:id
func (h *TenantHandler) DeletePushDevice(c *echo.Context) error {
	req := &berberimv1.DeletePushDeviceRequest{DeviceId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeletePushDevice(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Staff schedule rules ──────────────────────────────────────────────────────

// GET /api/v1/tenant/staff/:id/schedule-rules
func (h *TenantHandler) ListScheduleRules(c *echo.Context) error {
	req := &berberimv1.ListScheduleRulesRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListScheduleRules(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/staff/:id/schedule-rules
func (h *TenantHandler) CreateScheduleRule(c *echo.Context) error {
	var req berberimv1.CreateScheduleRuleRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateScheduleRule(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/staff/:id/schedule-rules/:ruleId
func (h *TenantHandler) UpdateScheduleRule(c *echo.Context) error {
	var req berberimv1.UpdateScheduleRuleRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	req.RuleId = c.Param("ruleId")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateScheduleRule(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/tenant/staff/:id/schedule-rules/:ruleId
func (h *TenantHandler) DeleteScheduleRule(c *echo.Context) error {
	req := &berberimv1.DeleteScheduleRuleRequest{
		StaffId: c.Param("id"),
		RuleId:  c.Param("ruleId"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteScheduleRule(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Staff time off ────────────────────────────────────────────────────────────

// GET /api/v1/tenant/staff/:id/time-offs
func (h *TenantHandler) ListTimeOffs(c *echo.Context) error {
	req := &berberimv1.ListTimeOffsRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListTimeOffs(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/staff/:id/time-offs
func (h *TenantHandler) CreateTimeOff(c *echo.Context) error {
	var req berberimv1.CreateTimeOffRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateTimeOff(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/staff/:id/time-offs/:timeOffId
func (h *TenantHandler) UpdateTimeOff(c *echo.Context) error {
	var req berberimv1.UpdateTimeOffRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.StaffId = c.Param("id")
	req.TimeOffId = c.Param("timeOffId")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateTimeOff(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/tenant/staff/:id/time-offs/:timeOffId
func (h *TenantHandler) DeleteTimeOff(c *echo.Context) error {
	req := &berberimv1.DeleteTimeOffRequest{
		StaffId:   c.Param("id"),
		TimeOffId: c.Param("timeOffId"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteTimeOff(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Appointments (admin view) ─────────────────────────────────────────────────

// GET /api/v1/tenant/appointments
func (h *TenantHandler) ListAppointments(c *echo.Context) error {
	req := &berberimv1.ListAppointmentsRequest{
		StaffUserId: c.QueryParam("staff_user_id"),
		CustomerId:  c.QueryParam("customer_id"),
		Status:      c.QueryParam("status"),
		DateFrom:    c.QueryParam("date_from"),
		DateTo:      c.QueryParam("date_to"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListAppointments(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/appointments/:id
func (h *TenantHandler) GetAppointment(c *echo.Context) error {
	req := &berberimv1.GetAppointmentRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAppointment(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/appointments
func (h *TenantHandler) CreateAppointment(c *echo.Context) error {
	var req berberimv1.CreateAppointmentRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateAppointment(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/appointments/:id/cancel
func (h *TenantHandler) CancelAppointment(c *echo.Context) error {
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

// POST /api/v1/tenant/appointments/:id/complete
func (h *TenantHandler) CompleteAppointment(c *echo.Context) error {
	req := &berberimv1.CompleteAppointmentRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CompleteAppointment(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/appointments/:id/mark-no-show
func (h *TenantHandler) MarkNoShow(c *echo.Context) error {
	req := &berberimv1.MarkNoShowRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.MarkNoShow(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/appointments/:id/mark-payment-received
func (h *TenantHandler) MarkPaymentReceived(c *echo.Context) error {
	req := &berberimv1.MarkPaymentReceivedRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.MarkPaymentReceived(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/appointments/:id/reschedule
func (h *TenantHandler) RescheduleAppointment(c *echo.Context) error {
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

// POST /api/v1/tenant/availability/search
func (h *TenantHandler) SearchAvailability(c *echo.Context) error {
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

// ── Customer management ───────────────────────────────────────────────────────

// GET /api/v1/tenant/customers
func (h *TenantHandler) ListCustomers(c *echo.Context) error {
	req := &berberimv1.ListCustomersRequest{
		Status: c.QueryParam("status"),
		Search: c.QueryParam("search"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListCustomers(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/customers
func (h *TenantHandler) CreateCustomer(c *echo.Context) error {
	var req berberimv1.CreateCustomerRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateCustomer(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/customers/:id
func (h *TenantHandler) GetCustomer(c *echo.Context) error {
	req := &berberimv1.GetAdminCustomerRequest{CustomerId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAdminCustomer(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/customers/:id
func (h *TenantHandler) UpdateCustomer(c *echo.Context) error {
	var req berberimv1.UpdateCustomerRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.CustomerId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateCustomer(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/customers/:id/status
func (h *TenantHandler) SetCustomerStatus(c *echo.Context) error {
	var req berberimv1.SetCustomerStatusRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.CustomerId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SetCustomerStatus(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/customers/:id/appointments
func (h *TenantHandler) ListCustomerAppointments(c *echo.Context) error {
	req := &berberimv1.ListAppointmentsRequest{
		CustomerId: c.Param("id"),
		Status:     c.QueryParam("status"),
		DateFrom:   c.QueryParam("date_from"),
		DateTo:     c.QueryParam("date_to"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListAppointments(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Loyalty settings ──────────────────────────────────────────────────────────

// GET /api/v1/tenant/loyalty/settings
func (h *TenantHandler) GetLoyaltySettings(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetLoyaltySettings(ctx, &berberimv1.GetLoyaltySettingsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/loyalty/settings
func (h *TenantHandler) UpdateLoyaltySettings(c *echo.Context) error {
	var req berberimv1.UpdateLoyaltySettingsRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateLoyaltySettings(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Rewards ───────────────────────────────────────────────────────────────────

// GET /api/v1/tenant/rewards
func (h *TenantHandler) ListRewards(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListRewards(ctx, &berberimv1.ListRewardsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/rewards
func (h *TenantHandler) CreateReward(c *echo.Context) error {
	var req berberimv1.CreateRewardRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateReward(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/rewards/:id
func (h *TenantHandler) GetReward(c *echo.Context) error {
	req := &berberimv1.GetRewardRequest{RewardId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetReward(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/rewards/:id
func (h *TenantHandler) UpdateReward(c *echo.Context) error {
	var req berberimv1.UpdateRewardRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.RewardId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.UpdateReward(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// DELETE /api/v1/tenant/rewards/:id
func (h *TenantHandler) DeleteReward(c *echo.Context) error {
	req := &berberimv1.DeleteRewardRequest{RewardId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteReward(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/tenant/rewards/:id/status
func (h *TenantHandler) SetRewardStatus(c *echo.Context) error {
	var req berberimv1.SetRewardStatusRequest
	if !bindBody(c, &req) {
		return nil
	}
	req.RewardId = c.Param("id")
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.SetRewardStatus(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Analytics ─────────────────────────────────────────────────────────────────

// GET /api/v1/tenant/analytics/overview
func (h *TenantHandler) GetAnalyticsOverview(c *echo.Context) error {
	req := &berberimv1.GetAnalyticsOverviewRequest{
		Range: c.QueryParam("range"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAnalyticsOverview(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/analytics/cohorts
func (h *TenantHandler) GetCohortAnalysis(c *echo.Context) error {
	var monthsBack int32
	if v, err := strconv.Atoi(c.QueryParam("months_back")); err == nil {
		monthsBack = int32(v)
	}
	req := &berberimv1.GetCohortAnalysisRequest{MonthsBack: monthsBack}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetCohortAnalysis(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/analytics/retention
func (h *TenantHandler) GetRetentionAnalysis(c *echo.Context) error {
	req := &berberimv1.GetRetentionAnalysisRequest{
		Range: c.QueryParam("range"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetRetentionAnalysis(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/analytics/ltv
func (h *TenantHandler) GetCustomerLTV(c *echo.Context) error {
	req := &berberimv1.GetCustomerLTVRequest{
		SegmentBy: c.QueryParam("segment_by"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetCustomerLTV(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/analytics/no-shows
func (h *TenantHandler) GetNoShowAnalysis(c *echo.Context) error {
	req := &berberimv1.GetNoShowAnalysisRequest{
		Range: c.QueryParam("range"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetNoShowAnalysis(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/me
func (h *TenantHandler) GetProfile(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffProfile(ctx, &berberimv1.GetStaffProfileRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/calendar
func (h *TenantHandler) GetCalendar(c *echo.Context) error {
	req := &berberimv1.GetStaffCalendarRequest{
		Date: c.QueryParam("date"),
		View: c.QueryParam("view"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffCalendar(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/tenant/staff/:id/reviews
func (h *TenantHandler) ListStaffReviews(c *echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))
	req := &berberimv1.ListStaffReviewsRequest{
		StaffUserId: c.Param("id"),
		Page:        int32(page),
		PageSize:    int32(pageSize),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListStaffReviews(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/tenant/avatar/upload-url
func (h *TenantHandler) GenerateStaffAvatarUploadURL(c *echo.Context) error {
	var req berberimv1.GenerateAvatarUploadURLRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GenerateStaffAvatarUploadURL(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PUT /api/v1/tenant/avatar/confirm
func (h *TenantHandler) ConfirmStaffAvatarUpload(c *echo.Context) error {
	var req berberimv1.ConfirmAvatarUploadRequest
	if !bindBody(c, &req) {
		return nil
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ConfirmStaffAvatarUpload(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}
