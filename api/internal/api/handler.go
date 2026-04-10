package api

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/analytics"
	"github.com/berberim/api/internal/appointment"
	"github.com/berberim/api/internal/auth"
	"github.com/berberim/api/internal/customer"
	"github.com/berberim/api/internal/loyalty"
	"github.com/berberim/api/internal/notification"
	"github.com/berberim/api/internal/review"
	"github.com/berberim/api/internal/tenant"
)

// Handler composes all domain handlers under a single gRPC registration.
type Handler struct {
	berberimv1.UnimplementedBerberimAPIServer
	auth         *auth.Handler
	tenant       *tenant.Handler
	appointment  *appointment.Handler
	loyalty      *loyalty.Handler
	customer     *customer.Handler
	notification *notification.Handler
	review       *review.Handler
	analytics    *analytics.Handler
}

func NewHandler(
	auth *auth.Handler,
	tenant *tenant.Handler,
	appointment *appointment.Handler,
	loyalty *loyalty.Handler,
	customer *customer.Handler,
	notification *notification.Handler,
	review *review.Handler,
	analytics *analytics.Handler,
) *Handler {
	return &Handler{
		auth:         auth,
		tenant:       tenant,
		appointment:  appointment,
		loyalty:      loyalty,
		customer:     customer,
		notification: notification,
		review:       review,
		analytics:    analytics,
	}
}

// ── Auth RPCs ─────────────────────────────────────────────────────────────────

func (h *Handler) SendCustomerOTP(ctx context.Context, req *berberimv1.SendCustomerOTPRequest) (*berberimv1.SendCustomerOTPResponse, error) {
	return h.auth.SendCustomerOTP(ctx, req)
}

func (h *Handler) VerifyCustomerOTP(ctx context.Context, req *berberimv1.VerifyCustomerOTPRequest) (*berberimv1.VerifyCustomerOTPResponse, error) {
	return h.auth.VerifyCustomerOTP(ctx, req)
}

func (h *Handler) VerifyCustomerSocialLogin(ctx context.Context, req *berberimv1.VerifyCustomerSocialLoginRequest) (*berberimv1.VerifyCustomerSocialLoginResponse, error) {
	return h.auth.VerifyCustomerSocialLogin(ctx, req)
}

func (h *Handler) LoginTenantUser(ctx context.Context, req *berberimv1.LoginTenantUserRequest) (*berberimv1.LoginTenantUserResponse, error) {
	return h.auth.LoginTenantUser(ctx, req)
}

func (h *Handler) LoginPlatformUser(ctx context.Context, req *berberimv1.LoginPlatformUserRequest) (*berberimv1.LoginPlatformUserResponse, error) {
	return h.auth.LoginPlatformUser(ctx, req)
}

func (h *Handler) RefreshToken(ctx context.Context, req *berberimv1.RefreshTokenRequest) (*berberimv1.RefreshTokenResponse, error) {
	return h.auth.RefreshToken(ctx, req)
}

func (h *Handler) Logout(ctx context.Context, req *berberimv1.LogoutRequest) (*berberimv1.LogoutResponse, error) {
	return h.auth.Logout(ctx, req)
}

func (h *Handler) LogoutAll(ctx context.Context, req *berberimv1.LogoutAllRequest) (*berberimv1.LogoutAllResponse, error) {
	return h.auth.LogoutAll(ctx, req)
}

func (h *Handler) ListSessions(ctx context.Context, req *berberimv1.ListSessionsRequest) (*berberimv1.ListSessionsResponse, error) {
	return h.auth.ListSessions(ctx, req)
}

func (h *Handler) RevokeSession(ctx context.Context, req *berberimv1.RevokeSessionRequest) (*berberimv1.RevokeSessionResponse, error) {
	return h.auth.RevokeSession(ctx, req)
}

func (h *Handler) RegisterPushDevice(ctx context.Context, req *berberimv1.RegisterPushDeviceRequest) (*berberimv1.RegisterPushDeviceResponse, error) {
	return h.notification.RegisterPushDevice(ctx, req)
}

func (h *Handler) DeletePushDevice(ctx context.Context, req *berberimv1.DeletePushDeviceRequest) (*berberimv1.DeletePushDeviceResponse, error) {
	return h.notification.DeletePushDevice(ctx, req)
}

// ── Tenant RPCs ───────────────────────────────────────────────────────────────

