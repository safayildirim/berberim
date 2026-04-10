package appointment

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

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
	err := r.db.WithContext(ctx).
		Table("tenants").
		Where("id = ?", tenantID).
		Pluck("timezone", &tz).Error
	return tz, err
}

func (r *Repo) GetMaxWeeklyCustomerBookings(ctx context.Context, tenantID uuid.UUID) (int, error) {
	var limit int
	err := r.db.WithContext(ctx).
		Table("tenant_settings").
		Where("tenant_id = ?", tenantID).
		Pluck("max_weekly_customer_bookings", &limit).Error
	return limit, err
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
		SELECT tu.id, tu.tenant_id, tu.first_name, tu.last_name, tu.avatar_key, tu.specialty, tu.bio,
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
	err := r.db.WithContext(ctx).Raw(`
		SELECT tu.id, tu.tenant_id, tu.first_name, tu.last_name, tu.avatar_key, tu.specialty, tu.bio,
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
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Find(&rules).Error
	return rules, err
}

func (r *Repo) ListTimeOffs(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]TimeOff, error) {
	var offs []TimeOff
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND staff_user_id = ? AND end_at > ? AND start_at < ?", tenantID, staffUserID, from, to).
		Find(&offs).Error
	return offs, err
}

func (r *Repo) ListBookedSlots(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]BookedSlot, error) {
	var slots []BookedSlot
	err := r.db.WithContext(ctx).Raw(`
		SELECT starts_at, ends_at
		FROM appointments
		WHERE tenant_id = ?
		  AND staff_user_id = ?
		  AND status IN ('confirmed')
		  AND ends_at > ?
		  AND starts_at < ?
	`, tenantID, staffUserID, from, to).Scan(&slots).Error
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
