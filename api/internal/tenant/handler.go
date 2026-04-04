package tenant

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Handler is a thin gRPC bridge — parse → call service → marshal.
type Handler struct {
	log     *zap.Logger
	service *Service
}

func NewHandler(log *zap.Logger, service *Service) *Handler {
	return &Handler{log: log, service: service}
}

// ── Tenant CRUD ───────────────────────────────────────────────────────────────

func (h *Handler) CreateTenant(ctx context.Context, req *berberimv1.CreateTenantRequest) (*berberimv1.CreateTenantResponse, error) {
	result, err := h.service.CreateTenant(ctx, CreateTenantInput{
		Name:          req.Name,
		Slug:          req.Slug,
		AdminEmail:    req.AdminEmail,
		AdminPassword: req.AdminPassword,
		Timezone:      req.Timezone,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.CreateTenantResponse{
		TenantId:    result.TenantID.String(),
		AdminUserId: result.AdminUserID.String(),
	}, nil
}

func (h *Handler) ListTenants(ctx context.Context, req *berberimv1.ListTenantsRequest) (*berberimv1.ListTenantsResponse, error) {
	tenants, total, totalPages, err := h.service.ListTenants(ctx, int(req.Page), int(req.PageSize))
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.Tenant, 0, len(tenants))
	for _, t := range tenants {
		out = append(out, tenantToProto(t))
	}
	return &berberimv1.ListTenantsResponse{
		Tenants:    out,
		Total:      int32(total),
		TotalPages: totalPages,
	}, nil
}

func (h *Handler) GetTenant(ctx context.Context, req *berberimv1.GetTenantRequest) (*berberimv1.GetTenantResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid id: %v", err)
	}
	t, err := h.service.GetTenant(ctx, id)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetTenantResponse{Tenant: tenantToProto(t)}, nil
}

func (h *Handler) UpdateTenant(ctx context.Context, req *berberimv1.UpdateTenantRequest) (*berberimv1.UpdateTenantResponse, error) {
	tenantID, err := uuid.Parse(req.TenantId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}
	in := UpdateTenantInput{
		TenantID:    tenantID,
		Name:        req.Name,
		Timezone:    req.Timezone,
		PhoneNumber: req.PhoneNumber,
		Address:     req.Address,
	}
	if req.Coordinates != nil {
		in.Latitude = &req.Coordinates.Latitude
		in.Longitude = &req.Coordinates.Longitude
	}
	t, err := h.service.UpdateTenant(ctx, in)
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateTenantResponse{Tenant: tenantToProto(t)}, nil
}

func (h *Handler) SetTenantStatus(ctx context.Context, req *berberimv1.SetTenantStatusRequest) (*berberimv1.SetTenantStatusResponse, error) {
	tenantID, err := uuid.Parse(req.TenantId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}
	if err := h.service.SetTenantStatus(ctx, tenantID, req.Status); err != nil {
		return nil, err
	}
	return &berberimv1.SetTenantStatusResponse{}, nil
}

// ── Tenant Users ──────────────────────────────────────────────────────────────

func (h *Handler) CreateTenantUser(ctx context.Context, req *berberimv1.CreateTenantUserRequest) (*berberimv1.CreateTenantUserResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	userID, err := h.service.CreateTenantUser(ctx, CreateTenantUserInput{
		TenantID:  rc.TenantID,
		Email:     req.Email,
		Password:  req.Password,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Role:      req.Role,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.CreateTenantUserResponse{UserId: userID.String()}, nil
}

func (h *Handler) ListTenantUsers(ctx context.Context, req *berberimv1.ListTenantUsersRequest) (*berberimv1.ListTenantUsersResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	users, total, totalPages, err := h.service.ListTenantUsers(ctx, rc.TenantID, req.Role, req.Status, int(req.Page), int(req.PageSize))
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.TenantUser, 0, len(users))
	for _, u := range users {
		out = append(out, tenantUserToProto(u))
	}
	return &berberimv1.ListTenantUsersResponse{
		Users:      out,
		Total:      int32(total),
		TotalPages: totalPages,
	}, nil
}

func (h *Handler) DisableTenantUser(ctx context.Context, req *berberimv1.DisableTenantUserRequest) (*berberimv1.DisableTenantUserResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}
	if err := h.service.DisableTenantUser(ctx, rc.TenantID, userID); err != nil {
		return nil, err
	}
	return &berberimv1.DisableTenantUserResponse{}, nil
}

