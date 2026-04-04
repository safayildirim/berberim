package tenant

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Service struct {
	log  *zap.Logger
	repo *Repo
}

func NewService(log *zap.Logger, repo *Repo) *Service {
	return &Service{log: log, repo: repo}
}

// translateUniqueErr checks if err is a PostgreSQL unique-violation (code 23505)
// and if so returns friendlyMsg; otherwise returns the original error wrapped with context.
func translateUniqueErr(err error, field, friendlyMsg string) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return status.Error(codes.AlreadyExists, friendlyMsg)
	}
	return status.Errorf(codes.Internal, "insert %s: %v", field, err)
}

// ── Request / result types ────────────────────────────────────────────────────

type CreateTenantInput struct {
	Name          string
	Slug          string
	AdminEmail    string
	AdminPassword string
	Timezone      string
}

type CreateTenantResult struct {
	TenantID    uuid.UUID
	AdminUserID uuid.UUID
}

type CreateTenantUserInput struct {
	TenantID  uuid.UUID
	Email     string
	Password  string
	FirstName string
	LastName  string
	Role      string
}

type TenantSettingsUpdate struct {
	NotificationReminderHours int32
	CancellationLimitHours    int32
	LoyaltyEnabled            bool
	WalkInEnabled             bool
	SameDayBookingEnabled     bool
	MaxWeeklyCustomerBookings int32
}

type CreateServiceInput struct {
	TenantID        uuid.UUID
	Name            string
	Description     string
	DurationMinutes int32
	BasePrice       string
	PointsReward    int32
	CategoryName    string
}

type UpdateTenantInput struct {
	TenantID    uuid.UUID
	Name        string
	Timezone    string
	PhoneNumber string
	Address     string
	Latitude    *float64
	Longitude   *float64
}

type TenantBrandingUpdate struct {
	LogoURL        string
	PrimaryColor   string
	SecondaryColor string
	TertiaryColor  string
}

type UpdateServiceInput struct {
	TenantID        uuid.UUID
	ServiceID       uuid.UUID
	Name            string
	DurationMinutes int32
	BasePrice       string
	PointsReward    int32
	IsActive        bool
	Description     string
	CategoryName    string
}

// ── Tenant CRUD ───────────────────────────────────────────────────────────────

func (s *Service) CreateTenant(ctx context.Context, in CreateTenantInput) (CreateTenantResult, error) {
	if in.Slug == "" || in.Name == "" || in.AdminEmail == "" || in.AdminPassword == "" {
		return CreateTenantResult{}, status.Error(codes.InvalidArgument, "name, slug, admin_email, and admin_password are required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return CreateTenantResult{}, status.Errorf(codes.Internal, "hash password: %v", err)
	}

	tenantID := uuid.New()
	adminID := uuid.New()
	tz := in.Timezone
	if tz == "" {
		tz = "Europe/Istanbul"
	}

	err = s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		t := &Tenant{
			ID:       tenantID,
			Name:     in.Name,
			Slug:     in.Slug,
			Status:   "active",
			Timezone: tz,
		}
		if err := s.repo.CreateTenant(txCtx, t); err != nil {
			return translateUniqueErr(err, "slug", "slug already taken")
		}

		settings := &TenantSettings{
			ID:                        uuid.New(),
			TenantID:                  tenantID,
			NotificationReminderHours: 24,
			CancellationLimitHours:    1,
			LoyaltyEnabled:            true,
			WalkInEnabled:             true,
			SameDayBookingEnabled:     true,
			MaxWeeklyCustomerBookings: 2,
		}
		if err := s.repo.CreateTenantSettings(txCtx, settings); err != nil {
			return status.Errorf(codes.Internal, "create tenant settings: %v", err)
		}

		adminUser := &TenantUser{
			ID:           adminID,
			TenantID:     tenantID,
			Email:        in.AdminEmail,
			PasswordHash: string(hash),
			FirstName:    "Admin",
			LastName:     "",
			Role:         "admin",
			Status:       "active",
		}
		if err := s.repo.CreateTenantUser(txCtx, adminUser); err != nil {
			return status.Errorf(codes.Internal, "create admin user: %v", err)
		}

		return nil
	})
	if err != nil {
		return CreateTenantResult{}, err
	}

	return CreateTenantResult{TenantID: tenantID, AdminUserID: adminID}, nil
}

