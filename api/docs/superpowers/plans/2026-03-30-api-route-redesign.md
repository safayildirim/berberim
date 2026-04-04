# API Route Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure all HTTP routes in the gateway to match the new surface-based path convention, split auth into per-surface groups, rename `/tenant/` → `/admin/`, add a `/public/` surface, and stub all new RPC endpoints so the full intended API surface is wired end-to-end.

**Architecture:** The gateway exposes five surfaces (`public`, `customer`, `staff`, `admin`, `platform`) each with their own auth group and path prefix. New proto RPCs are added as typed stubs; they return `codes.Unimplemented` automatically via the embedded `UnimplementedBerberimAPIServer` on the backend until business logic is built. No existing business logic changes.

**Tech Stack:** Go, gRPC/protobuf (buf), Echo v5, PostgreSQL (no DB changes in this plan)

---

## Scope Note

This plan covers two independent concerns that should be separate sub-projects but are batched here because they share a proto regeneration step:

- **A) Route restructuring** — rename paths, split auth surfaces, new `/public/` group
- **B) New stub RPCs** — scaffold the full intended surface so clients can code against stable URLs

Campaigns, notifications, and analytics are stubbed in the gateway but excluded from the proto (no backend domain exists). They will return 404 until a future plan adds them.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `api/proto/v1/api.proto` | Modify | Add ~45 new RPCs + messages |
| `api/api/v1/api.pb.go` | Auto-generated | Run `make generate` |
| `api/api/v1/api_grpc.pb.go` | Auto-generated | Run `make generate` |
| `api-gateway/internal/handler/handler.go` | Modify | Add Public field to Handlers struct |
| `api-gateway/internal/handler/public.go` | Create | All `/api/v1/public/*` routes |
| `api-gateway/internal/handler/auth.go` | Modify | Remove old route comments; methods reused by new surfaces |
| `api-gateway/internal/handler/admin.go` | Create | Rename of `tenant_admin.go` + expanded admin routes |
| `api-gateway/internal/handler/tenant_admin.go` | Delete | Replaced by admin.go |
| `api-gateway/internal/handler/staff.go` | Modify | Add profile, calendar stubs |
| `api-gateway/internal/handler/customer.go` | Modify | Add profile, loyalty transactions stubs |
| `api-gateway/internal/handler/platform.go` | Modify | Add freeze/reactivate, platform users |
| `api-gateway/internal/server.go` | Rewrite | New route groups matching spec |
| `api-gateway/internal/gateway_test.go` | Modify | Update for new route structure |

---

## Task 1: Add new proto RPCs and regenerate

**Files:**
- Modify: `api/proto/v1/api.proto`
- Verify: `api/api/v1/api_grpc.pb.go` (auto-generated)

- [ ] **Step 1: Add new RPCs to the service block**

Open `api/proto/v1/api.proto`. After the existing `GetLoyaltyBalance` RPC (line 64), add:

```proto
  // ── Public: bootstrap ─────────────────────────────────────────────────────
  rpc GetPublicBootstrap(GetPublicBootstrapRequest) returns (GetPublicBootstrapResponse);

  // ── Public: catalog ───────────────────────────────────────────────────────
  rpc GetPublicService(GetPublicServiceRequest) returns (GetPublicServiceResponse);
  rpc ListPublicStaff(ListPublicStaffRequest) returns (ListPublicStaffResponse);
  rpc GetPublicStaff(GetPublicStaffRequest) returns (GetPublicStaffResponse);
  rpc ListPublicStaffServices(ListPublicStaffServicesRequest) returns (ListPublicStaffServicesResponse);
  rpc GetAvailabilityDays(GetAvailabilityDaysRequest) returns (GetAvailabilityDaysResponse);

  // ── Customer profile ──────────────────────────────────────────────────────
  rpc GetCustomerProfile(GetCustomerProfileRequest) returns (GetCustomerProfileResponse);
  rpc UpdateCustomerProfile(UpdateCustomerProfileRequest) returns (UpdateCustomerProfileResponse);
  rpc GetLoyaltyTransactions(GetLoyaltyTransactionsRequest) returns (GetLoyaltyTransactionsResponse);

  // ── Staff profile & calendar ──────────────────────────────────────────────
  rpc GetStaffProfile(GetStaffProfileRequest) returns (GetStaffProfileResponse);
  rpc GetStaffCalendar(GetStaffCalendarRequest) returns (GetStaffCalendarResponse);

  // ── Admin: services ───────────────────────────────────────────────────────
  rpc GetService(GetServiceRequest) returns (GetServiceResponse);
  rpc DeleteService(DeleteServiceRequest) returns (DeleteServiceResponse);

  // ── Admin: staff management ───────────────────────────────────────────────
  rpc GetStaffMember(GetStaffMemberRequest) returns (GetStaffMemberResponse);
  rpc UpdateStaffMember(UpdateStaffMemberRequest) returns (UpdateStaffMemberResponse);
  rpc DeleteStaffMember(DeleteStaffMemberRequest) returns (DeleteStaffMemberResponse);
  rpc SetStaffStatus(SetStaffStatusRequest) returns (SetStaffStatusResponse);
  rpc GetStaffServices(GetStaffServicesRequest) returns (GetStaffServicesResponse);
  rpc SetStaffServices(SetStaffServicesRequest) returns (SetStaffServicesResponse);
  rpc ListScheduleRules(ListScheduleRulesRequest) returns (ListScheduleRulesResponse);
  rpc CreateScheduleRule(CreateScheduleRuleRequest) returns (CreateScheduleRuleResponse);
  rpc UpdateScheduleRule(UpdateScheduleRuleRequest) returns (UpdateScheduleRuleResponse);
  rpc DeleteScheduleRule(DeleteScheduleRuleRequest) returns (DeleteScheduleRuleResponse);
  rpc ListTimeOffs(ListTimeOffsRequest) returns (ListTimeOffsResponse);
  rpc CreateTimeOff(CreateTimeOffRequest) returns (CreateTimeOffResponse);
  rpc UpdateTimeOff(UpdateTimeOffRequest) returns (UpdateTimeOffResponse);
  rpc DeleteTimeOff(DeleteTimeOffRequest) returns (DeleteTimeOffResponse);

  // ── Admin: customer management ────────────────────────────────────────────
  rpc ListAdminCustomers(ListAdminCustomersRequest) returns (ListAdminCustomersResponse);
  rpc CreateCustomer(CreateCustomerRequest) returns (CreateCustomerResponse);
  rpc GetAdminCustomer(GetAdminCustomerRequest) returns (GetAdminCustomerResponse);
  rpc UpdateCustomer(UpdateCustomerRequest) returns (UpdateCustomerResponse);
  rpc SetCustomerStatus(SetCustomerStatusRequest) returns (SetCustomerStatusResponse);

  // ── Admin: loyalty settings ───────────────────────────────────────────────
  rpc GetLoyaltySettings(GetLoyaltySettingsRequest) returns (GetLoyaltySettingsResponse);
  rpc UpdateLoyaltySettings(UpdateLoyaltySettingsRequest) returns (UpdateLoyaltySettingsResponse);

  // ── Admin: rewards ────────────────────────────────────────────────────────
  rpc ListRewards(ListRewardsRequest) returns (ListRewardsResponse);
  rpc CreateReward(CreateRewardRequest) returns (CreateRewardResponse);
  rpc GetReward(GetRewardRequest) returns (GetRewardResponse);
  rpc UpdateReward(UpdateRewardRequest) returns (UpdateRewardResponse);
  rpc DeleteReward(DeleteRewardRequest) returns (DeleteRewardResponse);
  rpc SetRewardStatus(SetRewardStatusRequest) returns (SetRewardStatusResponse);

  // ── Admin: analytics ──────────────────────────────────────────────────────
  rpc GetAnalyticsOverview(GetAnalyticsOverviewRequest) returns (GetAnalyticsOverviewResponse);

  // ── Platform: tenant lifecycle ────────────────────────────────────────────
  rpc UpdateTenant(UpdateTenantRequest) returns (UpdateTenantResponse);
  rpc FreezeTenant(FreezeTenantRequest) returns (FreezeTenantResponse);
  rpc ReactivateTenant(ReactivateTenantRequest) returns (ReactivateTenantResponse);
  rpc CancelTenantSubscription(CancelTenantSubscriptionRequest) returns (CancelTenantSubscriptionResponse);
  rpc ExtendTenantSubscription(ExtendTenantSubscriptionRequest) returns (ExtendTenantSubscriptionResponse);

  // ── Platform: platform users ──────────────────────────────────────────────
  rpc ListPlatformUsers(ListPlatformUsersRequest) returns (ListPlatformUsersResponse);
  rpc CreatePlatformUser(CreatePlatformUserRequest) returns (CreatePlatformUserResponse);
  rpc GetPlatformUser(GetPlatformUserRequest) returns (GetPlatformUserResponse);
  rpc UpdatePlatformUser(UpdatePlatformUserRequest) returns (UpdatePlatformUserResponse);
  rpc DeletePlatformUser(DeletePlatformUserRequest) returns (DeletePlatformUserResponse);
```