func (h *Handler) EnableTenantUser(ctx context.Context, req *berberimv1.EnableTenantUserRequest) (*berberimv1.EnableTenantUserResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}
	if err := h.service.EnableTenantUser(ctx, rc.TenantID, userID); err != nil {
		return nil, err
	}
	return &berberimv1.EnableTenantUserResponse{}, nil
}

// ── Staff Profile ─────────────────────────────────────────────────────────────

func (h *Handler) GetStaffProfile(ctx context.Context, _ *berberimv1.GetStaffProfileRequest) (*berberimv1.GetStaffProfileResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	user, err := h.service.repo.GetTenantUserByID(ctx, rc.TenantID, rc.UserID)
	if err != nil {
		return nil, status.Error(codes.NotFound, "user not found")
	}
	return &berberimv1.GetStaffProfileResponse{
		Profile: &berberimv1.StaffProfile{
			Id:        user.ID.String(),
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Email:     user.Email,
			Role:      user.Role,
			Status:    user.Status,
		},
	}, nil
}

// ── Public Bootstrap ──────────────────────────────────────────────────────────

func (h *Handler) GetPublicBootstrap(ctx context.Context, req *berberimv1.GetPublicBootstrapRequest) (*berberimv1.GetPublicBootstrapResponse, error) {
	tenantID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid tenant_id: %v", err)
	}

	result, err := h.service.GetPublicBootstrap(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	res := &berberimv1.GetPublicBootstrapResponse{
		Id:       result.Tenant.ID.String(),
		Name:     result.Tenant.Name,
		Slug:     result.Tenant.Slug,
		Timezone: result.Tenant.Timezone,
		Settings: settingsToProto(result.Settings),
		Branding: brandingToProto(result.Branding),
	}

	if result.Tenant.PhoneNumber != nil {
		res.PhoneNumber = *result.Tenant.PhoneNumber
	}

	if result.Tenant.Address != nil {
		res.Address = *result.Tenant.Address
	}

	if result.Tenant.Latitude != nil && result.Tenant.Longitude != nil {
		res.Coordinates = &berberimv1.Coordinates{
			Latitude:  *result.Tenant.Latitude,
			Longitude: *result.Tenant.Longitude,
		}
	}

	return res, nil
}

// ── Tenant Branding ───────────────────────────────────────────────────────────