func (s *Service) ListTenants(ctx context.Context, page, pageSize int) ([]*Tenant, int64, int32, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	tenants, total, err := s.repo.ListTenants(ctx, page, pageSize)
	if err != nil {
		return nil, 0, 0, status.Errorf(codes.Internal, "list tenants: %v", err)
	}

	out := make([]*Tenant, len(tenants))
	for i := range tenants {
		out[i] = &tenants[i]
	}
	totalPages := int32(math.Ceil(float64(total) / float64(pageSize)))
	return out, total, totalPages, nil
}

func (s *Service) GetTenant(ctx context.Context, id uuid.UUID) (*Tenant, error) {
	t, err := s.repo.GetTenantByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "tenant not found")
		}
		return nil, status.Errorf(codes.Internal, "get tenant: %v", err)
	}
	return t, nil
}

func (s *Service) SetTenantStatus(ctx context.Context, tenantID uuid.UUID, tenantStatus string) error {
	valid := map[string]bool{"active": true, "frozen": true, "disabled": true}
	if !valid[tenantStatus] {
		return status.Errorf(codes.InvalidArgument, "invalid status %q", tenantStatus)
	}
	if err := s.repo.UpdateTenantStatus(ctx, tenantID, tenantStatus); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "tenant not found")
		}
		return status.Errorf(codes.Internal, "update status: %v", err)
	}
	return nil
}

func (s *Service) UpdateTenant(ctx context.Context, in UpdateTenantInput) (*Tenant, error) {
	updates := map[string]interface{}{}
	if in.Name != "" {
		updates["name"] = in.Name
	}
	if in.Timezone != "" {
		updates["timezone"] = in.Timezone
	}
	if in.PhoneNumber != "" {
		updates["phone_number"] = in.PhoneNumber
	}
	if in.Address != "" {
		updates["address"] = in.Address
	}
	if in.Latitude != nil {
		updates["latitude"] = *in.Latitude
	}
	if in.Longitude != nil {
		updates["longitude"] = *in.Longitude
	}
	t, err := s.repo.UpdateTenant(ctx, in.TenantID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "tenant not found")
		}
		return nil, status.Errorf(codes.Internal, "update tenant: %v", err)
	}
	return t, nil
}

// ── Tenant Users ──────────────────────────────────────────────────────────────

func (s *Service) CreateTenantUser(ctx context.Context, in CreateTenantUserInput) (uuid.UUID, error) {
	if in.Email == "" {
		return uuid.Nil, status.Error(codes.InvalidArgument, "email is required")
	}
	validRoles := map[string]bool{"admin": true, "staff": true}
	if !validRoles[in.Role] {
		return uuid.Nil, status.Errorf(codes.InvalidArgument, "invalid role %q: must be admin or staff", in.Role)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return uuid.Nil, status.Errorf(codes.Internal, "hash password: %v", err)
	}
	user := &TenantUser{
		ID:           uuid.New(),
		TenantID:     in.TenantID,
		Email:        in.Email,
		PasswordHash: string(hash),
		FirstName:    in.FirstName,
		LastName:     in.LastName,
		Role:         in.Role,
		Status:       "active",
	}
	if err := s.repo.CreateTenantUser(ctx, user); err != nil {
		return uuid.Nil, translateUniqueErr(err, "email", "email already exists in tenant")
	}
	return user.ID, nil
}

