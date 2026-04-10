package internal

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/berberim/api-gateway/internal/config"
	"github.com/berberim/api-gateway/internal/handler"
	"github.com/berberim/api-gateway/internal/security"
	berberimv1 "github.com/berberim/api/api/v1"
	"google.golang.org/grpc"
)

// ── Stub gRPC client ──────────────────────────────────────────────────────────

// stubClient is a no-op implementation of BerberimAPIClient for testing.
// All methods return empty responses with no error.
type stubClient struct{}

func (s *stubClient) SendCustomerOTP(_ context.Context, _ *berberimv1.SendCustomerOTPRequest, _ ...grpc.CallOption) (*berberimv1.SendCustomerOTPResponse, error) {
	return &berberimv1.SendCustomerOTPResponse{}, nil
}
func (s *stubClient) VerifyCustomerOTP(_ context.Context, _ *berberimv1.VerifyCustomerOTPRequest, _ ...grpc.CallOption) (*berberimv1.VerifyCustomerOTPResponse, error) {
	return &berberimv1.VerifyCustomerOTPResponse{}, nil
}
func (s *stubClient) VerifyCustomerSocialLogin(_ context.Context, _ *berberimv1.VerifyCustomerSocialLoginRequest, _ ...grpc.CallOption) (*berberimv1.VerifyCustomerSocialLoginResponse, error) {
	return &berberimv1.VerifyCustomerSocialLoginResponse{}, nil
}
func (s *stubClient) LoginTenantUser(_ context.Context, _ *berberimv1.LoginTenantUserRequest, _ ...grpc.CallOption) (*berberimv1.LoginTenantUserResponse, error) {
	return &berberimv1.LoginTenantUserResponse{}, nil
}
func (s *stubClient) LoginPlatformUser(_ context.Context, _ *berberimv1.LoginPlatformUserRequest, _ ...grpc.CallOption) (*berberimv1.LoginPlatformUserResponse, error) {
	return &berberimv1.LoginPlatformUserResponse{}, nil
}
func (s *stubClient) RefreshToken(_ context.Context, _ *berberimv1.RefreshTokenRequest, _ ...grpc.CallOption) (*berberimv1.RefreshTokenResponse, error) {
	return &berberimv1.RefreshTokenResponse{}, nil
}
func (s *stubClient) Logout(_ context.Context, _ *berberimv1.LogoutRequest, _ ...grpc.CallOption) (*berberimv1.LogoutResponse, error) {
	return &berberimv1.LogoutResponse{}, nil
}
func (s *stubClient) LogoutAll(_ context.Context, _ *berberimv1.LogoutAllRequest, _ ...grpc.CallOption) (*berberimv1.LogoutAllResponse, error) {
	return &berberimv1.LogoutAllResponse{}, nil
}
func (s *stubClient) ListSessions(_ context.Context, _ *berberimv1.ListSessionsRequest, _ ...grpc.CallOption) (*berberimv1.ListSessionsResponse, error) {
	return &berberimv1.ListSessionsResponse{}, nil
}
func (s *stubClient) RevokeSession(_ context.Context, _ *berberimv1.RevokeSessionRequest, _ ...grpc.CallOption) (*berberimv1.RevokeSessionResponse, error) {
	return &berberimv1.RevokeSessionResponse{}, nil
}
func (s *stubClient) RegisterPushDevice(_ context.Context, _ *berberimv1.RegisterPushDeviceRequest, _ ...grpc.CallOption) (*berberimv1.RegisterPushDeviceResponse, error) {
	return &berberimv1.RegisterPushDeviceResponse{}, nil
}
func (s *stubClient) DeletePushDevice(_ context.Context, _ *berberimv1.DeletePushDeviceRequest, _ ...grpc.CallOption) (*berberimv1.DeletePushDeviceResponse, error) {
	return &berberimv1.DeletePushDeviceResponse{}, nil
}
func (s *stubClient) CreateTenant(_ context.Context, _ *berberimv1.CreateTenantRequest, _ ...grpc.CallOption) (*berberimv1.CreateTenantResponse, error) {
	return &berberimv1.CreateTenantResponse{}, nil
}
func (s *stubClient) ListTenants(_ context.Context, _ *berberimv1.ListTenantsRequest, _ ...grpc.CallOption) (*berberimv1.ListTenantsResponse, error) {
	return &berberimv1.ListTenantsResponse{}, nil
}
func (s *stubClient) GetTenant(_ context.Context, _ *berberimv1.GetTenantRequest, _ ...grpc.CallOption) (*berberimv1.GetTenantResponse, error) {
	return &berberimv1.GetTenantResponse{}, nil
}
func (s *stubClient) SetTenantStatus(_ context.Context, _ *berberimv1.SetTenantStatusRequest, _ ...grpc.CallOption) (*berberimv1.SetTenantStatusResponse, error) {
	return &berberimv1.SetTenantStatusResponse{}, nil
}
func (s *stubClient) CreateTenantUser(_ context.Context, _ *berberimv1.CreateTenantUserRequest, _ ...grpc.CallOption) (*berberimv1.CreateTenantUserResponse, error) {
	return &berberimv1.CreateTenantUserResponse{}, nil
}
func (s *stubClient) ListTenantUsers(_ context.Context, _ *berberimv1.ListTenantUsersRequest, _ ...grpc.CallOption) (*berberimv1.ListTenantUsersResponse, error) {
	return &berberimv1.ListTenantUsersResponse{}, nil
}
func (s *stubClient) DisableTenantUser(_ context.Context, _ *berberimv1.DisableTenantUserRequest, _ ...grpc.CallOption) (*berberimv1.DisableTenantUserResponse, error) {
	return &berberimv1.DisableTenantUserResponse{}, nil
}
func (s *stubClient) EnableTenantUser(_ context.Context, _ *berberimv1.EnableTenantUserRequest, _ ...grpc.CallOption) (*berberimv1.EnableTenantUserResponse, error) {
	return &berberimv1.EnableTenantUserResponse{}, nil
}
func (s *stubClient) GetTenantSettings(_ context.Context, _ *berberimv1.GetTenantSettingsRequest, _ ...grpc.CallOption) (*berberimv1.GetTenantSettingsResponse, error) {
	return &berberimv1.GetTenantSettingsResponse{}, nil
}
func (s *stubClient) UpdateTenantSettings(_ context.Context, _ *berberimv1.UpdateTenantSettingsRequest, _ ...grpc.CallOption) (*berberimv1.UpdateTenantSettingsResponse, error) {
	return &berberimv1.UpdateTenantSettingsResponse{}, nil
}
func (s *stubClient) GetNotificationSettings(_ context.Context, _ *berberimv1.GetNotificationSettingsRequest, _ ...grpc.CallOption) (*berberimv1.GetNotificationSettingsResponse, error) {
	return &berberimv1.GetNotificationSettingsResponse{}, nil
}
func (s *stubClient) UpdateNotificationSettings(_ context.Context, _ *berberimv1.UpdateNotificationSettingsRequest, _ ...grpc.CallOption) (*berberimv1.UpdateNotificationSettingsResponse, error) {
	return &berberimv1.UpdateNotificationSettingsResponse{}, nil
}
func (s *stubClient) ListCustomerNotifications(_ context.Context, _ *berberimv1.ListCustomerNotificationsRequest, _ ...grpc.CallOption) (*berberimv1.ListCustomerNotificationsResponse, error) {
	return &berberimv1.ListCustomerNotificationsResponse{}, nil
}
func (s *stubClient) MarkNotificationRead(_ context.Context, _ *berberimv1.MarkNotificationReadRequest, _ ...grpc.CallOption) (*berberimv1.MarkNotificationReadResponse, error) {
	return &berberimv1.MarkNotificationReadResponse{}, nil
}
func (s *stubClient) MarkAllNotificationsRead(_ context.Context, _ *berberimv1.MarkAllNotificationsReadRequest, _ ...grpc.CallOption) (*berberimv1.MarkAllNotificationsReadResponse, error) {
	return &berberimv1.MarkAllNotificationsReadResponse{}, nil
}
func (s *stubClient) GetUnreadNotificationCount(_ context.Context, _ *berberimv1.GetUnreadNotificationCountRequest, _ ...grpc.CallOption) (*berberimv1.GetUnreadNotificationCountResponse, error) {
	return &berberimv1.GetUnreadNotificationCountResponse{}, nil
}
func (s *stubClient) ListServices(_ context.Context, _ *berberimv1.ListServicesRequest, _ ...grpc.CallOption) (*berberimv1.ListServicesResponse, error) {
	return &berberimv1.ListServicesResponse{}, nil
}
func (s *stubClient) CreateService(_ context.Context, _ *berberimv1.CreateServiceRequest, _ ...grpc.CallOption) (*berberimv1.CreateServiceResponse, error) {
	return &berberimv1.CreateServiceResponse{}, nil
}
func (s *stubClient) UpdateService(_ context.Context, _ *berberimv1.UpdateServiceRequest, _ ...grpc.CallOption) (*berberimv1.UpdateServiceResponse, error) {
	return &berberimv1.UpdateServiceResponse{}, nil
}
func (s *stubClient) SearchAvailability(_ context.Context, _ *berberimv1.SearchAvailabilityRequest, _ ...grpc.CallOption) (*berberimv1.SearchAvailabilityResponse, error) {
	return &berberimv1.SearchAvailabilityResponse{}, nil
}
func (s *stubClient) GetSlotRecommendations(_ context.Context, _ *berberimv1.GetSlotRecommendationsRequest, _ ...grpc.CallOption) (*berberimv1.GetSlotRecommendationsResponse, error) {
	return &berberimv1.GetSlotRecommendationsResponse{}, nil
}
func (s *stubClient) CreateAppointment(_ context.Context, _ *berberimv1.CreateAppointmentRequest, _ ...grpc.CallOption) (*berberimv1.CreateAppointmentResponse, error) {
	return &berberimv1.CreateAppointmentResponse{}, nil
}
func (s *stubClient) GetAppointment(_ context.Context, _ *berberimv1.GetAppointmentRequest, _ ...grpc.CallOption) (*berberimv1.GetAppointmentResponse, error) {
	return &berberimv1.GetAppointmentResponse{}, nil
}
func (s *stubClient) ListAppointments(_ context.Context, _ *berberimv1.ListAppointmentsRequest, _ ...grpc.CallOption) (*berberimv1.ListAppointmentsResponse, error) {
	return &berberimv1.ListAppointmentsResponse{}, nil
}
func (s *stubClient) CancelAppointment(_ context.Context, _ *berberimv1.CancelAppointmentRequest, _ ...grpc.CallOption) (*berberimv1.CancelAppointmentResponse, error) {
	return &berberimv1.CancelAppointmentResponse{}, nil
}
func (s *stubClient) RescheduleAppointment(_ context.Context, _ *berberimv1.RescheduleAppointmentRequest, _ ...grpc.CallOption) (*berberimv1.RescheduleAppointmentResponse, error) {
	return &berberimv1.RescheduleAppointmentResponse{}, nil
}
func (s *stubClient) CompleteAppointment(_ context.Context, _ *berberimv1.CompleteAppointmentRequest, _ ...grpc.CallOption) (*berberimv1.CompleteAppointmentResponse, error) {
	return &berberimv1.CompleteAppointmentResponse{}, nil
}
func (s *stubClient) MarkNoShow(_ context.Context, _ *berberimv1.MarkNoShowRequest, _ ...grpc.CallOption) (*berberimv1.MarkNoShowResponse, error) {
	return &berberimv1.MarkNoShowResponse{}, nil
}
func (s *stubClient) MarkPaymentReceived(_ context.Context, _ *berberimv1.MarkPaymentReceivedRequest, _ ...grpc.CallOption) (*berberimv1.MarkPaymentReceivedResponse, error) {
	return &berberimv1.MarkPaymentReceivedResponse{}, nil
}
func (s *stubClient) GetLoyaltyBalance(_ context.Context, _ *berberimv1.GetLoyaltyBalanceRequest, _ ...grpc.CallOption) (*berberimv1.GetLoyaltyBalanceResponse, error) {
	return &berberimv1.GetLoyaltyBalanceResponse{}, nil
}