- [ ] **Step 2: Append new message types at the end of api.proto**

Add the following at the end of the file (after the existing `GetLoyaltyBalanceResponse` message):

```proto
// ── Public: bootstrap ─────────────────────────────────────────────────────────

message PublicBootstrap {
  string tenant_id = 1;
  string name = 2;
  string slug = 3;
  string logo_url = 4;
  string primary_color = 5;
  string timezone = 6;
  TenantSettingsData settings = 7;
}

message GetPublicBootstrapRequest {
  string tenant_id = 1;
}

message GetPublicBootstrapResponse {
  PublicBootstrap bootstrap = 1;
}

// ── Public: catalog ───────────────────────────────────────────────────────────

message GetPublicServiceRequest {
  string tenant_id = 1;
  string service_id = 2;
}

message GetPublicServiceResponse {
  Service service = 1;
}

message PublicStaffMember {
  string id = 1;
  string first_name = 2;
  string last_name = 3;
}

message ListPublicStaffRequest {
  string tenant_id = 1;
}

message ListPublicStaffResponse {
  repeated PublicStaffMember staff = 1;
}

message GetPublicStaffRequest {
  string tenant_id = 1;
  string staff_id = 2;
}

message GetPublicStaffResponse {
  PublicStaffMember staff = 1;
}

message ListPublicStaffServicesRequest {
  string tenant_id = 1;
  string staff_id = 2;
}

message ListPublicStaffServicesResponse {
  repeated Service services = 1;
}

message GetAvailabilityDaysRequest {
  string tenant_id = 1;
  repeated string service_ids = 2;
  string staff_id = 3;
  // YYYY-MM-DD
  string from = 4;
  string to = 5;
}

message GetAvailabilityDaysResponse {
  // YYYY-MM-DD strings of days that have at least one available slot.
  repeated string available_dates = 1;
}

// ── Customer profile ──────────────────────────────────────────────────────────

message CustomerProfile {
  string id = 1;
  string phone_number = 2;
  string first_name = 3;
  string last_name = 4;
  string status = 5;
  string created_at = 6;
}

message GetCustomerProfileRequest {}

message GetCustomerProfileResponse {
  CustomerProfile profile = 1;
}

message UpdateCustomerProfileRequest {
  string first_name = 1;
  string last_name = 2;
}

message UpdateCustomerProfileResponse {
  CustomerProfile profile = 1;
}

message LoyaltyTransaction {
  string id = 1;
  // "earn" | "redeem" | "expire" | "adjust"
  string type = 2;
  int32 points = 3;
  int32 balance_after = 4;
  string reason = 5;
  string appointment_id = 6;
  string created_at = 7;
}

message GetLoyaltyTransactionsRequest {
  int32 page = 1;
  int32 page_size = 2;
}

message GetLoyaltyTransactionsResponse {
  repeated LoyaltyTransaction transactions = 1;
  int32 total = 2;
}

// ── Staff profile & calendar ──────────────────────────────────────────────────

message StaffProfile {
  string id = 1;
  string first_name = 2;
  string last_name = 3;
  string email = 4;
  string role = 5;
  string status = 6;
}

message GetStaffProfileRequest {}

message GetStaffProfileResponse {
  StaffProfile profile = 1;
}

message CalendarEntry {
  Appointment appointment = 1;
}

message GetStaffCalendarRequest {
  // YYYY-MM-DD; defaults to today if empty.
  string date = 1;
  // "daily" | "weekly"; defaults to "daily"
  string view = 2;
}

message GetStaffCalendarResponse {
  repeated CalendarEntry entries = 1;
}

// ── Admin: services ───────────────────────────────────────────────────────────

message GetServiceRequest {
  string service_id = 1;
}

message GetServiceResponse {
  Service service = 1;
}

message DeleteServiceRequest {
  string service_id = 1;
}

message DeleteServiceResponse {}

// ── Admin: staff management ───────────────────────────────────────────────────

message GetStaffMemberRequest {
  string staff_id = 1;
}

message GetStaffMemberResponse {
  TenantUser staff = 1;
}

message UpdateStaffMemberRequest {
  string staff_id = 1;
  string first_name = 2;
  string last_name = 3;
  string email = 4;
  // Leave empty to keep existing password.
  string password = 5;
}

message UpdateStaffMemberResponse {
  TenantUser staff = 1;
}

message DeleteStaffMemberRequest {
  string staff_id = 1;
}

message DeleteStaffMemberResponse {}

message SetStaffStatusRequest {
  string staff_id = 1;
  // "active" | "disabled"
  string status = 2;
}

message SetStaffStatusResponse {}

message StaffServiceAssignment {
  string service_id = 1;
  string service_name = 2;
  string custom_price = 3;
  bool is_active = 4;
}

message GetStaffServicesRequest {
  string staff_id = 1;
}

message GetStaffServicesResponse {
  repeated StaffServiceAssignment services = 1;
}

message SetStaffServicesRequest {
  string staff_id = 1;
  // Full replacement: service_ids to assign; existing assignments not in this list are removed.
  repeated string service_ids = 2;
}

message SetStaffServicesResponse {}

message ScheduleRule {
  string id = 1;
  // 0 = Sunday, 6 = Saturday
  int32 day_of_week = 2;
  // "HH:MM"
  string start_time = 3;
  string end_time = 4;
  int32 slot_interval_minutes = 5;
  bool is_working_day = 6;
}

message ListScheduleRulesRequest {
  string staff_id = 1;
}

message ListScheduleRulesResponse {
  repeated ScheduleRule rules = 1;
}

message CreateScheduleRuleRequest {
  string staff_id = 1;
  int32 day_of_week = 2;
  string start_time = 3;
  string end_time = 4;
  int32 slot_interval_minutes = 5;
  bool is_working_day = 6;
}

message CreateScheduleRuleResponse {
  ScheduleRule rule = 1;
}

message UpdateScheduleRuleRequest {
  string staff_id = 1;
  string rule_id = 2;
  string start_time = 3;
  string end_time = 4;
  int32 slot_interval_minutes = 5;
  bool is_working_day = 6;
}

message UpdateScheduleRuleResponse {
  ScheduleRule rule = 1;
}

message DeleteScheduleRuleRequest {
  string staff_id = 1;
  string rule_id = 2;
}

message DeleteScheduleRuleResponse {}

message TimeOff {
  string id = 1;
  string start_at = 2;
  string end_at = 3;
  string reason = 4;
  // "leave" | "holiday" | "closure"
  string type = 5;
}

message ListTimeOffsRequest {
  string staff_id = 1;
}

message ListTimeOffsResponse {
  repeated TimeOff time_offs = 1;
}

message CreateTimeOffRequest {
  string staff_id = 1;
  string start_at = 2;
  string end_at = 3;
  string reason = 4;
  string type = 5;
}

message CreateTimeOffResponse {
  TimeOff time_off = 1;
}

message UpdateTimeOffRequest {
  string staff_id = 1;
  string time_off_id = 2;
  string start_at = 3;
  string end_at = 4;
  string reason = 5;
}

message UpdateTimeOffResponse {
  TimeOff time_off = 1;
}

message DeleteTimeOffRequest {
  string staff_id = 1;
  string time_off_id = 2;
}

message DeleteTimeOffResponse {}

// ── Admin: customer management ────────────────────────────────────────────────

message AdminCustomer {
  string id = 1;
  string phone_number = 2;
  string first_name = 3;
  string last_name = 4;
  string status = 5;
  int32 total_completed_appointments = 6;
  string last_appointment_at = 7;
  string created_at = 8;
}

message ListAdminCustomersRequest {
  string status = 1;
  string search = 2;
  int32 page = 3;
  int32 page_size = 4;
}

message ListAdminCustomersResponse {
  repeated AdminCustomer customers = 1;
  int32 total = 2;
}

message CreateCustomerRequest {
  string phone_number = 1;
  string first_name = 2;
  string last_name = 3;
}

message CreateCustomerResponse {
  AdminCustomer customer = 1;
}

message GetAdminCustomerRequest {
  string customer_id = 1;
}

message GetAdminCustomerResponse {
  AdminCustomer customer = 1;
}

message UpdateCustomerRequest {
  string customer_id = 1;
  string first_name = 2;
  string last_name = 3;
}

message UpdateCustomerResponse {
  AdminCustomer customer = 1;
}

message SetCustomerStatusRequest {
  string customer_id = 1;
  // "active" | "disabled"
  string status = 2;
}

message SetCustomerStatusResponse {}

// ── Admin: loyalty settings ───────────────────────────────────────────────────

message LoyaltySettings {
  bool loyalty_enabled = 1;
  int32 points_expiration_days = 2;
}

message GetLoyaltySettingsRequest {}

message GetLoyaltySettingsResponse {
  LoyaltySettings settings = 1;
}

message UpdateLoyaltySettingsRequest {
  LoyaltySettings settings = 1;
}

message UpdateLoyaltySettingsResponse {
  LoyaltySettings settings = 1;
}

// ── Admin: rewards ────────────────────────────────────────────────────────────

message Reward {
  string id = 1;
  string title = 2;
  string description = 3;
  int32 points_cost = 4;
  bool is_active = 5;
  string created_at = 6;
  string updated_at = 7;
}

message ListRewardsRequest {
  bool active_only = 1;
}

message ListRewardsResponse {
  repeated Reward rewards = 1;
}

message CreateRewardRequest {
  string title = 1;
  string description = 2;
  int32 points_cost = 3;
}

message CreateRewardResponse {
  Reward reward = 1;
}

message GetRewardRequest {
  string reward_id = 1;
}

message GetRewardResponse {
  Reward reward = 1;
}

message UpdateRewardRequest {
  string reward_id = 1;
  string title = 2;
  string description = 3;
  int32 points_cost = 4;
}

message UpdateRewardResponse {
  Reward reward = 1;
}

message DeleteRewardRequest {
  string reward_id = 1;
}

message DeleteRewardResponse {}

message SetRewardStatusRequest {
  string reward_id = 1;
  bool is_active = 2;
}

message SetRewardStatusResponse {}

// ── Admin: analytics ──────────────────────────────────────────────────────────

message AnalyticsOverview {
  int32 total_appointments_today = 1;
  int32 total_appointments_this_month = 2;
  int32 total_customers = 3;
  int32 new_customers_this_month = 4;
  string total_revenue_this_month = 5;
}

message GetAnalyticsOverviewRequest {
  string from = 1;
  string to = 2;
}

message GetAnalyticsOverviewResponse {
  AnalyticsOverview overview = 1;
}

// ── Platform: tenant lifecycle ────────────────────────────────────────────────

message UpdateTenantRequest {
  string tenant_id = 1;
  string name = 2;
  string logo_url = 3;
  string primary_color = 4;
  string timezone = 5;
}

message UpdateTenantResponse {
  Tenant tenant = 1;
}

message FreezeTenantRequest {
  string tenant_id = 1;
}

message FreezeTenantResponse {}

message ReactivateTenantRequest {
  string tenant_id = 1;
}

message ReactivateTenantResponse {}

message CancelTenantSubscriptionRequest {
  string tenant_id = 1;
}

message CancelTenantSubscriptionResponse {}

message ExtendTenantSubscriptionRequest {
  string tenant_id = 1;
  // RFC3339 UTC timestamp.
  string new_ends_at = 2;
}

message ExtendTenantSubscriptionResponse {}

// ── Platform: platform users ──────────────────────────────────────────────────

message PlatformUser {
  string id = 1;
  string email = 2;
  string role = 3;
  string status = 4;
  string created_at = 5;
}

message ListPlatformUsersRequest {
  int32 page = 1;
  int32 page_size = 2;
}

message ListPlatformUsersResponse {
  repeated PlatformUser users = 1;
  int32 total = 2;
}

message CreatePlatformUserRequest {
  string email = 1;
  string password = 2;
  // "super_admin"
  string role = 3;
}

message CreatePlatformUserResponse {
  string user_id = 1;
}

message GetPlatformUserRequest {
  string user_id = 1;
}

message GetPlatformUserResponse {
  PlatformUser user = 1;
}

message UpdatePlatformUserRequest {
  string user_id = 1;
  string email = 2;
  // Leave empty to keep existing password.
  string password = 3;
}

message UpdatePlatformUserResponse {
  PlatformUser user = 1;
}

message DeletePlatformUserRequest {
  string user_id = 1;
}

message DeletePlatformUserResponse {}
```