func (s *Service) ListTenantUsers(ctx context.Context, tenantID uuid.UUID, role, userStatus string, page, pageSize int) ([]*TenantUser, int64, int32, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	users, total, err := s.repo.ListTenantUsers(ctx, tenantID, role, userStatus, page, pageSize)
	if err != nil {
		return nil, 0, 0, status.Errorf(codes.Internal, "list users: %v", err)
	}
	out := make([]*TenantUser, len(users))
	for i := range users {
		out[i] = &users[i]
	}
	totalPages := int32(math.Ceil(float64(total) / float64(pageSize)))
	return out, total, totalPages, nil
}

func (s *Service) DisableTenantUser(ctx context.Context, tenantID, userID uuid.UUID) error {
	if _, err := s.repo.GetTenantUserByID(ctx, tenantID, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "user not found")
		}
		return status.Errorf(codes.Internal, "get user: %v", err)
	}
	if err := s.repo.UpdateTenantUserStatus(ctx, tenantID, userID, "disabled"); err != nil {
		return status.Errorf(codes.Internal, "disable user: %v", err)
	}
	return nil
}

func (s *Service) EnableTenantUser(ctx context.Context, tenantID, userID uuid.UUID) error {
	if _, err := s.repo.GetTenantUserByID(ctx, tenantID, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "user not found")
		}
		return status.Errorf(codes.Internal, "get user: %v", err)
	}
	if err := s.repo.UpdateTenantUserStatus(ctx, tenantID, userID, "active"); err != nil {
		return status.Errorf(codes.Internal, "enable user: %v", err)
	}
	return nil
}

// ── Public Bootstrap ──────────────────────────────────────────────────────────

type PublicBootstrapResult struct {
	Tenant   *Tenant
	Settings *TenantSettings
	Branding *TenantBranding
}

func (s *Service) GetPublicBootstrap(ctx context.Context, tenantID uuid.UUID) (*PublicBootstrapResult, error) {
	t, err := s.repo.GetTenantByID(ctx, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "tenant not found")
		}
		return nil, status.Errorf(codes.Internal, "get tenant: %v", err)
	}
	if t.Status != "active" {
		return nil, status.Error(codes.NotFound, "tenant not found")
	}

	settings, err := s.repo.GetTenantSettings(ctx, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			settings = &TenantSettings{}
		} else {
			return nil, status.Errorf(codes.Internal, "get settings: %v", err)
		}
	}

	branding, err := s.repo.GetTenantBranding(ctx, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			branding = &TenantBranding{TenantID: tenantID}
		} else {
			return nil, status.Errorf(codes.Internal, "get branding: %v", err)
		}
	}

	return &PublicBootstrapResult{Tenant: t, Settings: settings, Branding: branding}, nil
}

// ── Tenant Branding ───────────────────────────────────────────────────────────

func (s *Service) GetTenantBranding(ctx context.Context, tenantID uuid.UUID) (*TenantBranding, error) {
	b, err := s.repo.GetTenantBranding(ctx, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return empty branding — not an error.
			return &TenantBranding{TenantID: tenantID}, nil
		}
		return nil, status.Errorf(codes.Internal, "get branding: %v", err)
	}
	return b, nil
}

func (s *Service) UpdateTenantBranding(ctx context.Context, tenantID uuid.UUID, in TenantBrandingUpdate) (*TenantBranding, error) {
	updates := map[string]interface{}{}
	if in.LogoURL != "" {
		updates["logo_url"] = in.LogoURL
	}
	if in.PrimaryColor != "" {
		updates["primary_color"] = in.PrimaryColor
	}
	if in.SecondaryColor != "" {
		updates["secondary_color"] = in.SecondaryColor
	}
	if in.TertiaryColor != "" {
		updates["tertiary_color"] = in.TertiaryColor
	}
	b, err := s.repo.UpsertTenantBranding(ctx, tenantID, updates)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "update branding: %v", err)
	}
	return b, nil
}

// ── Tenant Settings ───────────────────────────────────────────────────────────

