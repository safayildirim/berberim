package appointment

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/berberim/api/internal/lockutil"
	"github.com/berberim/api/internal/txctx"
)

// Repo handles all database operations for the appointment domain.
// Every method that is tenant-scoped requires an explicit tenantID argument.
type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

// dbForCtx returns the transaction stored in ctx, or the base db if none.
func (r *Repo) dbForCtx(ctx context.Context) *gorm.DB {
	return txctx.DBForCtx(ctx, r.db)
}

// RunInTx begins a transaction, stores it in ctx, calls fn, and commits or rolls back.
func (r *Repo) RunInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return txctx.RunInTx(ctx, r.db, fn)
}

func (r *Repo) GetTenantTimezone(ctx context.Context, tenantID uuid.UUID) (string, error) {
	var tz string
	err := r.dbForCtx(ctx).
		Table("tenants").
		Where("id = ?", tenantID).
		Pluck("timezone", &tz).Error
	return tz, err
}

func (r *Repo) GetMaxWeeklyCustomerBookings(ctx context.Context, tenantID uuid.UUID) (int, error) {
	var limit int
	err := r.dbForCtx(ctx).
		Table("tenant_settings").
		Where("tenant_id = ?", tenantID).
		Pluck("max_weekly_customer_bookings", &limit).Error
	return limit, err
}