// ── New RPC stubs (added in route redesign) ───────────────────────────────────

func (s *stubClient) GetPublicBootstrap(_ context.Context, _ *berberimv1.GetPublicBootstrapRequest, _ ...grpc.CallOption) (*berberimv1.GetPublicBootstrapResponse, error) {
	return &berberimv1.GetPublicBootstrapResponse{}, nil
}
func (s *stubClient) GetPublicService(_ context.Context, _ *berberimv1.GetPublicServiceRequest, _ ...grpc.CallOption) (*berberimv1.GetPublicServiceResponse, error) {
	return &berberimv1.GetPublicServiceResponse{}, nil
}
func (s *stubClient) ListPublicStaff(_ context.Context, _ *berberimv1.ListPublicStaffRequest, _ ...grpc.CallOption) (*berberimv1.ListPublicStaffResponse, error) {
	return &berberimv1.ListPublicStaffResponse{}, nil
}
func (s *stubClient) GetPublicStaff(_ context.Context, _ *berberimv1.GetPublicStaffRequest, _ ...grpc.CallOption) (*berberimv1.GetPublicStaffResponse, error) {
	return &berberimv1.GetPublicStaffResponse{}, nil
}
func (s *stubClient) ListPublicStaffServices(_ context.Context, _ *berberimv1.ListPublicStaffServicesRequest, _ ...grpc.CallOption) (*berberimv1.ListPublicStaffServicesResponse, error) {
	return &berberimv1.ListPublicStaffServicesResponse{}, nil
}
func (s *stubClient) GetAvailabilityDays(_ context.Context, _ *berberimv1.GetAvailabilityDaysRequest, _ ...grpc.CallOption) (*berberimv1.GetAvailabilityDaysResponse, error) {
	return &berberimv1.GetAvailabilityDaysResponse{}, nil
}
func (s *stubClient) GetCustomerProfile(_ context.Context, _ *berberimv1.GetCustomerProfileRequest, _ ...grpc.CallOption) (*berberimv1.GetCustomerProfileResponse, error) {
	return &berberimv1.GetCustomerProfileResponse{}, nil
}
func (s *stubClient) UpdateCustomerProfile(_ context.Context, _ *berberimv1.UpdateCustomerProfileRequest, _ ...grpc.CallOption) (*berberimv1.UpdateCustomerProfileResponse, error) {
	return &berberimv1.UpdateCustomerProfileResponse{}, nil
}
func (s *stubClient) GetLoyaltyTransactions(_ context.Context, _ *berberimv1.GetLoyaltyTransactionsRequest, _ ...grpc.CallOption) (*berberimv1.GetLoyaltyTransactionsResponse, error) {
	return &berberimv1.GetLoyaltyTransactionsResponse{}, nil
}
func (s *stubClient) GetStaffProfile(_ context.Context, _ *berberimv1.GetStaffProfileRequest, _ ...grpc.CallOption) (*berberimv1.GetStaffProfileResponse, error) {
	return &berberimv1.GetStaffProfileResponse{}, nil
}
func (s *stubClient) GetStaffCalendar(_ context.Context, _ *berberimv1.GetStaffCalendarRequest, _ ...grpc.CallOption) (*berberimv1.GetStaffCalendarResponse, error) {
	return &berberimv1.GetStaffCalendarResponse{}, nil
}
func (s *stubClient) GetService(_ context.Context, _ *berberimv1.GetServiceRequest, _ ...grpc.CallOption) (*berberimv1.GetServiceResponse, error) {
	return &berberimv1.GetServiceResponse{}, nil
}
func (s *stubClient) DeleteService(_ context.Context, _ *berberimv1.DeleteServiceRequest, _ ...grpc.CallOption) (*berberimv1.DeleteServiceResponse, error) {
	return &berberimv1.DeleteServiceResponse{}, nil
}
func (s *stubClient) GetStaffMember(_ context.Context, _ *berberimv1.GetStaffMemberRequest, _ ...grpc.CallOption) (*berberimv1.GetStaffMemberResponse, error) {
	return &berberimv1.GetStaffMemberResponse{}, nil
}
func (s *stubClient) UpdateStaffMember(_ context.Context, _ *berberimv1.UpdateStaffMemberRequest, _ ...grpc.CallOption) (*berberimv1.UpdateStaffMemberResponse, error) {
	return &berberimv1.UpdateStaffMemberResponse{}, nil
}
func (s *stubClient) DeleteStaffMember(_ context.Context, _ *berberimv1.DeleteStaffMemberRequest, _ ...grpc.CallOption) (*berberimv1.DeleteStaffMemberResponse, error) {
	return &berberimv1.DeleteStaffMemberResponse{}, nil
}
func (s *stubClient) SetStaffStatus(_ context.Context, _ *berberimv1.SetStaffStatusRequest, _ ...grpc.CallOption) (*berberimv1.SetStaffStatusResponse, error) {
	return &berberimv1.SetStaffStatusResponse{}, nil
}
func (s *stubClient) GetStaffServices(_ context.Context, _ *berberimv1.GetStaffServicesRequest, _ ...grpc.CallOption) (*berberimv1.GetStaffServicesResponse, error) {
	return &berberimv1.GetStaffServicesResponse{}, nil
}
func (s *stubClient) SetStaffServices(_ context.Context, _ *berberimv1.SetStaffServicesRequest, _ ...grpc.CallOption) (*berberimv1.SetStaffServicesResponse, error) {
	return &berberimv1.SetStaffServicesResponse{}, nil
}
func (s *stubClient) ListScheduleRules(_ context.Context, _ *berberimv1.ListScheduleRulesRequest, _ ...grpc.CallOption) (*berberimv1.ListScheduleRulesResponse, error) {
	return &berberimv1.ListScheduleRulesResponse{}, nil
}
func (s *stubClient) CreateScheduleRule(_ context.Context, _ *berberimv1.CreateScheduleRuleRequest, _ ...grpc.CallOption) (*berberimv1.CreateScheduleRuleResponse, error) {
	return &berberimv1.CreateScheduleRuleResponse{}, nil
}
func (s *stubClient) UpdateScheduleRule(_ context.Context, _ *berberimv1.UpdateScheduleRuleRequest, _ ...grpc.CallOption) (*berberimv1.UpdateScheduleRuleResponse, error) {
	return &berberimv1.UpdateScheduleRuleResponse{}, nil
}
func (s *stubClient) DeleteScheduleRule(_ context.Context, _ *berberimv1.DeleteScheduleRuleRequest, _ ...grpc.CallOption) (*berberimv1.DeleteScheduleRuleResponse, error) {
	return &berberimv1.DeleteScheduleRuleResponse{}, nil
}
func (s *stubClient) ListTimeOffs(_ context.Context, _ *berberimv1.ListTimeOffsRequest, _ ...grpc.CallOption) (*berberimv1.ListTimeOffsResponse, error) {
	return &berberimv1.ListTimeOffsResponse{}, nil
}
func (s *stubClient) CreateTimeOff(_ context.Context, _ *berberimv1.CreateTimeOffRequest, _ ...grpc.CallOption) (*berberimv1.CreateTimeOffResponse, error) {
	return &berberimv1.CreateTimeOffResponse{}, nil
}
func (s *stubClient) UpdateTimeOff(_ context.Context, _ *berberimv1.UpdateTimeOffRequest, _ ...grpc.CallOption) (*berberimv1.UpdateTimeOffResponse, error) {
	return &berberimv1.UpdateTimeOffResponse{}, nil
}
func (s *stubClient) DeleteTimeOff(_ context.Context, _ *berberimv1.DeleteTimeOffRequest, _ ...grpc.CallOption) (*berberimv1.DeleteTimeOffResponse, error) {
	return &berberimv1.DeleteTimeOffResponse{}, nil
}
func (s *stubClient) ListAdminCustomers(_ context.Context, _ *berberimv1.ListCustomersRequest, _ ...grpc.CallOption) (*berberimv1.ListCustomersResponse, error) {
	return &berberimv1.ListCustomersResponse{}, nil
}
func (s *stubClient) CreateCustomer(_ context.Context, _ *berberimv1.CreateCustomerRequest, _ ...grpc.CallOption) (*berberimv1.CreateCustomerResponse, error) {
	return &berberimv1.CreateCustomerResponse{}, nil
}
func (s *stubClient) GetAdminCustomer(_ context.Context, _ *berberimv1.GetAdminCustomerRequest, _ ...grpc.CallOption) (*berberimv1.GetAdminCustomerResponse, error) {
	return &berberimv1.GetAdminCustomerResponse{}, nil
}
func (s *stubClient) UpdateCustomer(_ context.Context, _ *berberimv1.UpdateCustomerRequest, _ ...grpc.CallOption) (*berberimv1.UpdateCustomerResponse, error) {
	return &berberimv1.UpdateCustomerResponse{}, nil
}
func (s *stubClient) SetCustomerStatus(_ context.Context, _ *berberimv1.SetCustomerStatusRequest, _ ...grpc.CallOption) (*berberimv1.SetCustomerStatusResponse, error) {
	return &berberimv1.SetCustomerStatusResponse{}, nil
}
func (s *stubClient) GetLoyaltySettings(_ context.Context, _ *berberimv1.GetLoyaltySettingsRequest, _ ...grpc.CallOption) (*berberimv1.GetLoyaltySettingsResponse, error) {
	return &berberimv1.GetLoyaltySettingsResponse{}, nil
}
func (s *stubClient) UpdateLoyaltySettings(_ context.Context, _ *berberimv1.UpdateLoyaltySettingsRequest, _ ...grpc.CallOption) (*berberimv1.UpdateLoyaltySettingsResponse, error) {
	return &berberimv1.UpdateLoyaltySettingsResponse{}, nil
}
func (s *stubClient) ListRewards(_ context.Context, _ *berberimv1.ListRewardsRequest, _ ...grpc.CallOption) (*berberimv1.ListRewardsResponse, error) {
	return &berberimv1.ListRewardsResponse{}, nil
}
func (s *stubClient) CreateReward(_ context.Context, _ *berberimv1.CreateRewardRequest, _ ...grpc.CallOption) (*berberimv1.CreateRewardResponse, error) {
	return &berberimv1.CreateRewardResponse{}, nil
}
func (s *stubClient) GetReward(_ context.Context, _ *berberimv1.GetRewardRequest, _ ...grpc.CallOption) (*berberimv1.GetRewardResponse, error) {
	return &berberimv1.GetRewardResponse{}, nil
}
func (s *stubClient) UpdateReward(_ context.Context, _ *berberimv1.UpdateRewardRequest, _ ...grpc.CallOption) (*berberimv1.UpdateRewardResponse, error) {
	return &berberimv1.UpdateRewardResponse{}, nil
}
func (s *stubClient) DeleteReward(_ context.Context, _ *berberimv1.DeleteRewardRequest, _ ...grpc.CallOption) (*berberimv1.DeleteRewardResponse, error) {
	return &berberimv1.DeleteRewardResponse{}, nil
}
func (s *stubClient) SetRewardStatus(_ context.Context, _ *berberimv1.SetRewardStatusRequest, _ ...grpc.CallOption) (*berberimv1.SetRewardStatusResponse, error) {
	return &berberimv1.SetRewardStatusResponse{}, nil
}
func (s *stubClient) GetAnalyticsOverview(_ context.Context, _ *berberimv1.GetAnalyticsOverviewRequest, _ ...grpc.CallOption) (*berberimv1.GetAnalyticsOverviewResponse, error) {
	return &berberimv1.GetAnalyticsOverviewResponse{}, nil
}
func (s *stubClient) GetCohortAnalysis(_ context.Context, _ *berberimv1.GetCohortAnalysisRequest, _ ...grpc.CallOption) (*berberimv1.GetCohortAnalysisResponse, error) {
	return &berberimv1.GetCohortAnalysisResponse{}, nil
}
func (s *stubClient) GetRetentionAnalysis(_ context.Context, _ *berberimv1.GetRetentionAnalysisRequest, _ ...grpc.CallOption) (*berberimv1.GetRetentionAnalysisResponse, error) {
	return &berberimv1.GetRetentionAnalysisResponse{}, nil
}
func (s *stubClient) GetCustomerLTV(_ context.Context, _ *berberimv1.GetCustomerLTVRequest, _ ...grpc.CallOption) (*berberimv1.GetCustomerLTVResponse, error) {
	return &berberimv1.GetCustomerLTVResponse{}, nil
}
func (s *stubClient) GetNoShowAnalysis(_ context.Context, _ *berberimv1.GetNoShowAnalysisRequest, _ ...grpc.CallOption) (*berberimv1.GetNoShowAnalysisResponse, error) {
	return &berberimv1.GetNoShowAnalysisResponse{}, nil
}