func (s *Service) GetTenantSettings(ctx context.Context, tenantID uuid.UUID) (*TenantSettings, error) {
	settings, err := s.repo.GetTenantSettings(ctx, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "settings not found")
		}
		return nil, status.Errorf(codes.Internal, "get settings: %v", err)
	}
	return settings, nil
}

func (s *Service) UpdateTenantSettings(ctx context.Context, tenantID uuid.UUID, in TenantSettingsUpdate) (*TenantSettings, error) {
	updates := map[string]interface{}{
		"notification_reminder_hours":  in.NotificationReminderHours,
		"cancellation_limit_hours":     in.CancellationLimitHours,
		"loyalty_enabled":              in.LoyaltyEnabled,
		"walk_in_enabled":              in.WalkInEnabled,
		"same_day_booking_enabled":     in.SameDayBookingEnabled,
		"max_weekly_customer_bookings": in.MaxWeeklyCustomerBookings,
	}
	settings, err := s.repo.UpdateTenantSettings(ctx, tenantID, updates)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "update settings: %v", err)
	}
	return settings, nil
}

// ── Services Catalog ──────────────────────────────────────────────────────────

func (s *Service) ListServices(ctx context.Context, tenantID uuid.UUID) ([]*CatalogService, error) {
	svcs, err := s.repo.ListServices(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list services: %v", err)
	}
	out := make([]*CatalogService, len(svcs))
	for i := range svcs {
		out[i] = &svcs[i]
	}
	return out, nil
}

func (s *Service) CreateService(ctx context.Context, in CreateServiceInput) (*CatalogService, error) {
	if in.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if in.DurationMinutes <= 0 {
		return nil, status.Error(codes.InvalidArgument, "duration_minutes must be positive")
	}
	price := in.BasePrice
	if price == "" {
		price = "0.00"
	}
	svc := &CatalogService{
		ID:              uuid.New(),
		TenantID:        in.TenantID,
		Name:            in.Name,
		DurationMinutes: int(in.DurationMinutes),
		BasePrice:       price,
		PointsReward:    int(in.PointsReward),
		IsActive:        true,
	}
	if in.Description != "" {
		svc.Description = &in.Description
	}
	if in.CategoryName != "" {
		svc.CategoryName = &in.CategoryName
	}
	if err := s.repo.CreateService(ctx, svc); err != nil {
		return nil, status.Errorf(codes.Internal, "create service: %v", err)
	}
	return svc, nil
}

func (s *Service) UpdateService(ctx context.Context, in UpdateServiceInput) (*CatalogService, error) {
	updates := map[string]interface{}{
		"name":             in.Name,
		"duration_minutes": in.DurationMinutes,
		"base_price":       in.BasePrice,
		"points_reward":    in.PointsReward,
		"is_active":        in.IsActive,
	}
	if in.Description != "" {
		updates["description"] = in.Description
	}
	if in.CategoryName != "" {
		updates["category_name"] = in.CategoryName
	}
	svc, err := s.repo.UpdateService(ctx, in.TenantID, in.ServiceID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "service not found")
		}
		return nil, status.Errorf(codes.Internal, "update service: %v", err)
	}
	return svc, nil
}

// ── Staff CRUD ───────────────────────────────────────────────────────────────

func (s *Service) GetStaffMember(ctx context.Context, tenantID, staffID uuid.UUID) (*TenantUser, error) {
	u, err := s.repo.GetTenantUserByID(ctx, tenantID, staffID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "staff member not found")
		}
		return nil, status.Errorf(codes.Internal, "get staff: %v", err)
	}
	return u, nil
}

type UpdateStaffMemberInput struct {
	TenantID  uuid.UUID
	StaffID   uuid.UUID
	FirstName string
	LastName  string
	Email     string
	Password  string
}

