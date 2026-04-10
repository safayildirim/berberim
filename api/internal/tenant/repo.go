package tenant

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/berberim/api/internal/txctx"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) RunInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return txctx.RunInTx(ctx, r.db, fn)
}

func (r *Repo) dbForCtx(ctx context.Context) *gorm.DB {
	return txctx.DBForCtx(ctx, r.db)
}

func (r *Repo) CreateTenant(ctx context.Context, t *Tenant) error {
	return r.dbForCtx(ctx).Create(t).Error
}

func (r *Repo) CreateTenantSettings(ctx context.Context, s *TenantSettings) error {
	return r.dbForCtx(ctx).Create(s).Error
}

func (r *Repo) GetTenantByID(ctx context.Context, id uuid.UUID) (*Tenant, error) {
	var t Tenant
	err := r.dbForCtx(ctx).Where("id = ?", id).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repo) GetTenantBySlug(ctx context.Context, slug string) (*Tenant, error) {
	var t Tenant
	err := r.dbForCtx(ctx).Where("slug = ?", slug).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repo) ListTenants(ctx context.Context, page, pageSize int) ([]Tenant, int64, error) {
	var tenants []Tenant
	var total int64
	offset := (page - 1) * pageSize
	q := r.dbForCtx(ctx).Model(&Tenant{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tenants).Error
	return tenants, total, err
}

func (r *Repo) UpdateTenant(ctx context.Context, id uuid.UUID, updates map[string]interface{}) (*Tenant, error) {
	result := r.dbForCtx(ctx).Model(&Tenant{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return r.GetTenantByID(ctx, id)
}

func (r *Repo) UpdateTenantStatus(ctx context.Context, id uuid.UUID, status string) error {
	result := r.dbForCtx(ctx).Model(&Tenant{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repo) CreateTenantUser(ctx context.Context, u *TenantUser) error {
	return r.dbForCtx(ctx).Create(u).Error
}

func (r *Repo) GetTenantUserByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*TenantUser, error) {
	var u TenantUser
	err := r.dbForCtx(ctx).Where("tenant_id = ? AND email = ?", tenantID, email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) GetTenantUserByID(ctx context.Context, tenantID, userID uuid.UUID) (*TenantUser, error) {
	var u TenantUser
	err := r.dbForCtx(ctx).Raw(`
		SELECT tu.*,
			COALESCE(AVG(sr.rating), 0) AS avg_rating,
			COUNT(DISTINCT sr.id) AS review_count
		FROM tenant_users tu
		LEFT JOIN staff_reviews sr ON sr.staff_user_id = tu.id AND sr.tenant_id = tu.tenant_id
		WHERE tu.tenant_id = ? AND tu.id = ?
		GROUP BY tu.id
	`, tenantID, userID).Scan(&u).Error
	if err != nil {
		return nil, err
	}
	if u.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &u, nil
}

func (r *Repo) ListTenantUsers(ctx context.Context, tenantID uuid.UUID, role, status string, page, pageSize int) ([]TenantUser, int64, error) {
	where := "tu.tenant_id = ?"
	args := []interface{}{tenantID}
	if role != "" {
		where += " AND tu.role = ?"
		args = append(args, role)
	}
	if status != "" {
		where += " AND tu.status = ?"
		args = append(args, status)
	}

	var total int64
	if err := r.dbForCtx(ctx).Raw(
		"SELECT COUNT(*) FROM tenant_users tu WHERE "+where, args...,
	).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	dataArgs := append(args, pageSize, offset)
	var users []TenantUser
	err := r.dbForCtx(ctx).Raw(`
		SELECT tu.*,
			COALESCE(AVG(sr.rating), 0) AS avg_rating,
			COUNT(DISTINCT sr.id) AS review_count
		FROM tenant_users tu
		LEFT JOIN staff_reviews sr ON sr.staff_user_id = tu.id AND sr.tenant_id = tu.tenant_id
		WHERE `+where+`
		GROUP BY tu.id
		ORDER BY tu.created_at DESC
		LIMIT ? OFFSET ?
	`, dataArgs...).Scan(&users).Error
	return users, total, err
}

// ── Tenant Settings ───────────────────────────────────────────────────────────

func (r *Repo) GetTenantSettings(ctx context.Context, tenantID uuid.UUID) (*TenantSettings, error) {
	var s TenantSettings
	err := r.dbForCtx(ctx).Where("tenant_id = ?", tenantID).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repo) UpdateTenantSettings(ctx context.Context, tenantID uuid.UUID, updates map[string]interface{}) (*TenantSettings, error) {
	result := r.dbForCtx(ctx).Model(&TenantSettings{}).
		Where("tenant_id = ?", tenantID).
		Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	return r.GetTenantSettings(ctx, tenantID)
}

// ── Services Catalog ──────────────────────────────────────────────────────────

func (r *Repo) ListServices(ctx context.Context, tenantID uuid.UUID) ([]CatalogService, error) {
	var svcs []CatalogService
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND is_active = true", tenantID).
		Order("name").
		Find(&svcs).Error
	return svcs, err
}

func (r *Repo) CreateService(ctx context.Context, s *CatalogService) error {
	return r.dbForCtx(ctx).Create(s).Error
}

func (r *Repo) GetServiceByID(ctx context.Context, tenantID, serviceID uuid.UUID) (*CatalogService, error) {
	var s CatalogService
	err := r.dbForCtx(ctx).Where("tenant_id = ? AND id = ?", tenantID, serviceID).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repo) UpdateService(ctx context.Context, tenantID, serviceID uuid.UUID, updates map[string]interface{}) (*CatalogService, error) {
	result := r.dbForCtx(ctx).Model(&CatalogService{}).
		Where("tenant_id = ? AND id = ?", tenantID, serviceID).
		Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	return r.GetServiceByID(ctx, tenantID, serviceID)
}

// ── Tenant Branding ───────────────────────────────────────────────────────────

func (r *Repo) GetTenantBranding(ctx context.Context, tenantID uuid.UUID) (*TenantBranding, error) {
	var b TenantBranding
	err := r.dbForCtx(ctx).Where("tenant_id = ?", tenantID).First(&b).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *Repo) UpsertTenantBranding(ctx context.Context, tenantID uuid.UUID, updates map[string]interface{}) (*TenantBranding, error) {
	// Ensure row exists first.
	var existing TenantBranding
	err := r.dbForCtx(ctx).Where("tenant_id = ?", tenantID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		existing = TenantBranding{ID: uuid.New(), TenantID: tenantID}
		if err := r.dbForCtx(ctx).Create(&existing).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	result := r.dbForCtx(ctx).Model(&TenantBranding{}).
		Where("tenant_id = ?", tenantID).
		Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	return r.GetTenantBranding(ctx, tenantID)
}

// ── Avatar repo interface ────────────────────────────────────────────────────

func (r *Repo) GetAvatarKey(ctx context.Context, tenantID, userID uuid.UUID) (string, error) {
	u, err := r.GetTenantUserByID(ctx, tenantID, userID)
	if err != nil {
		return "", err
	}
	if u.AvatarKey != nil {
		return *u.AvatarKey, nil
	}
	return "", nil
}

func (r *Repo) SetAvatarKey(ctx context.Context, tenantID, userID uuid.UUID, avatarKey string) error {
	_, err := r.UpdateTenantUser(ctx, tenantID, userID, map[string]interface{}{"avatar_key": avatarKey})
	return err
}

// ── Tenant Users (existing, continued) ───────────────────────────────────────

func (r *Repo) UpdateTenantUser(ctx context.Context, tenantID, userID uuid.UUID, updates map[string]interface{}) (*TenantUser, error) {
	result := r.dbForCtx(ctx).Model(&TenantUser{}).
		Where("tenant_id = ? AND id = ?", tenantID, userID).
		Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return r.GetTenantUserByID(ctx, tenantID, userID)
}

func (r *Repo) DeleteTenantUser(ctx context.Context, tenantID, userID uuid.UUID) error {
	result := r.dbForCtx(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, userID).
		Delete(&TenantUser{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ── Schedule Rules ──────────────────────────────────────────────────────────

func (r *Repo) ListScheduleRules(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ScheduleRule, error) {
	var rules []ScheduleRule
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Order("day_of_week").
		Find(&rules).Error
	return rules, err
}

func (r *Repo) CreateScheduleRule(ctx context.Context, rule *ScheduleRule) error {
	return r.dbForCtx(ctx).Create(rule).Error
}

func (r *Repo) GetScheduleRuleByID(ctx context.Context, tenantID, ruleID uuid.UUID) (*ScheduleRule, error) {
	var rule ScheduleRule
	err := r.dbForCtx(ctx).Where("tenant_id = ? AND id = ?", tenantID, ruleID).First(&rule).Error
	if err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *Repo) UpdateScheduleRule(ctx context.Context, tenantID, ruleID uuid.UUID, updates map[string]interface{}) (*ScheduleRule, error) {
	result := r.dbForCtx(ctx).Model(&ScheduleRule{}).
		Where("tenant_id = ? AND id = ?", tenantID, ruleID).
		Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return r.GetScheduleRuleByID(ctx, tenantID, ruleID)
}

func (r *Repo) DeleteScheduleRule(ctx context.Context, tenantID, ruleID uuid.UUID) error {
	result := r.dbForCtx(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, ruleID).
		Delete(&ScheduleRule{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ── Time Offs ───────────────────────────────────────────────────────────────

func (r *Repo) ListTimeOffs(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]TimeOff, error) {
	var timeOffs []TimeOff
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Order("start_at").
		Find(&timeOffs).Error
	return timeOffs, err
}

func (r *Repo) CreateTimeOff(ctx context.Context, t *TimeOff) error {
	return r.dbForCtx(ctx).Create(t).Error
}

func (r *Repo) GetTimeOffByID(ctx context.Context, tenantID, timeOffID uuid.UUID) (*TimeOff, error) {
	var t TimeOff
	err := r.dbForCtx(ctx).Where("tenant_id = ? AND id = ?", tenantID, timeOffID).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repo) UpdateTimeOff(ctx context.Context, tenantID, timeOffID uuid.UUID, updates map[string]interface{}) (*TimeOff, error) {
	result := r.dbForCtx(ctx).Model(&TimeOff{}).
		Where("tenant_id = ? AND id = ?", tenantID, timeOffID).
		Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return r.GetTimeOffByID(ctx, tenantID, timeOffID)
}

func (r *Repo) DeleteTimeOff(ctx context.Context, tenantID, timeOffID uuid.UUID) error {
	result := r.dbForCtx(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, timeOffID).
		Delete(&TimeOff{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ── Staff Services ──────────────────────────────────────────────────────────

func (r *Repo) ListStaffServices(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]StaffServiceAssignment, error) {
	var assignments []StaffServiceAssignment
	err := r.dbForCtx(ctx).Raw(`
		SELECT ss.*, s.name AS service_name
		FROM staff_services ss
		JOIN services s ON s.id = ss.service_id
		WHERE ss.tenant_id = ? AND ss.staff_user_id = ?
		ORDER BY s.name
	`, tenantID, staffUserID).Scan(&assignments).Error
	return assignments, err
}

func (r *Repo) SetStaffServices(ctx context.Context, tenantID, staffUserID uuid.UUID, serviceIDs []uuid.UUID) error {
	db := r.dbForCtx(ctx)

	// Remove existing assignments.
	if err := db.Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Delete(&StaffServiceAssignment{}).Error; err != nil {
		return err
	}

	// Insert new assignments.
	for _, sid := range serviceIDs {
		a := &StaffServiceAssignment{
			ID:          uuid.New(),
			TenantID:    tenantID,
			StaffUserID: staffUserID,
			ServiceID:   sid,
			IsActive:    true,
		}
		if err := db.Create(a).Error; err != nil {
			return err
		}
	}
	return nil
}

// ── Staff Calendar ──────────────────────────────────────────────────────────

func (r *Repo) ListAppointmentsByStaffAndDateRange(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to string) ([]StaffCalendarAppointment, error) {
	var appts []StaffCalendarAppointment
	err := r.dbForCtx(ctx).Raw(`
		SELECT a.id, a.tenant_id, a.customer_id, a.staff_user_id,
			a.starts_at, a.ends_at, a.status, a.created_via,
			a.created_at, a.updated_at,
			c.first_name AS customer_first_name,
			c.last_name AS customer_last_name
		FROM appointments a
		LEFT JOIN customers c ON c.id = a.customer_id
		WHERE a.tenant_id = ? AND a.staff_user_id = ?
			AND a.starts_at >= ? AND a.starts_at < ?
			AND a.status NOT IN ('cancelled')
		ORDER BY a.starts_at
	`, tenantID, staffUserID, from, to).Scan(&appts).Error
	return appts, err
}

// ── Analytics ────────────────────────────────────────────────────────────────

func (r *Repo) GetAnalytics(ctx context.Context, tenantID uuid.UUID, from, to string) (*AnalyticsResult, error) {
	var result AnalyticsResult
	err := r.dbForCtx(ctx).Raw(`
		SELECT
			COUNT(*)                                              AS total_appointments,
			COUNT(*) FILTER (WHERE status = 'completed')          AS completed_appointments,
			COUNT(*) FILTER (WHERE status = 'cancelled')          AS cancelled_appointments,
			COUNT(*) FILTER (WHERE status = 'no_show')            AS no_show_count,
			COALESCE(
				(SELECT SUM(asvc.price_snapshot)
				 FROM appointment_services asvc
				 JOIN appointments a2 ON a2.id = asvc.appointment_id
				 WHERE a2.tenant_id = ? AND a2.status = 'completed'
				   AND a2.starts_at >= ? AND a2.starts_at < ?),
				0
			)::text                                               AS total_revenue
		FROM appointments
		WHERE tenant_id = ? AND starts_at >= ? AND starts_at < ?
	`, tenantID, from, to, tenantID, from, to).Scan(&result).Error
	if err != nil {
		return nil, err
	}

	// Active customers: distinct customers with at least one appointment in the period.
	r.dbForCtx(ctx).Raw(`
		SELECT COUNT(DISTINCT customer_id)
		FROM appointments
		WHERE tenant_id = ? AND starts_at >= ? AND starts_at < ?
	`, tenantID, from, to).Scan(&result.ActiveCustomers)

	// Returning customers: customers with >1 completed appointment ever.
	r.dbForCtx(ctx).Raw(`
		SELECT COUNT(*)
		FROM (
			SELECT customer_id
			FROM appointments
			WHERE tenant_id = ? AND status = 'completed'
			GROUP BY customer_id
			HAVING COUNT(*) > 1
		) sub
	`, tenantID).Scan(&result.ReturningCustomers)

	// Total customers with completed appointments (for returning rate).
	var totalCustomersWithVisits int
	r.dbForCtx(ctx).Raw(`
		SELECT COUNT(DISTINCT customer_id)
		FROM appointments
		WHERE tenant_id = ? AND status = 'completed'
	`, tenantID).Scan(&totalCustomersWithVisits)
	if totalCustomersWithVisits > 0 {
		result.TotalVisits = totalCustomersWithVisits
	}

	// Rewards redeemed in period.
	r.dbForCtx(ctx).Raw(`
		SELECT COUNT(*)
		FROM loyalty_transactions
		WHERE tenant_id = ? AND type = 'redeem'
			AND created_at >= ? AND created_at < ?
	`, tenantID, from, to).Scan(&result.RewardsRedeemed)

	return &result, nil
}

func (r *Repo) GetPopularServices(ctx context.Context, tenantID uuid.UUID, from, to string, limit int) ([]PopularServiceResult, error) {
	var services []PopularServiceResult
	err := r.dbForCtx(ctx).Raw(`
		SELECT asvc.service_name_snapshot AS name, COUNT(*) AS count
		FROM appointment_services asvc
		JOIN appointments a ON a.id = asvc.appointment_id
		WHERE a.tenant_id = ? AND a.starts_at >= ? AND a.starts_at < ?
		GROUP BY asvc.service_name_snapshot
		ORDER BY count DESC
		LIMIT ?
	`, tenantID, from, to, limit).Scan(&services).Error
	return services, err
}

func (r *Repo) GetPreviousPeriodAppointmentCount(ctx context.Context, tenantID uuid.UUID, from, to string) (int, error) {
	var count int
	err := r.dbForCtx(ctx).Raw(`
		SELECT COUNT(*)
		FROM appointments
		WHERE tenant_id = ? AND starts_at >= ? AND starts_at < ?
	`, tenantID, from, to).Scan(&count).Error
	return count, err
}

type StaffUtilizationResult struct {
	AvailableMinutes float64 `gorm:"column:available_minutes"`
	BookedMinutes    float64 `gorm:"column:booked_minutes"`
}

func (r *Repo) GetStaffUtilization(ctx context.Context, tenantID uuid.UUID, from, to string) (availableMinutes, bookedMinutes float64, err error) {
	var result StaffUtilizationResult
	err = r.dbForCtx(ctx).Raw(`
		WITH date_series AS (
			SELECT generate_series(?::timestamptz, ?::timestamptz - interval '1 day', '1 day')::date AS work_date
		),
		available AS (
			SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ssr.end_time - ssr.start_time)) / 60), 0) AS total_minutes
			FROM date_series ds
			JOIN staff_schedule_rules ssr
				ON ssr.day_of_week = EXTRACT(DOW FROM ds.work_date)
				AND ssr.is_working_day = true
			JOIN tenant_users tu
				ON tu.id = ssr.staff_user_id
				AND tu.tenant_id = ?
				AND tu.status = 'active'
		),
		time_off AS (
			SELECT COALESCE(SUM(
				EXTRACT(EPOCH FROM (LEAST(sto.end_at, ?::timestamptz) - GREATEST(sto.start_at, ?::timestamptz))) / 60
			), 0) AS off_minutes
			FROM staff_time_offs sto
			JOIN tenant_users tu ON tu.id = sto.staff_user_id AND tu.tenant_id = ?
			WHERE sto.start_at < ?::timestamptz AND sto.end_at > ?::timestamptz
		),
		booked AS (
			SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ends_at - starts_at)) / 60), 0) AS booked_minutes
			FROM appointments
			WHERE tenant_id = ?
				AND starts_at >= ?::timestamptz AND starts_at < ?::timestamptz
				AND status NOT IN ('cancelled', 'no_show')
		)
		SELECT
			GREATEST(available.total_minutes - time_off.off_minutes, 0) AS available_minutes,
			booked.booked_minutes
		FROM available, time_off, booked
	`, from, to, tenantID, to, from, tenantID, to, from, tenantID, from, to).Scan(&result).Error
	return result.AvailableMinutes, result.BookedMinutes, err
}

func (r *Repo) GetPreviousPeriodNoShowCount(ctx context.Context, tenantID uuid.UUID, from, to string) (noShows int, total int, err error) {
	var result struct {
		NoShows int `gorm:"column:no_shows"`
		Total   int `gorm:"column:total"`
	}
	err = r.dbForCtx(ctx).Raw(`
		SELECT
			COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows,
			COUNT(*) AS total
		FROM appointments
		WHERE tenant_id = ? AND starts_at >= ? AND starts_at < ?
	`, tenantID, from, to).Scan(&result).Error
	return result.NoShows, result.Total, err
}

func (r *Repo) GetPreviousPeriodRedeemCount(ctx context.Context, tenantID uuid.UUID, from, to string) (int, error) {
	var count int
	err := r.dbForCtx(ctx).Raw(`
		SELECT COUNT(*)
		FROM loyalty_transactions
		WHERE tenant_id = ? AND type = 'redeem'
			AND created_at >= ? AND created_at < ?
	`, tenantID, from, to).Scan(&count).Error
	return count, err
}

func (r *Repo) UpdateTenantUserStatus(ctx context.Context, tenantID, userID uuid.UUID, status string) error {
	result := r.dbForCtx(ctx).Model(&TenantUser{}).
		Where("tenant_id = ? AND id = ?", tenantID, userID).
		Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