// ── Staff Review stubs ───────────────────────────────────────────────────────

func (s *stubClient) CreateStaffReview(_ context.Context, _ *berberimv1.CreateStaffReviewRequest, _ ...grpc.CallOption) (*berberimv1.CreateStaffReviewResponse, error) {
	return &berberimv1.CreateStaffReviewResponse{}, nil
}
func (s *stubClient) UpdateStaffReview(_ context.Context, _ *berberimv1.UpdateStaffReviewRequest, _ ...grpc.CallOption) (*berberimv1.UpdateStaffReviewResponse, error) {
	return &berberimv1.UpdateStaffReviewResponse{}, nil
}
func (s *stubClient) DeleteStaffReview(_ context.Context, _ *berberimv1.DeleteStaffReviewRequest, _ ...grpc.CallOption) (*berberimv1.DeleteStaffReviewResponse, error) {
	return &berberimv1.DeleteStaffReviewResponse{}, nil
}
func (s *stubClient) ListStaffReviews(_ context.Context, _ *berberimv1.ListStaffReviewsRequest, _ ...grpc.CallOption) (*berberimv1.ListStaffReviewsResponse, error) {
	return &berberimv1.ListStaffReviewsResponse{}, nil
}
func (s *stubClient) GetMyReviewForAppointment(_ context.Context, _ *berberimv1.GetMyReviewForAppointmentRequest, _ ...grpc.CallOption) (*berberimv1.GetMyReviewForAppointmentResponse, error) {
	return &berberimv1.GetMyReviewForAppointmentResponse{}, nil
}