func (s *Service) UpdateStaffMember(ctx context.Context, in UpdateStaffMemberInput) (*TenantUser, error) {
	updates := map[string]interface{}{}
	if in.FirstName != "" {
		updates["first_name"] = in.FirstName
	}
	if in.LastName != "" {
		updates["last_name"] = in.LastName
	}
	if in.Email != "" {
		updates["email"] = in.Email
	}
	if in.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "hash password: %v", err)
		}
		updates["password_hash"] = string(hash)
	}
	if len(updates) == 0 {
		return s.GetStaffMember(ctx, in.TenantID, in.StaffID)
	}
	u, err := s.repo.UpdateTenantUser(ctx, in.TenantID, in.StaffID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "staff member not found")
		}
		return nil, status.Errorf(codes.Internal, "update staff: %v", err)
	}
	return u, nil
}

func (s *Service) DeleteStaffMember(ctx context.Context, tenantID, staffID uuid.UUID) error {
	if err := s.repo.DeleteTenantUser(ctx, tenantID, staffID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "staff member not found")
		}
		return status.Errorf(codes.Internal, "delete staff: %v", err)
	}
	return nil
}

func (s *Service) SetStaffStatus(ctx context.Context, tenantID, staffID uuid.UUID, staffStatus string) error {
	valid := map[string]bool{"active": true, "disabled": true}
	if !valid[staffStatus] {
		return status.Errorf(codes.InvalidArgument, "invalid status %q", staffStatus)
	}
	if err := s.repo.UpdateTenantUserStatus(ctx, tenantID, staffID, staffStatus); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "staff member not found")
		}
		return status.Errorf(codes.Internal, "set staff status: %v", err)
	}
	return nil
}

// ── Staff Services ──────────────────────────────────────────────────────────

func (s *Service) GetStaffServices(ctx context.Context, tenantID, staffID uuid.UUID) ([]StaffServiceAssignment, error) {
	assignments, err := s.repo.ListStaffServices(ctx, tenantID, staffID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list staff services: %v", err)
	}
	return assignments, nil
}

func (s *Service) SetStaffServices(ctx context.Context, tenantID, staffID uuid.UUID, serviceIDs []uuid.UUID) error {
	// Verify staff exists.
	if _, err := s.repo.GetTenantUserByID(ctx, tenantID, staffID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "staff member not found")
		}
		return status.Errorf(codes.Internal, "get staff: %v", err)
	}
	if err := s.repo.SetStaffServices(ctx, tenantID, staffID, serviceIDs); err != nil {
		return status.Errorf(codes.Internal, "set staff services: %v", err)
	}
	return nil
}

// ── Schedule Rules ──────────────────────────────────────────────────────────

func (s *Service) ListScheduleRules(ctx context.Context, tenantID, staffID uuid.UUID) ([]ScheduleRule, error) {
	rules, err := s.repo.ListScheduleRules(ctx, tenantID, staffID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list schedule rules: %v", err)
	}
	return rules, nil
}

type CreateScheduleRuleInput struct {
	TenantID            uuid.UUID
	StaffID             uuid.UUID
	DayOfWeek           int32
	StartTime           string
	EndTime             string
	SlotIntervalMinutes int32
	IsWorkingDay        bool
}

func (s *Service) CreateScheduleRule(ctx context.Context, in CreateScheduleRuleInput) (*ScheduleRule, error) {
	if in.DayOfWeek < 0 || in.DayOfWeek > 6 {
		return nil, status.Error(codes.InvalidArgument, "day_of_week must be between 0 and 6")
	}
	if in.StartTime == "" || in.EndTime == "" {
		return nil, status.Error(codes.InvalidArgument, "start_time and end_time are required")
	}
	rule := &ScheduleRule{
		ID:                  uuid.New(),
		TenantID:            in.TenantID,
		StaffUserID:         in.StaffID,
		DayOfWeek:           int(in.DayOfWeek),
		StartTime:           in.StartTime,
		EndTime:             in.EndTime,
		SlotIntervalMinutes: int(in.SlotIntervalMinutes),
		IsWorkingDay:        in.IsWorkingDay,
	}
	if rule.SlotIntervalMinutes <= 0 {
		rule.SlotIntervalMinutes = 30
	}
	if err := s.repo.CreateScheduleRule(ctx, rule); err != nil {
		return nil, translateUniqueErr(err, "schedule_rule", "schedule rule already exists for this day")
	}
	return rule, nil
}