func (h *Handler) CreateTenant(ctx context.Context, req *berberimv1.CreateTenantRequest) (*berberimv1.CreateTenantResponse, error) {
	return h.tenant.CreateTenant(ctx, req)
}

func (h *Handler) ListTenants(ctx context.Context, req *berberimv1.ListTenantsRequest) (*berberimv1.ListTenantsResponse, error) {
	return h.tenant.ListTenants(ctx, req)
}

func (h *Handler) GetTenant(ctx context.Context, req *berberimv1.GetTenantRequest) (*berberimv1.GetTenantResponse, error) {
	return h.tenant.GetTenant(ctx, req)
}

func (h *Handler) UpdateTenant(ctx context.Context, req *berberimv1.UpdateTenantRequest) (*berberimv1.UpdateTenantResponse, error) {
	return h.tenant.UpdateTenant(ctx, req)
}

func (h *Handler) SetTenantStatus(ctx context.Context, req *berberimv1.SetTenantStatusRequest) (*berberimv1.SetTenantStatusResponse, error) {
	return h.tenant.SetTenantStatus(ctx, req)
}

func (h *Handler) CreateTenantUser(ctx context.Context, req *berberimv1.CreateTenantUserRequest) (*berberimv1.CreateTenantUserResponse, error) {
	return h.tenant.CreateTenantUser(ctx, req)
}

func (h *Handler) ListTenantUsers(ctx context.Context, req *berberimv1.ListTenantUsersRequest) (*berberimv1.ListTenantUsersResponse, error) {
	return h.tenant.ListTenantUsers(ctx, req)
}

func (h *Handler) DisableTenantUser(ctx context.Context, req *berberimv1.DisableTenantUserRequest) (*berberimv1.DisableTenantUserResponse, error) {
	return h.tenant.DisableTenantUser(ctx, req)
}

func (h *Handler) EnableTenantUser(ctx context.Context, req *berberimv1.EnableTenantUserRequest) (*berberimv1.EnableTenantUserResponse, error) {
	return h.tenant.EnableTenantUser(ctx, req)
}

// ── Staff Profile RPC ─────────────────────────────────────────────────────────

func (h *Handler) GetStaffProfile(ctx context.Context, req *berberimv1.GetStaffProfileRequest) (*berberimv1.GetStaffProfileResponse, error) {
	return h.tenant.GetStaffProfile(ctx, req)
}

// ── Public Bootstrap RPC ──────────────────────────────────────────────────────

func (h *Handler) GetPublicBootstrap(ctx context.Context, req *berberimv1.GetPublicBootstrapRequest) (*berberimv1.GetPublicBootstrapResponse, error) {
	return h.tenant.GetPublicBootstrap(ctx, req)
}

// ── Tenant Branding RPCs ──────────────────────────────────────────────────────

func (h *Handler) GetTenantBranding(ctx context.Context, req *berberimv1.GetTenantBrandingRequest) (*berberimv1.GetTenantBrandingResponse, error) {
	return h.tenant.GetTenantBranding(ctx, req)
}

func (h *Handler) UpdateTenantBranding(ctx context.Context, req *berberimv1.UpdateTenantBrandingRequest) (*berberimv1.UpdateTenantBrandingResponse, error) {
	return h.tenant.UpdateTenantBranding(ctx, req)
}

// ── Tenant Settings RPCs ──────────────────────────────────────────────────────

func (h *Handler) GetTenantSettings(ctx context.Context, req *berberimv1.GetTenantSettingsRequest) (*berberimv1.GetTenantSettingsResponse, error) {
	return h.tenant.GetTenantSettings(ctx, req)
}

func (h *Handler) UpdateTenantSettings(ctx context.Context, req *berberimv1.UpdateTenantSettingsRequest) (*berberimv1.UpdateTenantSettingsResponse, error) {
	return h.tenant.UpdateTenantSettings(ctx, req)
}

func (h *Handler) GetNotificationSettings(ctx context.Context, req *berberimv1.GetNotificationSettingsRequest) (*berberimv1.GetNotificationSettingsResponse, error) {
	return h.notification.GetNotificationSettings(ctx, req)
}

func (h *Handler) UpdateNotificationSettings(ctx context.Context, req *berberimv1.UpdateNotificationSettingsRequest) (*berberimv1.UpdateNotificationSettingsResponse, error) {
	return h.notification.UpdateNotificationSettings(ctx, req)
}

// ── Services Catalog RPCs ─────────────────────────────────────────────────────