func (s *stubClient) UpdateTenant(_ context.Context, _ *berberimv1.UpdateTenantRequest, _ ...grpc.CallOption) (*berberimv1.UpdateTenantResponse, error) {
	return &berberimv1.UpdateTenantResponse{}, nil
}
func (s *stubClient) FreezeTenant(_ context.Context, _ *berberimv1.FreezeTenantRequest, _ ...grpc.CallOption) (*berberimv1.FreezeTenantResponse, error) {
	return &berberimv1.FreezeTenantResponse{}, nil
}
func (s *stubClient) ReactivateTenant(_ context.Context, _ *berberimv1.ReactivateTenantRequest, _ ...grpc.CallOption) (*berberimv1.ReactivateTenantResponse, error) {
	return &berberimv1.ReactivateTenantResponse{}, nil
}
func (s *stubClient) CancelTenantSubscription(_ context.Context, _ *berberimv1.CancelTenantSubscriptionRequest, _ ...grpc.CallOption) (*berberimv1.CancelTenantSubscriptionResponse, error) {
	return &berberimv1.CancelTenantSubscriptionResponse{}, nil
}
func (s *stubClient) ExtendTenantSubscription(_ context.Context, _ *berberimv1.ExtendTenantSubscriptionRequest, _ ...grpc.CallOption) (*berberimv1.ExtendTenantSubscriptionResponse, error) {
	return &berberimv1.ExtendTenantSubscriptionResponse{}, nil
}
func (s *stubClient) ListPlatformUsers(_ context.Context, _ *berberimv1.ListPlatformUsersRequest, _ ...grpc.CallOption) (*berberimv1.ListPlatformUsersResponse, error) {
	return &berberimv1.ListPlatformUsersResponse{}, nil
}
func (s *stubClient) CreatePlatformUser(_ context.Context, _ *berberimv1.CreatePlatformUserRequest, _ ...grpc.CallOption) (*berberimv1.CreatePlatformUserResponse, error) {
	return &berberimv1.CreatePlatformUserResponse{}, nil
}
func (s *stubClient) GetPlatformUser(_ context.Context, _ *berberimv1.GetPlatformUserRequest, _ ...grpc.CallOption) (*berberimv1.GetPlatformUserResponse, error) {
	return &berberimv1.GetPlatformUserResponse{}, nil
}
func (s *stubClient) UpdatePlatformUser(_ context.Context, _ *berberimv1.UpdatePlatformUserRequest, _ ...grpc.CallOption) (*berberimv1.UpdatePlatformUserResponse, error) {
	return &berberimv1.UpdatePlatformUserResponse{}, nil
}
func (s *stubClient) DeletePlatformUser(_ context.Context, _ *berberimv1.DeletePlatformUserRequest, _ ...grpc.CallOption) (*berberimv1.DeletePlatformUserResponse, error) {
	return &berberimv1.DeletePlatformUserResponse{}, nil
}
func (s *stubClient) GetTenantBranding(_ context.Context, _ *berberimv1.GetTenantBrandingRequest, _ ...grpc.CallOption) (*berberimv1.GetTenantBrandingResponse, error) {
	return &berberimv1.GetTenantBrandingResponse{}, nil
}
func (s *stubClient) ListCustomers(_ context.Context, _ *berberimv1.ListCustomersRequest, _ ...grpc.CallOption) (*berberimv1.ListCustomersResponse, error) {
	return &berberimv1.ListCustomersResponse{}, nil
}
func (s *stubClient) UpdateTenantBranding(_ context.Context, _ *berberimv1.UpdateTenantBrandingRequest, _ ...grpc.CallOption) (*berberimv1.UpdateTenantBrandingResponse, error) {
	return &berberimv1.UpdateTenantBrandingResponse{}, nil
}