type UpdateScheduleRuleInput struct {
	TenantID            uuid.UUID
	StaffID             uuid.UUID
	RuleID              uuid.UUID
	StartTime           string
	EndTime             string
	SlotIntervalMinutes int32
	IsWorkingDay        bool
}

func (s *Service) UpdateScheduleRule(ctx context.Context, in UpdateScheduleRuleInput) (*ScheduleRule, error) {
	updates := map[string]interface{}{
		"is_working_day": in.IsWorkingDay,
	}
	if in.StartTime != "" {
		updates["start_time"] = in.StartTime
	}
	if in.EndTime != "" {
		updates["end_time"] = in.EndTime
	}
	if in.SlotIntervalMinutes > 0 {
		updates["slot_interval_minutes"] = in.SlotIntervalMinutes
	}
	rule, err := s.repo.UpdateScheduleRule(ctx, in.TenantID, in.RuleID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "schedule rule not found")
		}
		return nil, status.Errorf(codes.Internal, "update schedule rule: %v", err)
	}
	return rule, nil
}

func (s *Service) DeleteScheduleRule(ctx context.Context, tenantID, ruleID uuid.UUID) error {
	if err := s.repo.DeleteScheduleRule(ctx, tenantID, ruleID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "schedule rule not found")
		}
		return status.Errorf(codes.Internal, "delete schedule rule: %v", err)
	}
	return nil
}

// ── Time Offs ───────────────────────────────────────────────────────────────

func (s *Service) ListTimeOffs(ctx context.Context, tenantID, staffID uuid.UUID) ([]TimeOff, error) {
	timeOffs, err := s.repo.ListTimeOffs(ctx, tenantID, staffID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list time offs: %v", err)
	}
	return timeOffs, nil
}

type CreateTimeOffInput struct {
	TenantID uuid.UUID
	StaffID  uuid.UUID
	StartAt  string
	EndAt    string
	Reason   string
	Type     string
}

func (s *Service) CreateTimeOff(ctx context.Context, in CreateTimeOffInput) (*TimeOff, error) {
	validTypes := map[string]bool{"leave": true, "holiday": true, "closure": true}
	if !validTypes[in.Type] {
		return nil, status.Errorf(codes.InvalidArgument, "invalid type %q: must be leave, holiday, or closure", in.Type)
	}
	startAt, err := time.Parse(time.RFC3339, in.StartAt)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid start_at: %v", err)
	}
	endAt, err := time.Parse(time.RFC3339, in.EndAt)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid end_at: %v", err)
	}
	if !endAt.After(startAt) {
		return nil, status.Error(codes.InvalidArgument, "end_at must be after start_at")
	}
	t := &TimeOff{
		ID:          uuid.New(),
		TenantID:    in.TenantID,
		StaffUserID: in.StaffID,
		StartAt:     startAt,
		EndAt:       endAt,
		Type:        in.Type,
	}
	if in.Reason != "" {
		t.Reason = &in.Reason
	}
	if err := s.repo.CreateTimeOff(ctx, t); err != nil {
		return nil, status.Errorf(codes.Internal, "create time off: %v", err)
	}
	return t, nil
}

type UpdateTimeOffInput struct {
	TenantID  uuid.UUID
	StaffID   uuid.UUID
	TimeOffID uuid.UUID
	StartAt   string
	EndAt     string
	Reason    string
}