// GetTenantBookingConfig consolidates all tenant-level booking settings into
// a single query (replaces multiple individual Pluck calls).
func (r *Repo) GetTenantBookingConfig(ctx context.Context, tenantID uuid.UUID) (*TenantBookingConfig, error) {
	var cfg TenantBookingConfig
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			t.timezone,
			COALESCE(ts.buffer_minutes, 0) AS buffer_minutes,
			COALESCE(ts.same_day_booking_enabled, true) AS same_day_booking_enabled,
			COALESCE(ts.min_advance_minutes, 0) AS min_advance_minutes,
			COALESCE(ts.max_advance_days, 14) AS max_advance_days,
			COALESCE(ts.max_weekly_customer_bookings, 2) AS max_weekly_bookings
		FROM tenants t
		LEFT JOIN tenant_settings ts ON ts.tenant_id = t.id
		WHERE t.id = ?
	`, tenantID).Scan(&cfg).Error
	return &cfg, err
}

func (r *Repo) CountCustomerAppointmentsInWeek(ctx context.Context, tenantID, customerID uuid.UUID, weekStart, weekEnd time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&Appointment{}).
		Where("tenant_id = ? AND customer_id = ? AND starts_at >= ? AND starts_at < ? AND status IN (?, ?, ?)",
			tenantID, customerID, weekStart, weekEnd,
			StatusConfirmed, StatusPaymentReceived, StatusCompleted).
		Count(&count).Error
	return count, err
}

// ── Availability ──────────────────────────────────────────────────────────────

func (r *Repo) GetServiceByID(ctx context.Context, tenantID, serviceID uuid.UUID) (*ServiceRecord, error) {
	var s ServiceRecord
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND id = ? AND is_active = true", tenantID, serviceID).
		First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repo) ListStaffByService(ctx context.Context, tenantID, serviceID uuid.UUID) ([]StaffMember, error) {
	var staff []StaffMember
	err := r.db.WithContext(ctx).Raw(`
		SELECT tu.id, tu.tenant_id, tu.first_name, tu.last_name,
			COALESCE(AVG(sr.rating), 0) AS avg_rating,
			COUNT(DISTINCT sr.id) AS review_count
		FROM tenant_users tu
		INNER JOIN staff_services ss ON ss.staff_user_id = tu.id
		LEFT JOIN staff_reviews sr ON sr.staff_user_id = tu.id AND sr.tenant_id = tu.tenant_id
		WHERE tu.tenant_id = ?
		  AND ss.service_id = ?
		  AND ss.is_active = true
		  AND tu.status = 'active'
		GROUP BY tu.id
	`, tenantID, serviceID).Scan(&staff).Error
	return staff, err
}

func (r *Repo) GetStaffMember(ctx context.Context, tenantID, staffUserID uuid.UUID) (*StaffMember, error) {
	var s StaffMember
	err := r.dbForCtx(ctx).Raw(`
		SELECT tu.id, tu.tenant_id, tu.first_name, tu.last_name, tu.avatar_key, tu.specialty, tu.bio, tu.status,
			COALESCE(AVG(sr.rating), 0) AS avg_rating,
			COUNT(DISTINCT sr.id) AS review_count
		FROM tenant_users tu
		LEFT JOIN staff_reviews sr ON sr.staff_user_id = tu.id AND sr.tenant_id = tu.tenant_id
		WHERE tu.tenant_id = ? AND tu.id = ?
		GROUP BY tu.id
	`, tenantID, staffUserID).Scan(&s).Error
	if err != nil {
		return nil, err
	}
	if s.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &s, nil
}

func (r *Repo) GetCustomerInfo(ctx context.Context, tenantID, customerID uuid.UUID) (*CustomerInfo, error) {
	var c CustomerInfo
	err := r.dbForCtx(ctx).Raw(`
		SELECT c.id, c.tenant_id, c.phone_number, c.first_name, c.last_name,
		       c.status, c.created_at,
		       COUNT(a.id) FILTER (WHERE a.status = 'completed') AS visit_count
		FROM customers c
		LEFT JOIN appointments a ON a.customer_id = c.id AND a.tenant_id = c.tenant_id
		WHERE c.tenant_id = ? AND c.id = ?
		GROUP BY c.id`, tenantID, customerID).
		Scan(&c).Error
	if err != nil {
		return nil, err
	}
	if c.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &c, nil
}

func (r *Repo) ListStaffByServices(ctx context.Context, tenantID uuid.UUID, serviceIDs []uuid.UUID) ([]StaffMember, error) {
	var staff []StaffMember
	err := r.dbForCtx(ctx).Raw(`
		SELECT tu.id, tu.tenant_id, tu.first_name, tu.last_name, tu.avatar_key, tu.specialty, tu.bio, tu.status,
			COALESCE(AVG(sr.rating), 0) AS avg_rating,
			COUNT(DISTINCT sr.id) AS review_count
		FROM tenant_users tu
		INNER JOIN staff_services ss ON ss.staff_user_id = tu.id
		LEFT JOIN staff_reviews sr ON sr.staff_user_id = tu.id AND sr.tenant_id = tu.tenant_id
		WHERE tu.tenant_id = ?
		  AND ss.service_id IN (?)
		  AND ss.is_active = true
		  AND tu.status = 'active'
		GROUP BY tu.id
		HAVING COUNT(DISTINCT ss.service_id) = ?
	`, tenantID, serviceIDs, len(serviceIDs)).Scan(&staff).Error
	return staff, err
}

func (r *Repo) ListStaffScheduleRules(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ScheduleRule, error) {
	var rules []ScheduleRule
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Find(&rules).Error
	return rules, err
}

func (r *Repo) ListTimeOffs(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]TimeOff, error) {
	var offs []TimeOff
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND staff_user_id = ? AND end_at > ? AND start_at < ?", tenantID, staffUserID, from, to).
		Find(&offs).Error
	return offs, err
}

func (r *Repo) ListBookedSlots(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]BookedSlot, error) {
	var slots []BookedSlot
	err := r.dbForCtx(ctx).Raw(`
		SELECT id, starts_at, blocked_until
		FROM appointments
		WHERE tenant_id = ?
		  AND staff_user_id = ?
		  AND status IN (?, ?)
		  AND blocked_until > ?
		  AND starts_at < ?
	`, tenantID, staffUserID, StatusConfirmed, StatusPaymentReceived, from, to).Scan(&slots).Error
	return slots, err
}

// ── Appointments ──────────────────────────────────────────────────────────────

func (r *Repo) CreateAppointment(ctx context.Context, a *Appointment) error {
	return r.dbForCtx(ctx).Create(a).Error
}

func (r *Repo) CreateAppointmentService(ctx context.Context, as *AppointmentService) error {
	return r.dbForCtx(ctx).Create(as).Error
}

func (r *Repo) GetAppointment(ctx context.Context, tenantID, appointmentID uuid.UUID) (*Appointment, error) {
	var a Appointment
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, appointmentID).
		First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// GetAppointmentForUpdate fetches an appointment with a row-level lock (SELECT FOR UPDATE).
// Must be called inside an active transaction (ctx must carry one via txctx).
func (r *Repo) GetAppointmentForUpdate(ctx context.Context, tenantID, appointmentID uuid.UUID) (*Appointment, error) {
	var a Appointment
	err := r.dbForCtx(ctx).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("tenant_id = ? AND id = ?", tenantID, appointmentID).
		First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *Repo) UpdateAppointmentStatus(ctx context.Context, tenantID, appointmentID uuid.UUID, status string, extra map[string]interface{}) error {
	updates := map[string]interface{}{"status": status}
	for k, v := range extra {
		updates[k] = v
	}
	result := r.dbForCtx(ctx).Model(&Appointment{}).
		Where("tenant_id = ? AND id = ?", tenantID, appointmentID).
		Updates(updates)
	return result.Error
}

func (r *Repo) ListAppointments(ctx context.Context, q ListQuery) ([]Appointment, int64, error) {
	var results []Appointment
	var total int64

	page := q.Page
	if page < 1 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	db := r.db.WithContext(ctx).Where("tenant_id = ?", q.TenantID)
	if q.CustomerID != uuid.Nil {
		db = db.Where("customer_id = ?", q.CustomerID)
	}
	if q.StaffUserID != uuid.Nil {
		db = db.Where("staff_user_id = ?", q.StaffUserID)
	}
	if q.DateFrom != nil {
		db = db.Where("starts_at >= ?", q.DateFrom)
	}
	if q.DateTo != nil {
		db = db.Where("starts_at < ?", q.DateTo)
	}
	if q.Status != "" {
		db = db.Where("status = ?", q.Status)
	}

	if err := db.Model(&Appointment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := db.Order("starts_at DESC").Offset(offset).Limit(pageSize).Find(&results).Error
	return results, total, err
}

func (r *Repo) ListAppointmentServices(ctx context.Context, appointmentID uuid.UUID) ([]AppointmentService, error) {
	var results []AppointmentService
	err := r.db.WithContext(ctx).
		Where("appointment_id = ?", appointmentID).
		Find(&results).Error
	return results, err
}

func (r *Repo) ListReviewsByAppointmentIDs(ctx context.Context, appointmentIDs []uuid.UUID) (map[uuid.UUID]*ReviewInfo, error) {
	if len(appointmentIDs) == 0 {
		return nil, nil
	}
	var reviews []ReviewInfo
	err := r.db.WithContext(ctx).
		Table("staff_reviews").
		Select("id, rating, comment, is_anonymous, customer_id, staff_user_id, appointment_id, created_at, updated_at").
		Where("appointment_id IN ?", appointmentIDs).
		Find(&reviews).Error
	if err != nil {
		return nil, err
	}
	m := make(map[uuid.UUID]*ReviewInfo, len(reviews))
	for i := range reviews {
		m[reviews[i].AppointmentID] = &reviews[i]
	}
	return m, nil
}

func (r *Repo) ListMultiAppointmentServices(ctx context.Context, appointmentIDs []uuid.UUID) ([]AppointmentService, error) {
	if len(appointmentIDs) == 0 {
		return nil, nil
	}
	var results []AppointmentService
	err := r.db.WithContext(ctx).
		Where("appointment_id IN ?", appointmentIDs).
		Find(&results).Error
	return results, err
}

// ── Slot Recommendations ─────────────────────────────────────────────────────

// GetCustomerBookingPatterns returns the customer's most common booking hour
// and most visited staff member, derived from past appointments.
func (r *Repo) GetCustomerBookingPatterns(ctx context.Context, tenantID, customerID uuid.UUID, tz string) (*BookingPattern, error) {
	type row struct {
		Hour        int       `gorm:"column:hour"`
		StaffUserID uuid.UUID `gorm:"column:staff_user_id"`
		Cnt         int       `gorm:"column:cnt"`
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			EXTRACT(HOUR FROM a.starts_at AT TIME ZONE @tz)::int AS hour,
			a.staff_user_id,
			COUNT(*) AS cnt
		FROM appointments a
		WHERE a.tenant_id = @tenantID
		  AND a.customer_id = @customerID
		  AND a.status IN ('completed','payment_received','confirmed')
		GROUP BY hour, a.staff_user_id
		ORDER BY cnt DESC
	`, map[string]interface{}{
		"tenantID":   tenantID,
		"customerID": customerID,
		"tz":         tz,
	}).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return &BookingPattern{}, nil
	}

	// Aggregate: find most frequent hour and most visited staff.
	hourCounts := make(map[int]int)
	staffCounts := make(map[uuid.UUID]int)
	total := 0
	for _, r := range rows {
		hourCounts[r.Hour] += r.Cnt
		staffCounts[r.StaffUserID] += r.Cnt
		total += r.Cnt
	}

	bestHour, bestHourCount := 0, 0
	for h, c := range hourCounts {
		if c > bestHourCount {
			bestHour = h
			bestHourCount = c
		}
	}

	bestStaff := uuid.Nil
	bestStaffCount := 0
	for s, c := range staffCounts {
		if c > bestStaffCount {
			bestStaff = s
			bestStaffCount = c
		}
	}

	return &BookingPattern{
		PreferredHour:  bestHour,
		PreferredStaff: bestStaff,
		StaffVisits:    bestStaffCount,
		TotalVisits:    total,
	}, nil
}