func (h *Handler) ListServices(ctx context.Context, req *berberimv1.ListServicesRequest) (*berberimv1.ListServicesResponse, error) {
	return h.tenant.ListServices(ctx, req)
}

func (h *Handler) CreateService(ctx context.Context, req *berberimv1.CreateServiceRequest) (*berberimv1.CreateServiceResponse, error) {
	return h.tenant.CreateService(ctx, req)
}

func (h *Handler) UpdateService(ctx context.Context, req *berberimv1.UpdateServiceRequest) (*berberimv1.UpdateServiceResponse, error) {
	return h.tenant.UpdateService(ctx, req)
}

// ── Staff CRUD RPCs ─────────────────────────────────────────────────────────

func (h *Handler) GetStaffMember(ctx context.Context, req *berberimv1.GetStaffMemberRequest) (*berberimv1.GetStaffMemberResponse, error) {
	return h.tenant.GetStaffMember(ctx, req)
}

func (h *Handler) UpdateStaffMember(ctx context.Context, req *berberimv1.UpdateStaffMemberRequest) (*berberimv1.UpdateStaffMemberResponse, error) {
	return h.tenant.UpdateStaffMember(ctx, req)
}

func (h *Handler) DeleteStaffMember(ctx context.Context, req *berberimv1.DeleteStaffMemberRequest) (*berberimv1.DeleteStaffMemberResponse, error) {
	return h.tenant.DeleteStaffMember(ctx, req)
}

func (h *Handler) SetStaffStatus(ctx context.Context, req *berberimv1.SetStaffStatusRequest) (*berberimv1.SetStaffStatusResponse, error) {
	return h.tenant.SetStaffStatus(ctx, req)
}

// ── Staff Services RPCs ─────────────────────────────────────────────────────

func (h *Handler) GetStaffServices(ctx context.Context, req *berberimv1.GetStaffServicesRequest) (*berberimv1.GetStaffServicesResponse, error) {
	return h.tenant.GetStaffServices(ctx, req)
}

func (h *Handler) SetStaffServices(ctx context.Context, req *berberimv1.SetStaffServicesRequest) (*berberimv1.SetStaffServicesResponse, error) {
	return h.tenant.SetStaffServices(ctx, req)
}

// ── Schedule Rules RPCs ─────────────────────────────────────────────────────

func (h *Handler) ListScheduleRules(ctx context.Context, req *berberimv1.ListScheduleRulesRequest) (*berberimv1.ListScheduleRulesResponse, error) {
	return h.tenant.ListScheduleRules(ctx, req)
}

func (h *Handler) CreateScheduleRule(ctx context.Context, req *berberimv1.CreateScheduleRuleRequest) (*berberimv1.CreateScheduleRuleResponse, error) {
	return h.tenant.CreateScheduleRule(ctx, req)
}

func (h *Handler) UpdateScheduleRule(ctx context.Context, req *berberimv1.UpdateScheduleRuleRequest) (*berberimv1.UpdateScheduleRuleResponse, error) {
	return h.tenant.UpdateScheduleRule(ctx, req)
}

func (h *Handler) DeleteScheduleRule(ctx context.Context, req *berberimv1.DeleteScheduleRuleRequest) (*berberimv1.DeleteScheduleRuleResponse, error) {
	return h.tenant.DeleteScheduleRule(ctx, req)
}

// ── Time Off RPCs ───────────────────────────────────────────────────────────

func (h *Handler) ListTimeOffs(ctx context.Context, req *berberimv1.ListTimeOffsRequest) (*berberimv1.ListTimeOffsResponse, error) {
	return h.tenant.ListTimeOffs(ctx, req)
}

func (h *Handler) CreateTimeOff(ctx context.Context, req *berberimv1.CreateTimeOffRequest) (*berberimv1.CreateTimeOffResponse, error) {
	return h.tenant.CreateTimeOff(ctx, req)
}

func (h *Handler) UpdateTimeOff(ctx context.Context, req *berberimv1.UpdateTimeOffRequest) (*berberimv1.UpdateTimeOffResponse, error) {
	return h.tenant.UpdateTimeOff(ctx, req)
}

func (h *Handler) DeleteTimeOff(ctx context.Context, req *berberimv1.DeleteTimeOffRequest) (*berberimv1.DeleteTimeOffResponse, error) {
	return h.tenant.DeleteTimeOff(ctx, req)
}