- [ ] **Step 3: Regenerate proto code**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api
make generate
```

Expected: no errors; `api/api/v1/api.pb.go` and `api/api/v1/api_grpc.pb.go` are updated.

- [ ] **Step 4: Verify api backend compiles**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api
go build ./...
```

Expected: no output (success). The new RPCs return `codes.Unimplemented` automatically via `UnimplementedBerberimAPIServer` — no changes to `api/internal/api/handler.go` needed.

- [ ] **Step 5: Commit**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api
git add proto/v1/api.proto api/v1/
git commit -m "feat(proto): add new surface-specific RPCs for route redesign"
```

---

## Task 2: Gateway — update Handlers struct

**Files:**
- Modify: `api-gateway/internal/handler/handler.go`

- [ ] **Step 1: Add Public to Handlers struct**

Replace the `Handlers` struct in `handler.go`:

```go
// Handlers is the root struct that groups all domain-specific gateway handlers.
type Handlers struct {
	Auth        *AuthHandler
	Public      *PublicHandler
	Customer    *CustomerHandler
	Staff       *StaffHandler
	Admin       *AdminHandler
	Platform    *PlatformHandler
}
```

- [ ] **Step 2: Verify gateway compiles (will fail until admin.go and public.go exist)**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api-gateway
go build ./... 2>&1 | head -20
```