func (s *stubClient) GetBookingLimitStatus(_ context.Context, _ *berberimv1.GetBookingLimitStatusRequest, _ ...grpc.CallOption) (*berberimv1.GetBookingLimitStatusResponse, error) {
	return &berberimv1.GetBookingLimitStatusResponse{}, nil
}

// ── Fake JWT validator ────────────────────────────────────────────────────────

type fakeValidator struct {
	claims map[string]map[string]any
}

func (f *fakeValidator) Validate(_ context.Context, raw string) (map[string]any, error) {
	claims, ok := f.claims[raw]
	if !ok {
		return nil, security.ErrTokenInvalid
	}
	return claims, nil
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func newHandlers() *handler.Handlers {
	c := &stubClient{}
	return &handler.Handlers{
		Auth:     handler.NewAuthHandler(c),
		Public:   handler.NewPublicHandler(c),
		Customer: handler.NewCustomerHandler(c),
		Tenant:   handler.NewTenantHandler(c),
		Platform: handler.NewPlatformHandler(c),
	}
}

func buildRouter(t *testing.T) (*fakeValidator, func(method, path, token string) *httptest.ResponseRecorder) {
	t.Helper()
	fake := &fakeValidator{
		claims: map[string]map[string]any{
			"platform-token": {
				"sub":  "user-platform",
				"jti":  "session-platform",
				"type": "platform_user",
			},
			"tenant-token": {
				"sub":       "user-tenant",
				"jti":       "session-tenant",
				"type":      "tenant_user",
				"tenant_id": "a0000000-0000-0000-0000-000000000001",
				"role":      "admin",
			},
			"staff-token": {
				"sub":       "user-staff",
				"jti":       "session-staff",
				"type":      "tenant_user",
				"tenant_id": "a0000000-0000-0000-0000-000000000001",
				"role":      "staff",
			},
			"customer-token": {
				"sub":  "user-customer",
				"jti":  "session-customer",
				"type": "customer",
			},
			"customer-tenant-token": {
				"sub":       "user-customer-2",
				"jti":       "session-customer-2",
				"type":      "customer",
				"tenant_id": "a0000000-0000-0000-0000-000000000001",
			},
		},
	}
	cfg := &config.Config{APIGRPCAddr: "localhost:9091", Authz: config.AuthzConfig{}}
	e := NewRouter(cfg, newHandlers(), fake)

	do := func(method, path, token string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, strings.NewReader("{}"))
		req.Header.Set("Content-Type", "application/json")
		if token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		return rec
	}
	return fake, do
}