// GetTenantPopularHours returns the most popular booking hours for a tenant
// over the last 90 days.
func (r *Repo) GetTenantPopularHours(ctx context.Context, tenantID uuid.UUID, tz string) ([]PopularHour, error) {
	type row struct {
		Hour int `gorm:"column:hour"`
		Cnt  int `gorm:"column:cnt"`
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			EXTRACT(HOUR FROM a.starts_at AT TIME ZONE @tz)::int AS hour,
			COUNT(*) AS cnt
		FROM appointments a
		WHERE a.tenant_id = @tenantID
		  AND a.status IN ('completed','payment_received','confirmed')
		  AND a.starts_at > NOW() - INTERVAL '90 days'
		GROUP BY hour
		ORDER BY cnt DESC
		LIMIT 3
	`, map[string]interface{}{
		"tenantID": tenantID,
		"tz":       tz,
	}).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make([]PopularHour, len(rows))
	for i, r := range rows {
		result[i] = PopularHour{Hour: r.Hour, BookingCount: r.Cnt}
	}
	return result, nil
}

// ── Schedule breaks ──────────────────────────────────────────────────────────

// ListScheduleBreaksByDay returns breaks for a single staff member on a specific day.
// Used by the booking write path and admin break validation.
func (r *Repo) ListScheduleBreaksByDay(ctx context.Context, tenantID, staffUserID uuid.UUID, dayOfWeek int) ([]ScheduleBreak, error) {
	var breaks []ScheduleBreak
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id = ? AND day_of_week = ?", tenantID, staffUserID, dayOfWeek).
		Order("start_time").
		Find(&breaks).Error
	return breaks, err
}

// ListScheduleBreaks returns all breaks for a single staff member across all days.
// Used by SearchStaffAvailability and admin list APIs.
func (r *Repo) ListScheduleBreaks(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ScheduleBreak, error) {
	var breaks []ScheduleBreak
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Order("day_of_week, start_time").
		Find(&breaks).Error
	return breaks, err
}

// ListAllStaffScheduleBreaks loads breaks for all given staff IDs in one query.
// Used by SearchMultiDayAvailability batch engine.
func (r *Repo) ListAllStaffScheduleBreaks(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID) (map[uuid.UUID][]ScheduleBreak, error) {
	var breaks []ScheduleBreak
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id IN ?", tenantID, staffIDs).
		Order("staff_user_id, day_of_week, start_time").
		Find(&breaks).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID][]ScheduleBreak, len(staffIDs))
	for _, b := range breaks {
		result[b.StaffUserID] = append(result[b.StaffUserID], b)
	}
	return result, nil
}

// ── Batch availability queries (multi-day engine) ────────────────────────────

// ListAllStaffScheduleRules loads schedule rules for all given staff IDs in one query.
func (r *Repo) ListAllStaffScheduleRules(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID) (map[uuid.UUID][]ScheduleRule, error) {
	var rules []ScheduleRule
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id IN ?", tenantID, staffIDs).
		Order("staff_user_id, day_of_week").
		Find(&rules).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID][]ScheduleRule, len(staffIDs))
	for _, rule := range rules {
		result[rule.StaffUserID] = append(result[rule.StaffUserID], rule)
	}
	return result, nil
}

// ListAllStaffTimeOffs loads time-offs for all given staff IDs across a date range.
func (r *Repo) ListAllStaffTimeOffs(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID, from, to time.Time) (map[uuid.UUID][]TimeOff, error) {
	var offs []TimeOff
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id IN ? AND end_at > ? AND start_at < ?", tenantID, staffIDs, from, to).
		Find(&offs).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID][]TimeOff, len(staffIDs))
	for _, off := range offs {
		result[off.StaffUserID] = append(result[off.StaffUserID], off)
	}
	return result, nil
}

// ListAllStaffBookedSlots loads booked appointment slots for all given staff IDs across a date range.
func (r *Repo) ListAllStaffBookedSlots(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID, from, to time.Time) (map[uuid.UUID][]BookedSlot, error) {
	type row struct {
		ID           uuid.UUID `gorm:"column:id"`
		StaffUserID  uuid.UUID `gorm:"column:staff_user_id"`
		StartsAt     time.Time `gorm:"column:starts_at"`
		BlockedUntil time.Time `gorm:"column:blocked_until"`
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT id, staff_user_id, starts_at, blocked_until
		FROM appointments
		WHERE tenant_id = ?
		  AND staff_user_id IN ?
		  AND status IN (?, ?)
		  AND blocked_until > ?
		  AND starts_at < ?
	`, tenantID, staffIDs, StatusConfirmed, StatusPaymentReceived, from, to).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[uuid.UUID][]BookedSlot, len(staffIDs))
	for _, r := range rows {
		result[r.StaffUserID] = append(result[r.StaffUserID], BookedSlot{
			ID:           r.ID,
			StartsAt:     r.StartsAt,
			BlockedUntil: r.BlockedUntil,
		})
	}
	return result, nil
}