func (s *Service) UpdateTimeOff(ctx context.Context, in UpdateTimeOffInput) (*TimeOff, error) {
	updates := map[string]interface{}{}
	if in.StartAt != "" {
		startAt, err := time.Parse(time.RFC3339, in.StartAt)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid start_at: %v", err)
		}
		updates["start_at"] = startAt
	}
	if in.EndAt != "" {
		endAt, err := time.Parse(time.RFC3339, in.EndAt)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid end_at: %v", err)
		}
		updates["end_at"] = endAt
	}
	if in.Reason != "" {
		updates["reason"] = in.Reason
	}
	t, err := s.repo.UpdateTimeOff(ctx, in.TenantID, in.TimeOffID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "time off not found")
		}
		return nil, status.Errorf(codes.Internal, "update time off: %v", err)
	}
	return t, nil
}

func (s *Service) DeleteTimeOff(ctx context.Context, tenantID, timeOffID uuid.UUID) error {
	if err := s.repo.DeleteTimeOff(ctx, tenantID, timeOffID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "time off not found")
		}
		return status.Errorf(codes.Internal, "delete time off: %v", err)
	}
	return nil
}

// ── Staff Calendar ──────────────────────────────────────────────────────────

func (s *Service) GetStaffCalendar(ctx context.Context, tenantID, staffID uuid.UUID, date, view string) ([]StaffCalendarAppointment, error) {
	if date == "" {
		date = time.Now().UTC().Format("2006-01-02")
	}
	if view == "" {
		view = "day"
	}

	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid date: %v", err)
	}

	var from, to time.Time
	switch view {
	case "day":
		from = t
		to = t.AddDate(0, 0, 1)
	case "week":
		// Shift to Monday.
		weekday := int(t.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		from = t.AddDate(0, 0, -(weekday - 1))
		to = from.AddDate(0, 0, 7)
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid view %q: must be day or week", view)
	}

	appts, err := s.repo.ListAppointmentsByStaffAndDateRange(ctx, tenantID, staffID, from.Format(time.RFC3339), to.Format(time.RFC3339))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get calendar: %v", err)
	}
	return appts, nil
}

// ── Analytics ────────────────────────────────────────────────────────────────

type AnalyticsOverview struct {
	TotalAppointments     int
	CompletedAppointments int
	CancelledAppointments int
	NoShowRate            float64
	NoShowRateChange      string
	TotalRevenue          string
	AppointmentsChange    string

	ActiveCustomers int
	ReturningRate   float64
	VisitFrequency  float64

	StaffUtilization float64
	PopularServices  []PopularServiceResult

	RewardsRedeemed int
	RedeemedChange  string
	LoyaltyProgress int
}