// ── Tests ─────────────────────────────────────────────────────────────────────

func TestRouter_Healthz(t *testing.T) {
	_, do := buildRouter(t)
	rec := do("GET", "/healthz", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}

func TestRouter_UnknownPath_404(t *testing.T) {
	_, do := buildRouter(t)
	rec := do("GET", "/unknown/path", "")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if body["error"] != "not_found" {
		t.Errorf("error = %v, want not_found", body["error"])
	}
}

func TestRouter_PublicAuthRoutes_NoJWTRequired(t *testing.T) {
	_, do := buildRouter(t)

	routes := []struct{ method, path string }{
		{"POST", "/api/v1/auth/customers/login"},
		{"POST", "/api/v1/auth/customers/login/verify"},
		{"POST", "/api/v1/auth/customers/login/social"},
		{"POST", "/api/v1/auth/tenant/login"},
		{"POST", "/api/v1/auth/platform/login"},
		{"POST", "/api/v1/auth/refresh"},
		{"POST", "/api/v1/auth/logout"},
	}
	for _, r := range routes {
		t.Run(r.method+" "+r.path, func(t *testing.T) {
			rec := do(r.method, r.path, "")
			if rec.Code == http.StatusUnauthorized || rec.Code == http.StatusForbidden {
				t.Errorf("status = %d; auth routes must not require JWT", rec.Code)
			}
		})
	}
}

func TestRouter_PublicCatalog_NoJWTRequired(t *testing.T) {
	_, do := buildRouter(t)

	routes := []struct{ method, path string }{
		{"GET", "/api/v1/public/tenants/some-id/bootstrap"},
		{"GET", "/api/v1/public/services?tenant_id=some-id"},
		{"GET", "/api/v1/public/staff?tenant_id=some-id"},
		{"POST", "/api/v1/public/availability/search"},
		{"GET", "/api/v1/public/availability/days?tenant_id=some-id"},
	}
	for _, r := range routes {
		t.Run(r.method+" "+r.path, func(t *testing.T) {
			rec := do(r.method, r.path, "")
			if rec.Code == http.StatusUnauthorized || rec.Code == http.StatusForbidden {
				t.Errorf("status = %d; public routes must not require JWT", rec.Code)
			}
		})
	}
}

func TestRouter_PlatformRoutes_RequireJWT(t *testing.T) {
	_, do := buildRouter(t)

	t.Run("no token returns 401", func(t *testing.T) {
		rec := do("GET", "/api/v1/platform/tenants", "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", rec.Code)
		}
	})

	t.Run("invalid token returns 401", func(t *testing.T) {
		rec := do("GET", "/api/v1/platform/tenants", "bad-token")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", rec.Code)
		}
	})

	t.Run("wrong token type returns 403", func(t *testing.T) {
		rec := do("GET", "/api/v1/platform/tenants", "tenant-token")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want 403", rec.Code)
		}
	})

	t.Run("customer token returns 403", func(t *testing.T) {
		rec := do("GET", "/api/v1/platform/tenants", "customer-token")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want 403", rec.Code)
		}
	})

	t.Run("platform_user token passes", func(t *testing.T) {
		rec := do("GET", "/api/v1/platform/tenants", "platform-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
}

func TestRouter_SessionRoutes_RequireJWT(t *testing.T) {
	_, do := buildRouter(t)

	t.Run("logout-all without token returns 401", func(t *testing.T) {
		rec := do("POST", "/api/v1/auth/logout-all", "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", rec.Code)
		}
	})

	t.Run("list sessions without token returns 401", func(t *testing.T) {
		rec := do("GET", "/api/v1/auth/sessions", "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", rec.Code)
		}
	})

	t.Run("logout-all with valid token passes", func(t *testing.T) {
		rec := do("POST", "/api/v1/auth/logout-all", "customer-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})

	t.Run("revoke session with valid token passes", func(t *testing.T) {
		rec := do("DELETE", "/api/v1/auth/sessions/some-session-id", "tenant-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
}

func TestRouter_PlatformRoutes_AllMethods(t *testing.T) {
	_, do := buildRouter(t)

	routes := []struct{ method, path string }{
		{"POST", "/api/v1/platform/tenants"},
		{"GET", "/api/v1/platform/tenants"},
		{"GET", "/api/v1/platform/tenants/some-id"},
		{"POST", "/api/v1/platform/tenants/some-id/freeze"},
		{"POST", "/api/v1/platform/tenants/some-id/reactivate"},
		{"POST", "/api/v1/platform/tenants/some-id/cancel-subscription"},
		{"POST", "/api/v1/platform/tenants/some-id/extend-subscription"},
		{"POST", "/api/v1/platform/tenants/some-id/users"},
		{"GET", "/api/v1/platform/tenants/some-id/users"},
		{"PUT", "/api/v1/platform/tenants/some-id/users/user-id/disable"},
		{"PUT", "/api/v1/platform/tenants/some-id/users/user-id/enable"},
		{"GET", "/api/v1/platform/users"},
		{"POST", "/api/v1/platform/users"},
		{"GET", "/api/v1/platform/users/some-id"},
	}
	for _, r := range routes {
		t.Run(r.method+" "+r.path, func(t *testing.T) {
			rec := do(r.method, r.path, "platform-token")
			if rec.Code == http.StatusNotFound || rec.Code == http.StatusForbidden || rec.Code == http.StatusUnauthorized {
				t.Errorf("status = %d; platform route with valid token should reach handler", rec.Code)
			}
		})
	}
}

func TestRouter_TenantRoutes_RequireTokenType(t *testing.T) {
	_, do := buildRouter(t)

	t.Run("no token returns 401", func(t *testing.T) {
		rec := do("GET", "/api/v1/tenant/appointments", "")
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("status = %d, want 401", rec.Code)
		}
	})

	t.Run("customer token returns 403", func(t *testing.T) {
		rec := do("GET", "/api/v1/tenant/appointments", "customer-token")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want 403", rec.Code)
		}
	})

	t.Run("admin-role tenant_user token passes", func(t *testing.T) {
		rec := do("GET", "/api/v1/tenant/appointments", "tenant-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})

	t.Run("staff-role tenant_user token passes", func(t *testing.T) {
		rec := do("GET", "/api/v1/tenant/appointments", "staff-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
}

func TestRouter_TenantAdminRoutes_RequireAdminRole(t *testing.T) {
	_, do := buildRouter(t)

	adminOnly := []struct{ method, path string }{
		{"GET", "/api/v1/tenant/settings"},
		{"PATCH", "/api/v1/tenant/settings"},
		{"POST", "/api/v1/tenant/services"},
		{"PATCH", "/api/v1/tenant/services/some-id"},
		{"DELETE", "/api/v1/tenant/services/some-id"},
		{"POST", "/api/v1/tenant/staff"},
		{"PATCH", "/api/v1/tenant/staff/some-id"},
		{"DELETE", "/api/v1/tenant/staff/some-id"},
		{"PATCH", "/api/v1/tenant/staff/some-id/status"},
		{"GET", "/api/v1/tenant/loyalty/settings"},
		{"PATCH", "/api/v1/tenant/loyalty/settings"},
		{"POST", "/api/v1/tenant/rewards"},
		{"PATCH", "/api/v1/tenant/rewards/some-id"},
		{"DELETE", "/api/v1/tenant/rewards/some-id"},
		{"PATCH", "/api/v1/tenant/rewards/some-id/status"},
		{"GET", "/api/v1/tenant/analytics/overview"},
		{"GET", "/api/v1/tenant/analytics/cohorts"},
		{"GET", "/api/v1/tenant/analytics/retention"},
		{"GET", "/api/v1/tenant/analytics/ltv"},
		{"GET", "/api/v1/tenant/analytics/no-shows"},
		{"POST", "/api/v1/tenant/customers"},
		{"PATCH", "/api/v1/tenant/customers/some-id"},
		{"PATCH", "/api/v1/tenant/customers/some-id/status"},
	}

	for _, r := range adminOnly {
		t.Run("staff blocked: "+r.method+" "+r.path, func(t *testing.T) {
			rec := do(r.method, r.path, "staff-token")
			if rec.Code != http.StatusForbidden {
				t.Errorf("status = %d, want 403 — staff must not access admin-only route", rec.Code)
			}
		})
		t.Run("admin passes: "+r.method+" "+r.path, func(t *testing.T) {
			rec := do(r.method, r.path, "tenant-token")
			if rec.Code == http.StatusForbidden || rec.Code == http.StatusUnauthorized || rec.Code == http.StatusNotFound {
				t.Errorf("status = %d; admin must reach handler on admin-only route", rec.Code)
			}
		})
	}
}

func TestRouter_CustomerRoutes_RequireTenantFromJWT(t *testing.T) {
	_, do := buildRouter(t)

	t.Run("customer token without tenant_id returns 403", func(t *testing.T) {
		rec := do("GET", "/api/v1/customer/me", "customer-token")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want 403", rec.Code)
		}
	})

	t.Run("customer token with tenant_id passes", func(t *testing.T) {
		rec := do("GET", "/api/v1/customer/me", "customer-tenant-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
}

func TestRouter_OldDomainAuthRoutes_Return404(t *testing.T) {
	_, do := buildRouter(t)

	removed := []struct{ method, path string }{
		{"POST", "/api/v1/auth/customers/refresh"},
		{"POST", "/api/v1/auth/customers/logout"},
		{"POST", "/api/v1/auth/tenant/refresh"},
		{"POST", "/api/v1/auth/tenant/logout"},
		{"POST", "/api/v1/auth/tenant/logout-all"},
		{"GET", "/api/v1/auth/tenant/sessions"},
		{"DELETE", "/api/v1/auth/tenant/sessions/some-id"},
		{"POST", "/api/v1/auth/platform/refresh"},
		{"POST", "/api/v1/auth/platform/logout"},
		{"POST", "/api/v1/auth/platform/logout-all"},
		{"GET", "/api/v1/auth/platform/sessions"},
		{"DELETE", "/api/v1/auth/platform/sessions/some-id"},
	}
	for _, r := range removed {
		t.Run(r.method+" "+r.path, func(t *testing.T) {
			rec := do(r.method, r.path, "platform-token")
			if rec.Code != http.StatusNotFound {
				t.Errorf("status = %d, want 404 — old route should be removed", rec.Code)
			}
		})
	}
}