// ListStaffServicesByStaff returns all active services a specific staff member can perform.
func (r *Repo) ListStaffServicesByStaff(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ServiceRecord, error) {
	var services []ServiceRecord
	err := r.db.WithContext(ctx).Raw(`
		SELECT s.id, s.tenant_id, s.name, s.description, s.duration_minutes,
			s.base_price, s.points_reward, s.category_name, s.is_active
		FROM services s
		INNER JOIN staff_services ss ON ss.service_id = s.id AND ss.is_active = true
		WHERE ss.staff_user_id = ? AND s.tenant_id = ? AND s.is_active = true
	`, staffUserID, tenantID).Scan(&services).Error
	return services, err
}

// GetStaffCustomPrice returns the custom price for a staff member performing a
// specific service, or empty string if no custom price is set.
func (r *Repo) GetStaffCustomPrice(ctx context.Context, staffUserID, serviceID uuid.UUID) (string, error) {
	var price *string
	err := r.db.WithContext(ctx).Raw(`
		SELECT custom_price FROM staff_services
		WHERE staff_user_id = ? AND service_id = ? AND is_active = true AND custom_price IS NOT NULL
	`, staffUserID, serviceID).Scan(&price).Error
	if err != nil || price == nil {
		return "", err
	}
	return *price, nil
}