func (h *Handler) GetTenantBranding(ctx context.Context, _ *berberimv1.GetTenantBrandingRequest) (*berberimv1.GetTenantBrandingResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	b, err := h.service.GetTenantBranding(ctx, rc.TenantID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetTenantBrandingResponse{Branding: brandingToProto(b)}, nil
}

func (h *Handler) UpdateTenantBranding(ctx context.Context, req *berberimv1.UpdateTenantBrandingRequest) (*berberimv1.UpdateTenantBrandingResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	b, err := h.service.UpdateTenantBranding(ctx, rc.TenantID, TenantBrandingUpdate{
		LogoURL:        req.LogoUrl,
		PrimaryColor:   req.PrimaryColor,
		SecondaryColor: req.SecondaryColor,
		TertiaryColor:  req.TertiaryColor,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateTenantBrandingResponse{Branding: brandingToProto(b)}, nil
}

// ── Tenant Settings ───────────────────────────────────────────────────────────

func (h *Handler) GetTenantSettings(ctx context.Context, _ *berberimv1.GetTenantSettingsRequest) (*berberimv1.GetTenantSettingsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	settings, err := h.service.GetTenantSettings(ctx, rc.TenantID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetTenantSettingsResponse{Settings: settingsToProto(settings)}, nil
}

func (h *Handler) UpdateTenantSettings(ctx context.Context, req *berberimv1.UpdateTenantSettingsRequest) (*berberimv1.UpdateTenantSettingsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if req.Settings == nil {
		return nil, status.Error(codes.InvalidArgument, "settings is required")
	}
	settings, err := h.service.UpdateTenantSettings(ctx, rc.TenantID, TenantSettingsUpdate{
		NotificationReminderHours: req.Settings.NotificationReminderHours,
		CancellationLimitHours:    req.Settings.CancellationLimitHours,
		LoyaltyEnabled:            req.Settings.LoyaltyEnabled,
		WalkInEnabled:             req.Settings.WalkInEnabled,
		SameDayBookingEnabled:     req.Settings.SameDayBookingEnabled,
		MaxWeeklyCustomerBookings: req.Settings.MaxWeeklyCustomerBookings,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateTenantSettingsResponse{Settings: settingsToProto(settings)}, nil
}

// ── Services Catalog ──────────────────────────────────────────────────────────

func (h *Handler) ListServices(ctx context.Context, req *berberimv1.ListServicesRequest) (*berberimv1.ListServicesResponse, error) {
	tenantID, err := resolveTenantID(ctx, req.TenantId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid or missing tenant_id")
	}
	svcs, err := h.service.ListServices(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.Service, 0, len(svcs))
	for _, s := range svcs {
		out = append(out, catalogServiceToProto(s))
	}
	return &berberimv1.ListServicesResponse{Services: out}, nil
}

func (h *Handler) CreateService(ctx context.Context, req *berberimv1.CreateServiceRequest) (*berberimv1.CreateServiceResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	svc, err := h.service.CreateService(ctx, CreateServiceInput{
		TenantID:        rc.TenantID,
		Name:            req.Name,
		Description:     req.Description,
		DurationMinutes: req.DurationMinutes,
		BasePrice:       req.BasePrice,
		PointsReward:    req.PointsReward,
		CategoryName:    req.CategoryName,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.CreateServiceResponse{Service: catalogServiceToProto(svc)}, nil
}

func (h *Handler) UpdateService(ctx context.Context, req *berberimv1.UpdateServiceRequest) (*berberimv1.UpdateServiceResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	serviceID, err := uuid.Parse(req.ServiceId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid service_id: %v", err)
	}
	svc, err := h.service.UpdateService(ctx, UpdateServiceInput{
		TenantID:        rc.TenantID,
		ServiceID:       serviceID,
		Name:            req.Name,
		DurationMinutes: req.DurationMinutes,
		BasePrice:       req.BasePrice,
		PointsReward:    req.PointsReward,
		IsActive:        req.IsActive,
		Description:     req.Description,
		CategoryName:    req.CategoryName,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateServiceResponse{Service: catalogServiceToProto(svc)}, nil
}

// ── Staff CRUD ───────────────────────────────────────────────────────────────

func (h *Handler) GetStaffMember(ctx context.Context, req *berberimv1.GetStaffMemberRequest) (*berberimv1.GetStaffMemberResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	u, err := h.service.GetStaffMember(ctx, rc.TenantID, staffID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetStaffMemberResponse{Staff: tenantUserToProto(u)}, nil
}

func (h *Handler) UpdateStaffMember(ctx context.Context, req *berberimv1.UpdateStaffMemberRequest) (*berberimv1.UpdateStaffMemberResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	u, err := h.service.UpdateStaffMember(ctx, UpdateStaffMemberInput{
		TenantID:  rc.TenantID,
		StaffID:   staffID,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Password:  req.Password,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateStaffMemberResponse{Staff: tenantUserToProto(u)}, nil
}

func (h *Handler) DeleteStaffMember(ctx context.Context, req *berberimv1.DeleteStaffMemberRequest) (*berberimv1.DeleteStaffMemberResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	if err := h.service.DeleteStaffMember(ctx, rc.TenantID, staffID); err != nil {
		return nil, err
	}
	return &berberimv1.DeleteStaffMemberResponse{}, nil
}

func (h *Handler) SetStaffStatus(ctx context.Context, req *berberimv1.SetStaffStatusRequest) (*berberimv1.SetStaffStatusResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	if err := h.service.SetStaffStatus(ctx, rc.TenantID, staffID, req.Status); err != nil {
		return nil, err
	}
	return &berberimv1.SetStaffStatusResponse{}, nil
}

// ── Staff Services ──────────────────────────────────────────────────────────

func (h *Handler) GetStaffServices(ctx context.Context, req *berberimv1.GetStaffServicesRequest) (*berberimv1.GetStaffServicesResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	assignments, err := h.service.GetStaffServices(ctx, rc.TenantID, staffID)
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.StaffServiceAssignment, 0, len(assignments))
	for _, a := range assignments {
		p := &berberimv1.StaffServiceAssignment{
			ServiceId:   a.ServiceID.String(),
			ServiceName: a.ServiceName,
			IsActive:    a.IsActive,
		}
		if a.CustomPrice != nil {
			p.CustomPrice = *a.CustomPrice
		}
		out = append(out, p)
	}
	return &berberimv1.GetStaffServicesResponse{Services: out}, nil
}

func (h *Handler) SetStaffServices(ctx context.Context, req *berberimv1.SetStaffServicesRequest) (*berberimv1.SetStaffServicesResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	serviceIDs := make([]uuid.UUID, 0, len(req.ServiceIds))
	for _, s := range req.ServiceIds {
		id, err := uuid.Parse(s)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid service_id %q: %v", s, err)
		}
		serviceIDs = append(serviceIDs, id)
	}
	if err := h.service.SetStaffServices(ctx, rc.TenantID, staffID, serviceIDs); err != nil {
		return nil, err
	}
	return &berberimv1.SetStaffServicesResponse{}, nil
}

// ── Schedule Rules ──────────────────────────────────────────────────────────

func (h *Handler) ListScheduleRules(ctx context.Context, req *berberimv1.ListScheduleRulesRequest) (*berberimv1.ListScheduleRulesResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	rules, err := h.service.ListScheduleRules(ctx, rc.TenantID, staffID)
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.ScheduleRule, 0, len(rules))
	for _, r := range rules {
		out = append(out, scheduleRuleToProto(&r))
	}
	return &berberimv1.ListScheduleRulesResponse{Rules: out}, nil
}

func (h *Handler) CreateScheduleRule(ctx context.Context, req *berberimv1.CreateScheduleRuleRequest) (*berberimv1.CreateScheduleRuleResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	rule, err := h.service.CreateScheduleRule(ctx, CreateScheduleRuleInput{
		TenantID:            rc.TenantID,
		StaffID:             staffID,
		DayOfWeek:           req.DayOfWeek,
		StartTime:           req.StartTime,
		EndTime:             req.EndTime,
		SlotIntervalMinutes: req.SlotIntervalMinutes,
		IsWorkingDay:        req.IsWorkingDay,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.CreateScheduleRuleResponse{Rule: scheduleRuleToProto(rule)}, nil
}

func (h *Handler) UpdateScheduleRule(ctx context.Context, req *berberimv1.UpdateScheduleRuleRequest) (*berberimv1.UpdateScheduleRuleResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	ruleID, err := uuid.Parse(req.RuleId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid rule_id: %v", err)
	}
	rule, err := h.service.UpdateScheduleRule(ctx, UpdateScheduleRuleInput{
		TenantID:            rc.TenantID,
		StaffID:             uuid.Nil, // not needed for update
		RuleID:              ruleID,
		StartTime:           req.StartTime,
		EndTime:             req.EndTime,
		SlotIntervalMinutes: req.SlotIntervalMinutes,
		IsWorkingDay:        req.IsWorkingDay,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateScheduleRuleResponse{Rule: scheduleRuleToProto(rule)}, nil
}

func (h *Handler) DeleteScheduleRule(ctx context.Context, req *berberimv1.DeleteScheduleRuleRequest) (*berberimv1.DeleteScheduleRuleResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	ruleID, err := uuid.Parse(req.RuleId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid rule_id: %v", err)
	}
	if err := h.service.DeleteScheduleRule(ctx, rc.TenantID, ruleID); err != nil {
		return nil, err
	}
	return &berberimv1.DeleteScheduleRuleResponse{}, nil
}

// ── Time Offs ───────────────────────────────────────────────────────────────

func (h *Handler) ListTimeOffs(ctx context.Context, req *berberimv1.ListTimeOffsRequest) (*berberimv1.ListTimeOffsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	timeOffs, err := h.service.ListTimeOffs(ctx, rc.TenantID, staffID)
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.TimeOff, 0, len(timeOffs))
	for _, t := range timeOffs {
		out = append(out, timeOffToProto(&t))
	}
	return &berberimv1.ListTimeOffsResponse{TimeOffs: out}, nil
}

func (h *Handler) CreateTimeOff(ctx context.Context, req *berberimv1.CreateTimeOffRequest) (*berberimv1.CreateTimeOffResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	staffID, err := uuid.Parse(req.StaffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_id: %v", err)
	}
	t, err := h.service.CreateTimeOff(ctx, CreateTimeOffInput{
		TenantID: rc.TenantID,
		StaffID:  staffID,
		StartAt:  req.StartAt,
		EndAt:    req.EndAt,
		Reason:   req.Reason,
		Type:     req.Type,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.CreateTimeOffResponse{TimeOff: timeOffToProto(t)}, nil
}

func (h *Handler) UpdateTimeOff(ctx context.Context, req *berberimv1.UpdateTimeOffRequest) (*berberimv1.UpdateTimeOffResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	timeOffID, err := uuid.Parse(req.TimeOffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid time_off_id: %v", err)
	}
	t, err := h.service.UpdateTimeOff(ctx, UpdateTimeOffInput{
		TenantID:  rc.TenantID,
		StaffID:   uuid.Nil,
		TimeOffID: timeOffID,
		StartAt:   req.StartAt,
		EndAt:     req.EndAt,
		Reason:    req.Reason,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateTimeOffResponse{TimeOff: timeOffToProto(t)}, nil
}

func (h *Handler) DeleteTimeOff(ctx context.Context, req *berberimv1.DeleteTimeOffRequest) (*berberimv1.DeleteTimeOffResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	timeOffID, err := uuid.Parse(req.TimeOffId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid time_off_id: %v", err)
	}
	if err := h.service.DeleteTimeOff(ctx, rc.TenantID, timeOffID); err != nil {
		return nil, err
	}
	return &berberimv1.DeleteTimeOffResponse{}, nil
}

// ── Staff Calendar ──────────────────────────────────────────────────────────

func (h *Handler) GetStaffCalendar(ctx context.Context, req *berberimv1.GetStaffCalendarRequest) (*berberimv1.GetStaffCalendarResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	appts, err := h.service.GetStaffCalendar(ctx, rc.TenantID, rc.UserID, req.Date, req.View)
	if err != nil {
		return nil, err
	}
	entries := make([]*berberimv1.CalendarEntry, 0, len(appts))
	for _, a := range appts {
		entries = append(entries, &berberimv1.CalendarEntry{
			Appointment: &berberimv1.Appointment{
				Id:          a.ID.String(),
				TenantId:    a.TenantID.String(),
				CustomerId:  a.CustomerID.String(),
				StaffUserId: a.StaffUserID.String(),
				StartsAt:    formatTime(a.StartsAt),
				EndsAt:      formatTime(a.EndsAt),
				Status:      a.Status,
				CreatedVia:  a.CreatedVia,
				CreatedAt:   formatTime(a.CreatedAt),
				UpdatedAt:   formatTime(a.UpdatedAt),
				Customer: &berberimv1.Customer{
					FirstName: a.CustomerFirstName,
					LastName:  a.CustomerLastName,
				},
			},
		})
	}
	return &berberimv1.GetStaffCalendarResponse{Entries: entries}, nil
}

// ── Analytics ────────────────────────────────────────────────────────────────

func (h *Handler) GetAnalyticsOverview(ctx context.Context, req *berberimv1.GetAnalyticsOverviewRequest) (*berberimv1.GetAnalyticsOverviewResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	overview, err := h.service.GetAnalyticsOverview(ctx, rc.TenantID, req.Range)
	if err != nil {
		return nil, err
	}

	popularProto := make([]*berberimv1.PopularService, 0, len(overview.PopularServices))
	topCount := 0
	if len(overview.PopularServices) > 0 {
		topCount = overview.PopularServices[0].Count
	}
	for _, ps := range overview.PopularServices {
		progress := 0.0
		if topCount > 0 {
			progress = float64(ps.Count) / float64(topCount)
		}
		popularProto = append(popularProto, &berberimv1.PopularService{
			Name:     ps.Name,
			Count:    int32(ps.Count),
			Progress: progress,
		})
	}

	return &berberimv1.GetAnalyticsOverviewResponse{
		Overview: &berberimv1.AnalyticsOverview{
			TotalAppointments:     int32(overview.TotalAppointments),
			CompletedAppointments: int32(overview.CompletedAppointments),
			CancelledAppointments: int32(overview.CancelledAppointments),
			NoShowRate:            overview.NoShowRate,
			NoShowRateChange:      overview.NoShowRateChange,
			TotalRevenue:          overview.TotalRevenue,
			AppointmentsChange:    overview.AppointmentsChange,
			ActiveCustomers:       int32(overview.ActiveCustomers),
			ReturningRate:         overview.ReturningRate,
			VisitFrequency:        overview.VisitFrequency,
			StaffUtilization:      overview.StaffUtilization,
			PopularServices:       popularProto,
			RewardsRedeemed:       int32(overview.RewardsRedeemed),
			RedeemedChange:        overview.RedeemedChange,
			LoyaltyProgress:       int32(overview.LoyaltyProgress),
		},
	}, nil
}

// ── Proto helpers ─────────────────────────────────────────────────────────────

func tenantToProto(t *Tenant) *berberimv1.Tenant {
	p := &berberimv1.Tenant{
		Id:        t.ID.String(),
		Name:      t.Name,
		Slug:      t.Slug,
		Status:    t.Status,
		Timezone:  t.Timezone,
		CreatedAt: formatTime(t.CreatedAt),
		UpdatedAt: formatTime(t.UpdatedAt),
	}
	if t.PhoneNumber != nil {
		p.PhoneNumber = *t.PhoneNumber
	}
	if t.Address != nil {
		p.Address = *t.Address
	}
	if t.Latitude != nil && t.Longitude != nil {
		p.Coordinates = &berberimv1.Coordinates{
			Latitude:  *t.Latitude,
			Longitude: *t.Longitude,
		}
	}
	return p
}

func brandingToProto(b *TenantBranding) *berberimv1.TenantBranding {
	p := &berberimv1.TenantBranding{
		TenantId:  b.TenantID.String(),
		UpdatedAt: formatTime(b.UpdatedAt),
	}
	if b.LogoURL != nil {
		p.LogoUrl = *b.LogoURL
	}
	if b.PrimaryColor != nil {
		p.PrimaryColor = *b.PrimaryColor
	}
	if b.SecondaryColor != nil {
		p.SecondaryColor = *b.SecondaryColor
	}
	if b.TertiaryColor != nil {
		p.TertiaryColor = *b.TertiaryColor
	}
	return p
}

func tenantUserToProto(u *TenantUser) *berberimv1.TenantUser {
	p := &berberimv1.TenantUser{
		Id:        u.ID.String(),
		TenantId:  u.TenantID.String(),
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Role:      u.Role,
		Status:    u.Status,
		CreatedAt: formatTime(u.CreatedAt),
		UpdatedAt: formatTime(u.UpdatedAt),
	}
	p.AvatarUrl = u.AvatarURL
	p.Specialty = u.Specialty
	p.Bio = u.Bio
	p.AvgRating = u.AvgRating
	p.ReviewCount = int32(u.ReviewCount)
	return p
}

func settingsToProto(s *TenantSettings) *berberimv1.TenantSettingsData {
	return &berberimv1.TenantSettingsData{
		NotificationReminderHours: int32(s.NotificationReminderHours),
		CancellationLimitHours:    int32(s.CancellationLimitHours),
		LoyaltyEnabled:            s.LoyaltyEnabled,
		WalkInEnabled:             s.WalkInEnabled,
		SameDayBookingEnabled:     s.SameDayBookingEnabled,
		MaxWeeklyCustomerBookings: int32(s.MaxWeeklyCustomerBookings),
	}
}

func catalogServiceToProto(s *CatalogService) *berberimv1.Service {
	p := &berberimv1.Service{
		Id:              s.ID.String(),
		TenantId:        s.TenantID.String(),
		Name:            s.Name,
		DurationMinutes: int32(s.DurationMinutes),
		BasePrice:       s.BasePrice,
		PointsReward:    int32(s.PointsReward),
		IsActive:        s.IsActive,
		CreatedAt:       formatTime(s.CreatedAt),
		UpdatedAt:       formatTime(s.UpdatedAt),
	}
	if s.Description != nil {
		p.Description = *s.Description
	}
	if s.CategoryName != nil {
		p.CategoryName = *s.CategoryName
	}
	return p
}

func scheduleRuleToProto(r *ScheduleRule) *berberimv1.ScheduleRule {
	return &berberimv1.ScheduleRule{
		Id:                  r.ID.String(),
		DayOfWeek:           int32(r.DayOfWeek),
		StartTime:           r.StartTime,
		EndTime:             r.EndTime,
		SlotIntervalMinutes: int32(r.SlotIntervalMinutes),
		IsWorkingDay:        r.IsWorkingDay,
	}
}

func timeOffToProto(t *TimeOff) *berberimv1.TimeOff {
	p := &berberimv1.TimeOff{
		Id:      t.ID.String(),
		StartAt: formatTime(t.StartAt),
		EndAt:   formatTime(t.EndAt),
		Type:    t.Type,
	}
	if t.Reason != nil {
		p.Reason = *t.Reason
	}
	return p
}

// resolveTenantID prefers identity context over the fallback string field.
func resolveTenantID(ctx context.Context, fallback string) (uuid.UUID, error) {
	if rc, ok := identity.FromContext(ctx); ok && rc.TenantID != uuid.Nil {
		return rc.TenantID, nil
	}
	return uuid.Parse(fallback)
}