// ── Staff Calendar RPC ──────────────────────────────────────────────────────

func (h *Handler) GetStaffCalendar(ctx context.Context, req *berberimv1.GetStaffCalendarRequest) (*berberimv1.GetStaffCalendarResponse, error) {
	return h.tenant.GetStaffCalendar(ctx, req)
}

// ── Analytics RPCs ──────────────────────────────────────────────────────────

func (h *Handler) GetAnalyticsOverview(ctx context.Context, req *berberimv1.GetAnalyticsOverviewRequest) (*berberimv1.GetAnalyticsOverviewResponse, error) {
	return h.tenant.GetAnalyticsOverview(ctx, req)
}

func (h *Handler) GetCohortAnalysis(ctx context.Context, req *berberimv1.GetCohortAnalysisRequest) (*berberimv1.GetCohortAnalysisResponse, error) {
	return h.analytics.GetCohortAnalysis(ctx, req)
}

func (h *Handler) GetRetentionAnalysis(ctx context.Context, req *berberimv1.GetRetentionAnalysisRequest) (*berberimv1.GetRetentionAnalysisResponse, error) {
	return h.analytics.GetRetentionAnalysis(ctx, req)
}

func (h *Handler) GetCustomerLTV(ctx context.Context, req *berberimv1.GetCustomerLTVRequest) (*berberimv1.GetCustomerLTVResponse, error) {
	return h.analytics.GetCustomerLTV(ctx, req)
}

func (h *Handler) GetNoShowAnalysis(ctx context.Context, req *berberimv1.GetNoShowAnalysisRequest) (*berberimv1.GetNoShowAnalysisResponse, error) {
	return h.analytics.GetNoShowAnalysis(ctx, req)
}

// ── Appointment RPCs ──────────────────────────────────────────────────────────

func (h *Handler) SearchAvailability(ctx context.Context, req *berberimv1.SearchAvailabilityRequest) (*berberimv1.SearchAvailabilityResponse, error) {
	return h.appointment.SearchAvailability(ctx, req)
}

func (h *Handler) GetSlotRecommendations(ctx context.Context, req *berberimv1.GetSlotRecommendationsRequest) (*berberimv1.GetSlotRecommendationsResponse, error) {
	return h.appointment.GetSlotRecommendations(ctx, req)
}

func (h *Handler) GetBookingLimitStatus(ctx context.Context, req *berberimv1.GetBookingLimitStatusRequest) (*berberimv1.GetBookingLimitStatusResponse, error) {
	return h.appointment.GetBookingLimitStatus(ctx, req)
}

func (h *Handler) CreateAppointment(ctx context.Context, req *berberimv1.CreateAppointmentRequest) (*berberimv1.CreateAppointmentResponse, error) {
	return h.appointment.CreateAppointment(ctx, req)
}

func (h *Handler) GetAppointment(ctx context.Context, req *berberimv1.GetAppointmentRequest) (*berberimv1.GetAppointmentResponse, error) {
	return h.appointment.GetAppointment(ctx, req)
}

func (h *Handler) ListAppointments(ctx context.Context, req *berberimv1.ListAppointmentsRequest) (*berberimv1.ListAppointmentsResponse, error) {
	return h.appointment.ListAppointments(ctx, req)
}

func (h *Handler) CancelAppointment(ctx context.Context, req *berberimv1.CancelAppointmentRequest) (*berberimv1.CancelAppointmentResponse, error) {
	return h.appointment.CancelAppointment(ctx, req)
}

func (h *Handler) RescheduleAppointment(ctx context.Context, req *berberimv1.RescheduleAppointmentRequest) (*berberimv1.RescheduleAppointmentResponse, error) {
	return h.appointment.RescheduleAppointment(ctx, req)
}

func (h *Handler) CompleteAppointment(ctx context.Context, req *berberimv1.CompleteAppointmentRequest) (*berberimv1.CompleteAppointmentResponse, error) {
	return h.appointment.CompleteAppointment(ctx, req)
}

func (h *Handler) MarkNoShow(ctx context.Context, req *berberimv1.MarkNoShowRequest) (*berberimv1.MarkNoShowResponse, error) {
	return h.appointment.MarkNoShow(ctx, req)
}

func (h *Handler) MarkPaymentReceived(ctx context.Context, req *berberimv1.MarkPaymentReceivedRequest) (*berberimv1.MarkPaymentReceivedResponse, error) {
	return h.appointment.MarkPaymentReceived(ctx, req)
}