// GetAppointmentByIdempotencyKey looks up an existing appointment by its idempotency key.
func (r *Repo) GetAppointmentByIdempotencyKey(ctx context.Context, tenantID uuid.UUID, key string) (*Appointment, error) {
	var a Appointment
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND idempotency_key = ?", tenantID, key).
		First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ListConflictingAppointments returns active appointments that overlap with
// a given time range for a staff member. Used by time-off creation to reject
// conflicts.
func (r *Repo) ListConflictingAppointments(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]Appointment, error) {
	var appts []Appointment
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND staff_user_id = ? AND status IN (?, ?) AND starts_at < ? AND blocked_until > ?",
			tenantID, staffUserID, StatusConfirmed, StatusPaymentReceived, to, from).
		Find(&appts).Error
	return appts, err
}

// CountStaffAppointmentsToday counts the number of active appointments for a
// staff member on a given day. Used for least-loaded auto-assignment ranking.
func (r *Repo) CountStaffAppointmentsToday(ctx context.Context, tenantID, staffUserID uuid.UUID, dayStart, dayEnd time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&Appointment{}).
		Where("tenant_id = ? AND staff_user_id = ? AND status IN (?, ?) AND starts_at >= ? AND starts_at < ?",
			tenantID, staffUserID, StatusConfirmed, StatusPaymentReceived, dayStart, dayEnd).
		Count(&count).Error
	return count, err
}

// AcquireStaffScheduleLock acquires a transaction-scoped advisory lock on
// a staff member's scheduling state. Must be called within a transaction.
func (r *Repo) AcquireStaffScheduleLock(ctx context.Context, staffUserID uuid.UUID) error {
	db := r.dbForCtx(ctx)
	return lockutil.AcquireStaffScheduleLock(db, staffUserID)
}