func (s *Service) GetAnalyticsOverview(ctx context.Context, tenantID uuid.UUID, rangeType string) (*AnalyticsOverview, error) {
	if rangeType == "" {
		rangeType = "monthly"
	}

	now := time.Now().UTC()
	var from, to, prevFrom, prevTo time.Time

	switch rangeType {
	case "daily":
		from = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		to = from.AddDate(0, 0, 1)
		prevFrom = from.AddDate(0, 0, -1)
		prevTo = from
	case "weekly":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7
		}
		from = time.Date(now.Year(), now.Month(), now.Day()-(weekday-1), 0, 0, 0, 0, time.UTC)
		to = from.AddDate(0, 0, 7)
		prevFrom = from.AddDate(0, 0, -7)
		prevTo = from
	case "monthly":
		from = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		to = from.AddDate(0, 1, 0)
		prevFrom = from.AddDate(0, -1, 0)
		prevTo = from
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid range %q: must be daily, weekly, or monthly", rangeType)
	}

	fromStr := from.Format(time.RFC3339)
	toStr := to.Format(time.RFC3339)
	prevFromStr := prevFrom.Format(time.RFC3339)
	prevToStr := prevTo.Format(time.RFC3339)

	result, err := s.repo.GetAnalytics(ctx, tenantID, fromStr, toStr)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get analytics: %v", err)
	}

	// No-show rate.
	var noShowRate float64
	if result.TotalAppointments > 0 {
		noShowRate = float64(result.NoShowCount) / float64(result.TotalAppointments) * 100
	}

	// No-show rate change vs previous period.
	prevNoShows, prevTotal, _ := s.repo.GetPreviousPeriodNoShowCount(ctx, tenantID, prevFromStr, prevToStr)
	var prevNoShowRate float64
	if prevTotal > 0 {
		prevNoShowRate = float64(prevNoShows) / float64(prevTotal) * 100
	}
	noShowRateChange := computeRateChange(noShowRate, prevNoShowRate)

	// Appointments change vs previous period.
	prevCount, _ := s.repo.GetPreviousPeriodAppointmentCount(ctx, tenantID, prevFromStr, prevToStr)
	appointmentsChange := computeChange(result.TotalAppointments, prevCount)

	// Returning rate.
	var returningRate float64
	if result.TotalVisits > 0 {
		returningRate = float64(result.ReturningCustomers) / float64(result.TotalVisits) * 100
	}

	// Visit frequency.
	var visitFrequency float64
	if result.ActiveCustomers > 0 {
		visitFrequency = float64(result.TotalAppointments) / float64(result.ActiveCustomers)
	}

	// Popular services (relative bar width is computed in GetAnalyticsOverview handler as Progress).
	popular, _ := s.repo.GetPopularServices(ctx, tenantID, fromStr, toStr, 5)

	// Redeemed change.
	prevRedeemed, _ := s.repo.GetPreviousPeriodRedeemCount(ctx, tenantID, prevFromStr, prevToStr)
	redeemedChange := computeChange(result.RewardsRedeemed, prevRedeemed)

	// Loyalty progress: percentage of active customers who have a wallet.
	// Simplified: use returning rate as proxy.
	loyaltyProgress := int(math.Min(returningRate, 100))

	// Staff utilization: booked minutes as a percentage of available working minutes.
	var staffUtilization float64
	availMins, bookedMins, _ := s.repo.GetStaffUtilization(ctx, tenantID, fromStr, toStr)
	if availMins > 0 {
		staffUtilization = math.Min(math.Round(bookedMins/availMins*100*10)/10, 100)
	}

	return &AnalyticsOverview{
		TotalAppointments:     result.TotalAppointments,
		CompletedAppointments: result.CompletedAppointments,
		CancelledAppointments: result.CancelledAppointments,
		NoShowRate:            math.Round(noShowRate*10) / 10,
		NoShowRateChange:      noShowRateChange,
		TotalRevenue:          result.TotalRevenue,
		AppointmentsChange:    appointmentsChange,
		ActiveCustomers:       result.ActiveCustomers,
		ReturningRate:         math.Round(returningRate*10) / 10,
		VisitFrequency:        math.Round(visitFrequency*10) / 10,
		StaffUtilization:      staffUtilization,
		PopularServices:       popular,
		RewardsRedeemed:       result.RewardsRedeemed,
		RedeemedChange:        redeemedChange,
		LoyaltyProgress:       loyaltyProgress,
	}, nil
}

func computeChange(current, previous int) string {
	if previous == 0 {
		if current > 0 {
			return "+100%"
		}
		return "0%"
	}
	pct := float64(current-previous) / float64(previous) * 100
	rounded := int(math.Round(pct))
	if rounded >= 0 {
		return fmt.Sprintf("+%d%%", rounded)
	}
	return fmt.Sprintf("%d%%", rounded)
}

func computeRateChange(current, previous float64) string {
	diff := current - previous
	rounded := int(math.Round(diff))
	if rounded >= 0 {
		return fmt.Sprintf("+%d%%", rounded)
	}
	return fmt.Sprintf("%d%%", rounded)
}

// formatTime is used by the handler for proto marshaling.
func formatTime(t time.Time) string {
	return t.UTC().Format(time.RFC3339)
}