// ── Loyalty RPCs ──────────────────────────────────────────────────────────────

func (h *Handler) GetLoyaltyBalance(ctx context.Context, req *berberimv1.GetLoyaltyBalanceRequest) (*berberimv1.GetLoyaltyBalanceResponse, error) {
	return h.loyalty.GetLoyaltyBalance(ctx, req)
}

// ── Customer RPCs ─────────────────────────────────────────────────────────────

func (h *Handler) GetCustomerProfile(ctx context.Context, req *berberimv1.GetCustomerProfileRequest) (*berberimv1.GetCustomerProfileResponse, error) {
	return h.customer.GetCustomerProfile(ctx, req)
}

func (h *Handler) UpdateCustomerProfile(ctx context.Context, req *berberimv1.UpdateCustomerProfileRequest) (*berberimv1.UpdateCustomerProfileResponse, error) {
	return h.customer.UpdateCustomerProfile(ctx, req)
}

func (h *Handler) ListCustomers(ctx context.Context, req *berberimv1.ListCustomersRequest) (*berberimv1.ListCustomersResponse, error) {
	return h.customer.ListCustomers(ctx, req)
}

func (h *Handler) GetAdminCustomer(ctx context.Context, req *berberimv1.GetAdminCustomerRequest) (*berberimv1.GetAdminCustomerResponse, error) {
	return h.customer.GetAdminCustomer(ctx, req)
}

func (h *Handler) UpdateCustomer(ctx context.Context, req *berberimv1.UpdateCustomerRequest) (*berberimv1.UpdateCustomerResponse, error) {
	return h.customer.UpdateCustomer(ctx, req)
}

func (h *Handler) SetCustomerStatus(ctx context.Context, req *berberimv1.SetCustomerStatusRequest) (*berberimv1.SetCustomerStatusResponse, error) {
	return h.customer.SetCustomerStatus(ctx, req)
}

// ── Review RPCs ──────────────────────────────────────────────────────────────

func (h *Handler) CreateStaffReview(ctx context.Context, req *berberimv1.CreateStaffReviewRequest) (*berberimv1.CreateStaffReviewResponse, error) {
	return h.review.CreateStaffReview(ctx, req)
}

func (h *Handler) UpdateStaffReview(ctx context.Context, req *berberimv1.UpdateStaffReviewRequest) (*berberimv1.UpdateStaffReviewResponse, error) {
	return h.review.UpdateStaffReview(ctx, req)
}

func (h *Handler) DeleteStaffReview(ctx context.Context, req *berberimv1.DeleteStaffReviewRequest) (*berberimv1.DeleteStaffReviewResponse, error) {
	return h.review.DeleteStaffReview(ctx, req)
}

func (h *Handler) ListStaffReviews(ctx context.Context, req *berberimv1.ListStaffReviewsRequest) (*berberimv1.ListStaffReviewsResponse, error) {
	return h.review.ListStaffReviews(ctx, req)
}

func (h *Handler) GetMyReviewForAppointment(ctx context.Context, req *berberimv1.GetMyReviewForAppointmentRequest) (*berberimv1.GetMyReviewForAppointmentResponse, error) {
	return h.review.GetMyReviewForAppointment(ctx, req)
}

// ── Customer Notification RPCs ───────────────────────────────────────────────

func (h *Handler) ListCustomerNotifications(ctx context.Context, req *berberimv1.ListCustomerNotificationsRequest) (*berberimv1.ListCustomerNotificationsResponse, error) {
	return h.notification.ListCustomerNotifications(ctx, req)
}

func (h *Handler) MarkNotificationRead(ctx context.Context, req *berberimv1.MarkNotificationReadRequest) (*berberimv1.MarkNotificationReadResponse, error) {
	return h.notification.MarkNotificationRead(ctx, req)
}

func (h *Handler) MarkAllNotificationsRead(ctx context.Context, req *berberimv1.MarkAllNotificationsReadRequest) (*berberimv1.MarkAllNotificationsReadResponse, error) {
	return h.notification.MarkAllNotificationsRead(ctx, req)
}

func (h *Handler) GetUnreadNotificationCount(ctx context.Context, req *berberimv1.GetUnreadNotificationCountRequest) (*berberimv1.GetUnreadNotificationCountResponse, error) {
	return h.notification.GetUnreadNotificationCount(ctx, req)
}