Expected: compile errors about `PublicHandler` and `AdminHandler` undefined. That's fine — we'll add them next.

---

## Task 3: Gateway — create handler/public.go

**Files:**
- Create: `api-gateway/internal/handler/public.go`

- [ ] **Step 1: Write the public handler**

Create `api-gateway/internal/handler/public.go`:

```go
package handler

import (
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

// GET /api/v1/public/bootstrap?tenant_id=
func (h *PublicHandler) GetBootstrap(c *echo.Context) error {
	req := &berberimv1.GetPublicBootstrapRequest{
		TenantId: c.QueryParam("tenant_id"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetPublicBootstrap(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/public/customer-auth/request-otp
func (h *PublicHandler) RequestOTP(c *echo.Context) error {
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

// POST /api/v1/public/customer-auth/verify-otp
func (h *PublicHandler) VerifyOTP(c *echo.Context) error {
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

// POST /api/v1/public/customer-auth/verify-social
func (h *PublicHandler) VerifySocialLogin(c *echo.Context) error {
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

// POST /api/v1/public/customer-auth/refresh
func (h *PublicHandler) RefreshToken(c *echo.Context) error {
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

// POST /api/v1/public/customer-auth/logout
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
```

- [ ] **Step 2: Verify public.go compiles in isolation**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api-gateway
go build ./internal/handler/... 2>&1
```

Expected: errors only about `AdminHandler` undefined in handler.go — not about public.go.

---

## Task 4: Gateway — create handler/admin.go (rename + expand)

**Files:**
- Create: `api-gateway/internal/handler/admin.go`
- Delete: `api-gateway/internal/handler/tenant_admin.go`

- [ ] **Step 1: Create admin.go with all admin routes**

Create `api-gateway/internal/handler/admin.go`:

```go
package handler

import (
	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/metadata"
)

// AdminHandler handles /api/v1/admin/* routes.
// All routes require: ValidateJWT + RequireTokenType("tenant_user") +
// RequireRole("admin") + RequireTenantFromJWT.
type AdminHandler struct {
	base
}

func NewAdminHandler(client berberimv1.BerberimAPIClient) *AdminHandler {
	return &AdminHandler{base{client: client}}
}

// ── Tenant settings ───────────────────────────────────────────────────────────

// GET /api/v1/admin/tenant/settings
func (h *AdminHandler) GetSettings(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetTenantSettings(ctx, &berberimv1.GetTenantSettingsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/tenant/settings
func (h *AdminHandler) UpdateSettings(c *echo.Context) error {
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

// ── Services catalog ──────────────────────────────────────────────────────────

// GET /api/v1/admin/services
func (h *AdminHandler) ListServices(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListServices(ctx, &berberimv1.ListServicesRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/services
func (h *AdminHandler) CreateService(c *echo.Context) error {
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

// GET /api/v1/admin/services/:id
func (h *AdminHandler) GetService(c *echo.Context) error {
	req := &berberimv1.GetServiceRequest{ServiceId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetService(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/services/:id
func (h *AdminHandler) UpdateService(c *echo.Context) error {
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

// DELETE /api/v1/admin/services/:id
func (h *AdminHandler) DeleteService(c *echo.Context) error {
	req := &berberimv1.DeleteServiceRequest{ServiceId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteService(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// ── Staff management ──────────────────────────────────────────────────────────

// GET /api/v1/admin/staff
func (h *AdminHandler) ListStaff(c *echo.Context) error {
	req := &berberimv1.ListTenantUsersRequest{Role: "staff"}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListTenantUsers(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/staff
func (h *AdminHandler) CreateStaff(c *echo.Context) error {
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

// GET /api/v1/admin/staff/:id
func (h *AdminHandler) GetStaff(c *echo.Context) error {
	req := &berberimv1.GetStaffMemberRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffMember(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/staff/:id
func (h *AdminHandler) UpdateStaff(c *echo.Context) error {
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

// DELETE /api/v1/admin/staff/:id
func (h *AdminHandler) DeleteStaff(c *echo.Context) error {
	req := &berberimv1.DeleteStaffMemberRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteStaffMember(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/staff/:id/status
func (h *AdminHandler) SetStaffStatus(c *echo.Context) error {
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

// GET /api/v1/admin/staff/:id/services
func (h *AdminHandler) GetStaffServices(c *echo.Context) error {
	req := &berberimv1.GetStaffServicesRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffServices(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PUT /api/v1/admin/staff/:id/services  (full replacement)
func (h *AdminHandler) SetStaffServices(c *echo.Context) error {
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

// ── Staff schedule rules ──────────────────────────────────────────────────────

// GET /api/v1/admin/staff/:id/schedule-rules
func (h *AdminHandler) ListScheduleRules(c *echo.Context) error {
	req := &berberimv1.ListScheduleRulesRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListScheduleRules(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/staff/:id/schedule-rules
func (h *AdminHandler) CreateScheduleRule(c *echo.Context) error {
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

// PATCH /api/v1/admin/staff/:id/schedule-rules/:ruleId
func (h *AdminHandler) UpdateScheduleRule(c *echo.Context) error {
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

// DELETE /api/v1/admin/staff/:id/schedule-rules/:ruleId
func (h *AdminHandler) DeleteScheduleRule(c *echo.Context) error {
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

// GET /api/v1/admin/staff/:id/time-offs
func (h *AdminHandler) ListTimeOffs(c *echo.Context) error {
	req := &berberimv1.ListTimeOffsRequest{StaffId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListTimeOffs(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/staff/:id/time-offs
func (h *AdminHandler) CreateTimeOff(c *echo.Context) error {
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

// PATCH /api/v1/admin/staff/:id/time-offs/:timeOffId
func (h *AdminHandler) UpdateTimeOff(c *echo.Context) error {
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

// DELETE /api/v1/admin/staff/:id/time-offs/:timeOffId
func (h *AdminHandler) DeleteTimeOff(c *echo.Context) error {
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

// GET /api/v1/admin/appointments
func (h *AdminHandler) ListAppointments(c *echo.Context) error {
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

// GET /api/v1/admin/appointments/:id
func (h *AdminHandler) GetAppointment(c *echo.Context) error {
	req := &berberimv1.GetAppointmentRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAppointment(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/appointments
func (h *AdminHandler) CreateAppointment(c *echo.Context) error {
	var req berberimv1.CreateAppointmentRequest
	if !bindBody(c, &req) {
		return nil
	}
	if req.CreatedVia == "" {
		req.CreatedVia = "admin_panel"
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CreateAppointment(ctx, &req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/appointments/:id/cancel
func (h *AdminHandler) CancelAppointment(c *echo.Context) error {
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

// POST /api/v1/admin/appointments/:id/complete
func (h *AdminHandler) CompleteAppointment(c *echo.Context) error {
	req := &berberimv1.CompleteAppointmentRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.CompleteAppointment(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/appointments/:id/mark-no-show
func (h *AdminHandler) MarkNoShow(c *echo.Context) error {
	req := &berberimv1.MarkNoShowRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.MarkNoShow(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/appointments/:id/mark-payment-received
func (h *AdminHandler) MarkPaymentReceived(c *echo.Context) error {
	req := &berberimv1.MarkPaymentReceivedRequest{AppointmentId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.MarkPaymentReceived(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/appointments/:id/reschedule
func (h *AdminHandler) RescheduleAppointment(c *echo.Context) error {
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

// POST /api/v1/admin/availability/search
func (h *AdminHandler) SearchAvailability(c *echo.Context) error {
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

// GET /api/v1/admin/customers
func (h *AdminHandler) ListCustomers(c *echo.Context) error {
	req := &berberimv1.ListAdminCustomersRequest{
		Status:   c.QueryParam("status"),
		Search:   c.QueryParam("search"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListAdminCustomers(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/customers
func (h *AdminHandler) CreateCustomer(c *echo.Context) error {
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

// GET /api/v1/admin/customers/:id
func (h *AdminHandler) GetCustomer(c *echo.Context) error {
	req := &berberimv1.GetAdminCustomerRequest{CustomerId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAdminCustomer(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/customers/:id
func (h *AdminHandler) UpdateCustomer(c *echo.Context) error {
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

// PATCH /api/v1/admin/customers/:id/status
func (h *AdminHandler) SetCustomerStatus(c *echo.Context) error {
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

// GET /api/v1/admin/customers/:id/appointments
func (h *AdminHandler) ListCustomerAppointments(c *echo.Context) error {
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

// GET /api/v1/admin/loyalty/settings
func (h *AdminHandler) GetLoyaltySettings(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetLoyaltySettings(ctx, &berberimv1.GetLoyaltySettingsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/loyalty/settings
func (h *AdminHandler) UpdateLoyaltySettings(c *echo.Context) error {
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

// GET /api/v1/admin/rewards
func (h *AdminHandler) ListRewards(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.ListRewards(ctx, &berberimv1.ListRewardsRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// POST /api/v1/admin/rewards
func (h *AdminHandler) CreateReward(c *echo.Context) error {
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

// GET /api/v1/admin/rewards/:id
func (h *AdminHandler) GetReward(c *echo.Context) error {
	req := &berberimv1.GetRewardRequest{RewardId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetReward(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/rewards/:id
func (h *AdminHandler) UpdateReward(c *echo.Context) error {
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

// DELETE /api/v1/admin/rewards/:id
func (h *AdminHandler) DeleteReward(c *echo.Context) error {
	req := &berberimv1.DeleteRewardRequest{RewardId: c.Param("id")}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.DeleteReward(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// PATCH /api/v1/admin/rewards/:id/status
func (h *AdminHandler) SetRewardStatus(c *echo.Context) error {
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

// GET /api/v1/admin/analytics/overview
func (h *AdminHandler) GetAnalyticsOverview(c *echo.Context) error {
	req := &berberimv1.GetAnalyticsOverviewRequest{
		From: c.QueryParam("from"),
		To:   c.QueryParam("to"),
	}
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetAnalyticsOverview(ctx, req)
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}
```

- [ ] **Step 2: Delete the old tenant_admin.go**

```bash
rm /Users/safayildirim/Desktop/repos/berberim/api-gateway/internal/handler/tenant_admin.go
```

- [ ] **Step 3: Verify handler package compiles**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api-gateway
go build ./internal/handler/... 2>&1
```

Expected: errors only about missing `AdminHandler` reference from handler.go (fixed in next step), OR clean compile if handler.go already has the field.

---

## Task 5: Gateway — update handler/staff.go

**Files:**
- Modify: `api-gateway/internal/handler/staff.go`

- [ ] **Step 1: Add profile and calendar methods to StaffHandler**

At the end of `staff.go`, add:

```go
// GET /api/v1/staff/me
func (h *StaffHandler) GetProfile(c *echo.Context) error {
	ctx := metadata.NewOutgoingContext(c.Request().Context(), withAuthMeta(c))
	resp, err := h.client.GetStaffProfile(ctx, &berberimv1.GetStaffProfileRequest{})
	if err != nil {
		return grpcErr(c, err)
	}
	return writeProto(c, resp)
}

// GET /api/v1/staff/calendar
func (h *StaffHandler) GetCalendar(c *echo.Context) error {
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
```

---

## Task 6: Gateway — update handler/customer.go

**Files:**
- Modify: `api-gateway/internal/handler/customer.go`

- [ ] **Step 1: Add profile and loyalty transaction methods**

At the end of `customer.go`, add:

```go
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
```

---

## Task 7: Gateway — update handler/platform.go

**Files:**
- Modify: `api-gateway/internal/handler/platform.go`

- [ ] **Step 1: Add tenant lifecycle and platform user routes**

At the end of `platform.go`, add:

```go
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
```

---

## Task 8: Gateway — rewrite server.go

**Files:**
- Rewrite: `api-gateway/internal/server.go`

- [ ] **Step 1: Write new server.go**

Replace the entire contents of `api-gateway/internal/server.go`:

```go
package internal

import (
	"errors"
	"log"
	"net/http"

	"github.com/berberim/api-gateway/internal/config"
	"github.com/berberim/api-gateway/internal/grpcclient"
	"github.com/berberim/api-gateway/internal/handler"
	authzmw "github.com/berberim/api-gateway/internal/middleware"
	"github.com/berberim/api-gateway/internal/security"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

// NewRouter builds the Echo router wired to all domain gateway handlers.
func NewRouter(cfg *config.Config, h *handler.Handlers, jwtValidator security.JWTValidator) *echo.Echo {
	validateJWT := authzmw.ValidateJWT(jwtValidator)

	e := echo.New()
	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(middleware.RequestLogger())

	e.GET("/healthz", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// ── Public API (no auth) ──────────────────────────────────────────────────
	// Tenant resolved from ?tenant_id= query param or request body.
	pub := e.Group("/api/v1/public")
	pub.GET("/bootstrap", h.Public.GetBootstrap)
	pub.POST("/customer-auth/request-otp", h.Public.RequestOTP)
	pub.POST("/customer-auth/verify-otp", h.Public.VerifyOTP)
	pub.POST("/customer-auth/verify-social", h.Public.VerifySocialLogin)
	pub.POST("/customer-auth/refresh", h.Public.RefreshToken)
	pub.POST("/customer-auth/logout", h.Public.Logout)
	pub.GET("/services", h.Public.ListServices)
	pub.GET("/services/:serviceId", h.Public.GetService)
	pub.GET("/staff", h.Public.ListStaff)
	pub.GET("/staff/:staffId", h.Public.GetStaff)
	pub.GET("/staff/:staffId/services", h.Public.ListStaffServices)
	pub.POST("/availability/search", h.Public.SearchAvailability)
	pub.GET("/availability/days", h.Public.GetAvailabilityDays)

	// ── Staff Auth ────────────────────────────────────────────────────────────
	staffAuth := e.Group("/api/v1/staff-auth")
	staffAuth.POST("/login", h.Auth.LoginTenantUser)
	staffAuth.POST("/refresh", h.Auth.RefreshToken)
	staffAuth.POST("/logout", h.Auth.Logout)

	staffAuthJWT := e.Group("/api/v1/staff-auth", validateJWT)
	staffAuthJWT.POST("/logout-all", h.Auth.LogoutAll)
	staffAuthJWT.GET("/sessions", h.Auth.ListSessions)
	staffAuthJWT.DELETE("/sessions/:session_id", h.Auth.RevokeSession)

	// ── Admin Auth ────────────────────────────────────────────────────────────
	adminAuth := e.Group("/api/v1/admin-auth")
	adminAuth.POST("/login", h.Auth.LoginTenantUser)
	adminAuth.POST("/refresh", h.Auth.RefreshToken)
	adminAuth.POST("/logout", h.Auth.Logout)

	adminAuthJWT := e.Group("/api/v1/admin-auth", validateJWT)
	adminAuthJWT.POST("/logout-all", h.Auth.LogoutAll)
	adminAuthJWT.GET("/sessions", h.Auth.ListSessions)
	adminAuthJWT.DELETE("/sessions/:session_id", h.Auth.RevokeSession)

	// ── Platform Auth ─────────────────────────────────────────────────────────
	platformAuth := e.Group("/api/v1/platform-auth")
	platformAuth.POST("/login", h.Auth.LoginPlatformUser)
	platformAuth.POST("/refresh", h.Auth.RefreshToken)
	platformAuth.POST("/logout", h.Auth.Logout)

	platformAuthJWT := e.Group("/api/v1/platform-auth", validateJWT)
	platformAuthJWT.POST("/logout-all", h.Auth.LogoutAll)
	platformAuthJWT.GET("/sessions", h.Auth.ListSessions)
	platformAuthJWT.DELETE("/sessions/:session_id", h.Auth.RevokeSession)

	// ── Customer API ──────────────────────────────────────────────────────────
	// Who:   authenticated customers
	// Scope: tenant from X-Tenant-ID header
	customer := e.Group("/api/v1/customer",
		validateJWT,
		authzmw.RequireTokenType("customer"),
		authzmw.RequireTenantHeader(),
	)
	customer.GET("/me", h.Customer.GetProfile)
	customer.PATCH("/me", h.Customer.UpdateProfile)
	customer.GET("/appointments", h.Customer.ListMyAppointments)
	customer.POST("/appointments", h.Customer.CreateAppointment)
	customer.GET("/appointments/:id", h.Customer.GetAppointment)
	customer.POST("/appointments/:id/cancel", h.Customer.CancelAppointment)
	customer.POST("/appointments/:id/reschedule", h.Customer.RescheduleAppointment)
	customer.GET("/loyalty/wallet", h.Customer.GetLoyaltyBalance)
	customer.GET("/loyalty/transactions", h.Customer.GetLoyaltyTransactions)
	customer.GET("/loyalty/rewards", h.Customer.ListRewards)

	// ── Staff API ─────────────────────────────────────────────────────────────
	// Who:   tenant_user (role=staff or role=admin — both can use the staff surface)
	// Scope: tenant from JWT claim
	staff := e.Group("/api/v1/staff",
		validateJWT,
		authzmw.RequireTokenType("tenant_user"),
		authzmw.RequireTenantFromJWT(),
	)
	staff.GET("/me", h.Staff.GetProfile)
	staff.GET("/calendar", h.Staff.GetCalendar)
	staff.GET("/appointments", h.Staff.ListAppointments)
	staff.GET("/appointments/:id", h.Staff.GetAppointment)
	staff.POST("/appointments/:id/complete", h.Staff.CompleteAppointment)
	staff.POST("/appointments/:id/mark-no-show", h.Staff.MarkNoShow)
	staff.POST("/appointments/:id/mark-payment-received", h.Staff.MarkPaymentReceived)
	staff.POST("/appointments/:id/cancel", h.Staff.CancelAppointment)
	staff.POST("/appointments/:id/reschedule", h.Staff.RescheduleAppointment)

	// ── Admin API ─────────────────────────────────────────────────────────────
	// Who:   tenant_user with role=admin
	// Scope: tenant from JWT claim
	admin := e.Group("/api/v1/admin",
		validateJWT,
		authzmw.RequireTokenType("tenant_user"),
		authzmw.RequireRole("admin"),
		authzmw.RequireTenantFromJWT(),
	)
	admin.GET("/tenant/settings", h.Admin.GetSettings)
	admin.PATCH("/tenant/settings", h.Admin.UpdateSettings)

	admin.GET("/services", h.Admin.ListServices)
	admin.POST("/services", h.Admin.CreateService)
	admin.GET("/services/:id", h.Admin.GetService)
	admin.PATCH("/services/:id", h.Admin.UpdateService)
	admin.DELETE("/services/:id", h.Admin.DeleteService)

	admin.GET("/staff", h.Admin.ListStaff)
	admin.POST("/staff", h.Admin.CreateStaff)
	admin.GET("/staff/:id", h.Admin.GetStaff)
	admin.PATCH("/staff/:id", h.Admin.UpdateStaff)
	admin.DELETE("/staff/:id", h.Admin.DeleteStaff)
	admin.PATCH("/staff/:id/status", h.Admin.SetStaffStatus)
	admin.GET("/staff/:id/services", h.Admin.GetStaffServices)
	admin.PUT("/staff/:id/services", h.Admin.SetStaffServices)
	admin.GET("/staff/:id/schedule-rules", h.Admin.ListScheduleRules)
	admin.POST("/staff/:id/schedule-rules", h.Admin.CreateScheduleRule)
	admin.PATCH("/staff/:id/schedule-rules/:ruleId", h.Admin.UpdateScheduleRule)
	admin.DELETE("/staff/:id/schedule-rules/:ruleId", h.Admin.DeleteScheduleRule)
	admin.GET("/staff/:id/time-offs", h.Admin.ListTimeOffs)
	admin.POST("/staff/:id/time-offs", h.Admin.CreateTimeOff)
	admin.PATCH("/staff/:id/time-offs/:timeOffId", h.Admin.UpdateTimeOff)
	admin.DELETE("/staff/:id/time-offs/:timeOffId", h.Admin.DeleteTimeOff)

	admin.GET("/appointments", h.Admin.ListAppointments)
	admin.GET("/appointments/:id", h.Admin.GetAppointment)
	admin.POST("/appointments", h.Admin.CreateAppointment)
	admin.POST("/appointments/:id/cancel", h.Admin.CancelAppointment)
	admin.POST("/appointments/:id/complete", h.Admin.CompleteAppointment)
	admin.POST("/appointments/:id/mark-no-show", h.Admin.MarkNoShow)
	admin.POST("/appointments/:id/mark-payment-received", h.Admin.MarkPaymentReceived)
	admin.POST("/appointments/:id/reschedule", h.Admin.RescheduleAppointment)
	admin.POST("/availability/search", h.Admin.SearchAvailability)

	admin.GET("/customers", h.Admin.ListCustomers)
	admin.POST("/customers", h.Admin.CreateCustomer)
	admin.GET("/customers/:id", h.Admin.GetCustomer)
	admin.PATCH("/customers/:id", h.Admin.UpdateCustomer)
	admin.PATCH("/customers/:id/status", h.Admin.SetCustomerStatus)
	admin.GET("/customers/:id/appointments", h.Admin.ListCustomerAppointments)

	admin.GET("/loyalty/settings", h.Admin.GetLoyaltySettings)
	admin.PATCH("/loyalty/settings", h.Admin.UpdateLoyaltySettings)

	admin.GET("/rewards", h.Admin.ListRewards)
	admin.POST("/rewards", h.Admin.CreateReward)
	admin.GET("/rewards/:id", h.Admin.GetReward)
	admin.PATCH("/rewards/:id", h.Admin.UpdateReward)
	admin.DELETE("/rewards/:id", h.Admin.DeleteReward)
	admin.PATCH("/rewards/:id/status", h.Admin.SetRewardStatus)

	admin.GET("/analytics/overview", h.Admin.GetAnalyticsOverview)

	// ── Platform API ──────────────────────────────────────────────────────────
	// Who:   platform_user (super admin)
	// Scope: cross-tenant
	platform := e.Group("/api/v1/platform",
		validateJWT,
		authzmw.RequireTokenType("platform_user"),
	)
	platform.GET("/tenants", h.Platform.ListTenants)
	platform.POST("/tenants", h.Platform.CreateTenant)
	platform.GET("/tenants/:id", h.Platform.GetTenant)
	platform.PATCH("/tenants/:id", h.Platform.UpdateTenant)
	platform.POST("/tenants/:id/freeze", h.Platform.FreezeTenant)
	platform.POST("/tenants/:id/reactivate", h.Platform.ReactivateTenant)
	platform.POST("/tenants/:id/cancel-subscription", h.Platform.CancelSubscription)
	platform.POST("/tenants/:id/extend-subscription", h.Platform.ExtendSubscription)
	platform.GET("/tenants/:tenant_id/users", h.Platform.ListTenantUsers)
	platform.POST("/tenants/:tenant_id/users", h.Platform.CreateTenantUser)
	platform.PUT("/tenants/:tenant_id/users/:user_id/disable", h.Platform.DisableTenantUser)
	platform.PUT("/tenants/:tenant_id/users/:user_id/enable", h.Platform.EnableTenantUser)

	platform.GET("/users", h.Platform.ListPlatformUsers)
	platform.POST("/users", h.Platform.CreatePlatformUser)
	platform.GET("/users/:id", h.Platform.GetPlatformUser)
	platform.PATCH("/users/:id", h.Platform.UpdatePlatformUser)
	platform.DELETE("/users/:id", h.Platform.DeletePlatformUser)

	e.Any("/*", func(c *echo.Context) error {
		return c.JSON(http.StatusNotFound, map[string]any{
			"error_code": "not_found",
			"message":    "unknown route",
		})
	})

	return e
}

// Start runs the API gateway.
func Start() error {
	cfg := config.LoadConfig()

	client, conn, err := grpcclient.New(cfg.APIGRPCAddr)
	if err != nil {
		log.Fatalf("gateway grpc client: %v", err)
	}
	defer conn.Close()

	jwtValidator, err := security.NewJWTValidator(cfg.Authz)
	if err != nil {
		log.Fatalf("gateway JWT validator: %v", err)
	}

	h := &handler.Handlers{
		Auth:     handler.NewAuthHandler(client),
		Public:   handler.NewPublicHandler(client),
		Customer: handler.NewCustomerHandler(client),
		Staff:    handler.NewStaffHandler(client),
		Admin:    handler.NewAdminHandler(client),
		Platform: handler.NewPlatformHandler(client),
	}

	e := NewRouter(cfg, h, jwtValidator)

	addr := ":" + cfg.Port
	log.Printf("API gateway listening on %s → gRPC %s", addr, cfg.APIGRPCAddr)
	if err := e.Start(addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("gateway: %v", err)
	}

	return nil
}
```

- [ ] **Step 2: Build the gateway**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api-gateway
go build ./...
```

Expected: no output (success). If errors, fix compilation issues before continuing.

---

## Task 9: Gateway — update gateway_test.go

**Files:**
- Modify: `api-gateway/internal/gateway_test.go`

- [ ] **Step 1: Update stubClient to implement all new RPC methods**

The stub must implement every method on `BerberimAPIClient`. After adding ~45 new RPCs in Task 1, the stub is missing those methods. Add them to `gateway_test.go` after the existing `EnableTenantUser` stub:

```go
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
func (s *stubClient) ListAdminCustomers(_ context.Context, _ *berberimv1.ListAdminCustomersRequest, _ ...grpc.CallOption) (*berberimv1.ListAdminCustomersResponse, error) {
	return &berberimv1.ListAdminCustomersResponse{}, nil
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
```

- [ ] **Step 2: Update buildRouter and newHandlers to use AdminHandler**

In `gateway_test.go`, update `newHandlers()`:

```go
func newHandlers() *handler.Handlers {
	c := &stubClient{}
	return &handler.Handlers{
		Auth:     handler.NewAuthHandler(c),
		Public:   handler.NewPublicHandler(c),
		Customer: handler.NewCustomerHandler(c),
		Staff:    handler.NewStaffHandler(c),
		Admin:    handler.NewAdminHandler(c),
		Platform: handler.NewPlatformHandler(c),
	}
}
```

- [ ] **Step 3: Update the fake JWT validator and fix old test references**

The fake validator in `buildRouter` uses `"tenant-token"` pointing to `admin` routes. The old tests for `TestRouter_TenantAdminRoutes_RequireRole` reference `/api/v1/tenant/settings` — update to `/api/v1/admin/tenant/settings`.

Update the existing test that uses the old path:

```go
func TestRouter_AdminRoutes_RequireRole(t *testing.T) {
	_, do := buildRouter(t)

	t.Run("platform token returns 403", func(t *testing.T) {
		rec := do("GET", "/api/v1/admin/tenant/settings", "platform-token")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("status = %d, want 403", rec.Code)
		}
	})

	t.Run("tenant admin token passes", func(t *testing.T) {
		rec := do("GET", "/api/v1/admin/tenant/settings", "tenant-token")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
}
```

Also update `TestRouter_AuthRoutes_NoJWTRequired` to use new public auth paths:

```go
func TestRouter_PublicAuthRoutes_NoJWTRequired(t *testing.T) {
	_, do := buildRouter(t)

	routes := []struct{ method, path string }{
		{"POST", "/api/v1/public/customer-auth/request-otp"},
		{"POST", "/api/v1/public/customer-auth/verify-otp"},
		{"POST", "/api/v1/public/customer-auth/verify-social"},
		{"POST", "/api/v1/public/customer-auth/refresh"},
		{"POST", "/api/v1/public/customer-auth/logout"},
		{"POST", "/api/v1/staff-auth/login"},
		{"POST", "/api/v1/admin-auth/login"},
		{"POST", "/api/v1/platform-auth/login"},
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
```

Add a new test for the public catalog:

```go
func TestRouter_PublicCatalog_NoJWTRequired(t *testing.T) {
	_, do := buildRouter(t)

	routes := []struct{ method, path string }{
		{"GET", "/api/v1/public/bootstrap?tenant_id=some-id"},
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
```

Update `TestRouter_StaffRoutes_RequireTokenType` to use new path and keep existing logic.

- [ ] **Step 4: Run all gateway tests**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api-gateway
go test ./... -v 2>&1 | tail -30
```

Expected: all tests PASS. Fix any failures before committing.

- [ ] **Step 5: Commit everything**

```bash
cd /Users/safayildirim/Desktop/repos/berberim/api-gateway
git add internal/
git commit -m "feat: redesign route structure — public/staff/admin/platform surfaces with new stub endpoints"
```

---

## Self-Review

### Spec coverage check

| Spec section | Task | Status |
|---|---|---|
| Public bootstrap | Task 3 (public.go + Task 8 server.go) | ✅ |
| Public customer-auth | Task 3 public.go | ✅ |
| Public catalog (services, staff) | Task 3 public.go | ✅ |
| Public availability (search + days) | Task 3 public.go | ✅ |
| Customer profile | Task 6 customer.go | ✅ |
| Customer appointments | Task 8 server.go (existing handlers) | ✅ |
| Customer loyalty (wallet, transactions, rewards) | Task 6 customer.go | ✅ |
| Staff auth surface | Task 8 server.go | ✅ |
| Staff profile + calendar | Task 5 staff.go | ✅ |
| Staff appointments (all actions) | Task 8 server.go (existing handlers) | ✅ |
| Admin auth surface | Task 8 server.go | ✅ |
| Admin tenant settings | Task 4 admin.go | ✅ |
| Admin service catalog (CRUD) | Task 4 admin.go | ✅ |
| Admin staff management (CRUD + status) | Task 4 admin.go | ✅ |
| Admin staff services assignment | Task 4 admin.go | ✅ |
| Admin schedule rules | Task 4 admin.go | ✅ |
| Admin time offs | Task 4 admin.go | ✅ |
| Admin appointments (all actions) | Task 4 admin.go | ✅ |
| Admin customer management | Task 4 admin.go | ✅ |
| Admin loyalty settings | Task 4 admin.go | ✅ |
| Admin rewards CRUD | Task 4 admin.go | ✅ |
| Admin analytics overview | Task 4 admin.go | ✅ |
| Platform auth surface | Task 8 server.go | ✅ |
| Platform tenant lifecycle (freeze/reactivate/subscription) | Task 7 platform.go | ✅ |
| Platform tenant users | Task 8 server.go (existing handlers) | ✅ |
| Platform platform users | Task 7 platform.go | ✅ |
| `/api/v1/tenant/` removed → `/api/v1/admin/` | Task 4+8 | ✅ |
| `/auth/` routes removed → surface-specific | Task 8 | ✅ |

**Not covered (out of scope for this plan):**
- Campaigns (no backend domain)
- Notifications (no backend domain)
- Audit logs (no backend domain)
- Analytics sub-endpoints beyond overview (no backend domain)
- Customer rebook endpoint (use reschedule for now)
- Staff/customer device management
- Reward redemptions

### Placeholder scan
No TBDs, TODOs, or "similar to" references found. All handler methods contain complete code.

### Type consistency check
- `AdminHandler` is used consistently (not `TenantAdminHandler`) across handler.go, admin.go, server.go, gateway_test.go
- `PublicHandler` is consistent across public.go, handler.go, server.go, gateway_test.go
- All proto field names verified against proto definitions (e.g., `StaffId`, `RuleId`, `TimeOffId`, `RewardId`, `UserId`)
