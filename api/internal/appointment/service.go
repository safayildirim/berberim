package appointment

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// LoyaltyService is a narrow interface so the appointment service can award
// points without importing the loyalty package directly.
type LoyaltyService interface {
	AwardPoints(ctx context.Context, tenantID, customerID, appointmentID uuid.UUID, pointsReward int) error
}

type ReminderScheduler interface {
	ScheduleAppointmentReminders(ctx context.Context, tenantID, appointmentID, customerID uuid.UUID, startsAt time.Time) error
	CancelAppointmentReminders(ctx context.Context, tenantID, appointmentID uuid.UUID, reason string) error
}

type NotificationCreator interface {
	CreateNotification(ctx context.Context, tenantID, customerID uuid.UUID, notifType, title, body, deepLink string, referenceID *uuid.UUID) error
}

type RepoInterface interface {
	// Tenant config
	GetTenantTimezone(ctx context.Context, tenantID uuid.UUID) (string, error)
	GetTenantBookingConfig(ctx context.Context, tenantID uuid.UUID) (*TenantBookingConfig, error)
	GetMaxWeeklyCustomerBookings(ctx context.Context, tenantID uuid.UUID) (int, error)
	CountCustomerAppointmentsInWeek(ctx context.Context, tenantID, customerID uuid.UUID, weekStart, weekEnd time.Time) (int64, error)

	// Services and staff
	GetServiceByID(ctx context.Context, tenantID, serviceID uuid.UUID) (*ServiceRecord, error)
	GetStaffMember(ctx context.Context, tenantID, staffUserID uuid.UUID) (*StaffMember, error)
	GetCustomerInfo(ctx context.Context, tenantID, customerID uuid.UUID) (*CustomerInfo, error)
	ListStaffByServices(ctx context.Context, tenantID uuid.UUID, serviceIDs []uuid.UUID) ([]StaffMember, error)
	ListStaffServicesByStaff(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ServiceRecord, error)
	GetStaffCustomPrice(ctx context.Context, staffUserID, serviceID uuid.UUID) (string, error)

	// Per-staff availability (single-day legacy)
	ListStaffScheduleRules(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ScheduleRule, error)
	ListTimeOffs(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]TimeOff, error)
	ListBookedSlots(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]BookedSlot, error)

	// Schedule breaks
	ListScheduleBreaksByDay(ctx context.Context, tenantID, staffUserID uuid.UUID, dayOfWeek int) ([]ScheduleBreak, error)
	ListScheduleBreaks(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ScheduleBreak, error)
	ListAllStaffScheduleBreaks(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID) (map[uuid.UUID][]ScheduleBreak, error)

	// Batch availability (multi-day engine)
	ListAllStaffScheduleRules(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID) (map[uuid.UUID][]ScheduleRule, error)
	ListAllStaffTimeOffs(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID, from, to time.Time) (map[uuid.UUID][]TimeOff, error)
	ListAllStaffBookedSlots(ctx context.Context, tenantID uuid.UUID, staffIDs []uuid.UUID, from, to time.Time) (map[uuid.UUID][]BookedSlot, error)

	// Appointments CRUD
	CreateAppointment(ctx context.Context, a *Appointment) error
	CreateAppointmentService(ctx context.Context, as *AppointmentService) error
	GetAppointment(ctx context.Context, tenantID, appointmentID uuid.UUID) (*Appointment, error)
	GetAppointmentForUpdate(ctx context.Context, tenantID, appointmentID uuid.UUID) (*Appointment, error)
	UpdateAppointmentStatus(ctx context.Context, tenantID, appointmentID uuid.UUID, status string, extra map[string]interface{}) error
	ListAppointments(ctx context.Context, q ListQuery) ([]Appointment, int64, error)
	ListAppointmentServices(ctx context.Context, appointmentID uuid.UUID) ([]AppointmentService, error)
	ListMultiAppointmentServices(ctx context.Context, appointmentIDs []uuid.UUID) ([]AppointmentService, error)
	ListReviewsByAppointmentIDs(ctx context.Context, appointmentIDs []uuid.UUID) (map[uuid.UUID]*ReviewInfo, error)

	// Idempotency and conflict checks
	GetAppointmentByIdempotencyKey(ctx context.Context, tenantID uuid.UUID, key string) (*Appointment, error)
	ListConflictingAppointments(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]Appointment, error)
	CountStaffAppointmentsToday(ctx context.Context, tenantID, staffUserID uuid.UUID, dayStart, dayEnd time.Time) (int64, error)
	AcquireStaffScheduleLock(ctx context.Context, staffUserID uuid.UUID) error

	// Booking patterns for recommendations
	GetCustomerBookingPatterns(ctx context.Context, tenantID, customerID uuid.UUID, tz string) (*BookingPattern, error)
	GetTenantPopularHours(ctx context.Context, tenantID uuid.UUID, tz string) ([]PopularHour, error)

	// Transaction support
	RunInTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type Service struct {
	repo          RepoInterface
	loyalty       LoyaltyService
	reminders     ReminderScheduler
	notifications NotificationCreator
	log           *zap.Logger
}

func NewService(repo RepoInterface, loyalty LoyaltyService, log *zap.Logger) *Service {
	return &Service{repo: repo, loyalty: loyalty, log: log}
}

func (s *Service) SetReminderScheduler(reminderScheduler ReminderScheduler) {
	s.reminders = reminderScheduler
}

func (s *Service) SetNotificationCreator(nc NotificationCreator) {
	s.notifications = nc
}

func (s *Service) loadTenantLocation(ctx context.Context, tenantID uuid.UUID) *time.Location {
	tz, err := s.repo.GetTenantTimezone(ctx, tenantID)
	if err != nil || tz == "" {
		return time.UTC
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		return time.UTC
	}
	return loc
}

// ── Requests ──────────────────────────────────────────────────────────────────

type SearchAvailabilityRequest struct {
	TenantID    uuid.UUID
	ServiceIDs  []uuid.UUID
	Date        string    // YYYY-MM-DD
	StaffUserID uuid.UUID // optional — zero means all qualified staff
}

type CreateAppointmentRequest struct {
	TenantID       uuid.UUID
	CustomerID     uuid.UUID
	StaffUserID    uuid.UUID
	ServiceIDs     []uuid.UUID
	StartsAt       time.Time
	NotesCustomer  string
	CreatedVia     string
	IdempotencyKey string
}

type CancelAppointmentRequest struct {
	TenantID      uuid.UUID
	CustomerID    uuid.UUID
	AppointmentID uuid.UUID
	Reason        string
	// "customer" | "staff" | "admin"
	CancelledByType string
}

type RescheduleAppointmentRequest struct {
	TenantID       uuid.UUID
	CustomerID     uuid.UUID
	AppointmentID  uuid.UUID
	NewStartsAt    time.Time
	NewStaffUserID uuid.UUID // zero = keep existing
}

type CompleteAppointmentRequest struct {
	TenantID      uuid.UUID
	AppointmentID uuid.UUID
}

type MarkNoShowRequest struct {
	TenantID      uuid.UUID
	AppointmentID uuid.UUID
}

type MarkPaymentReceivedRequest struct {
	TenantID      uuid.UUID
	AppointmentID uuid.UUID
}

// ── SearchAvailability ────────────────────────────────────────────────────────

func (s *Service) SearchAvailability(ctx context.Context, req SearchAvailabilityRequest) ([]AvailableSlot, []FilledSlot, error) {
	if req.TenantID == uuid.Nil {
		return nil, nil, ErrTenantRequired
	}
	if len(req.ServiceIDs) == 0 {
		return nil, nil, ErrServiceRequired
	}
	if req.Date == "" {
		return nil, nil, ErrDateRequired
	}

	// Fetch all requested services and sum their durations.
	var totalDuration time.Duration
	for _, svcID := range req.ServiceIDs {
		svc, err := s.repo.GetServiceByID(ctx, req.TenantID, svcID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, nil, fmt.Errorf("service %s not found", svcID)
			}
			return nil, nil, fmt.Errorf("get service: %w", err)
		}
		totalDuration += time.Duration(svc.DurationMinutes) * time.Minute
	}

	cfg, err := s.repo.GetTenantBookingConfig(ctx, req.TenantID)
	if err != nil {
		return nil, nil, fmt.Errorf("get tenant config: %w", err)
	}
	loc, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		loc = time.UTC
	}
	buffer := time.Duration(cfg.BufferMinutes) * time.Minute
	effectiveDuration := totalDuration + buffer

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, nil, ErrInvalidDate
	}
	dayStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
	dayEnd := dayStart.AddDate(0, 0, 1)

	// Find staff who can perform all requested services.
	// If a specific staff member is requested, verify they qualify instead of listing all.
	var staff []StaffMember
	if req.StaffUserID != uuid.Nil {
		qualified, err := s.repo.ListStaffByServices(ctx, req.TenantID, req.ServiceIDs)
		if err != nil {
			return nil, nil, fmt.Errorf("list staff: %w", err)
		}
		for _, m := range qualified {
			if m.ID == req.StaffUserID {
				staff = []StaffMember{m}
				break
			}
		}
		// If the requested staff member can't perform all services, return empty.
	} else {
		var err error
		staff, err = s.repo.ListStaffByServices(ctx, req.TenantID, req.ServiceIDs)
		if err != nil {
			return nil, nil, fmt.Errorf("list staff: %w", err)
		}
	}

	// For each staff member collect open windows and all possible slot positions
	// (open + blocked). The union of all possible positions minus the open ones
	// gives us the filled slots.
	type staffTime struct {
		member   StaffMember
		startsAt time.Time
		endsAt   time.Time
	}
	var flat []staffTime
	allPositions := make(map[time.Time]time.Time) // startsAt → endsAt, all positions across all staff

	for _, member := range staff {
		rules, err := s.repo.ListStaffScheduleRules(ctx, req.TenantID, member.ID)
		if err != nil {
			return nil, nil, fmt.Errorf("schedule rules for %s: %w", member.ID, err)
		}
		timeOffs, err := s.repo.ListTimeOffs(ctx, req.TenantID, member.ID, dayStart, dayEnd)
		if err != nil {
			return nil, nil, fmt.Errorf("time offs for %s: %w", member.ID, err)
		}
		booked, err := s.repo.ListBookedSlots(ctx, req.TenantID, member.ID, dayStart, dayEnd)
		if err != nil {
			return nil, nil, fmt.Errorf("booked slots for %s: %w", member.ID, err)
		}
		breaks, err := s.repo.ListScheduleBreaks(ctx, req.TenantID, member.ID)
		if err != nil {
			return nil, nil, fmt.Errorf("breaks for %s: %w", member.ID, err)
		}
		dayBreaks := filterBreaksByDay(breaks, int(dayStart.Weekday()))
		for _, w := range computeOpenWindows(totalDuration, effectiveDuration, rules, timeOffs, booked, dayBreaks, dayStart, loc) {
			flat = append(flat, staffTime{member: member, startsAt: w.startsAt, endsAt: w.endsAt})
			allPositions[w.startsAt] = w.endsAt
		}
		// Also record positions that are within working hours but blocked (booked/time-off).
		for _, w := range computeBlockedWindows(totalDuration, effectiveDuration, rules, timeOffs, booked, dayBreaks, dayStart, loc) {
			allPositions[w.startsAt] = w.endsAt
		}
	}

	// Group open windows by startsAt → AvailableSlot.
	seen := make(map[time.Time]int) // startsAt → index in slots
	var slots []AvailableSlot
	for _, st := range flat {
		if idx, ok := seen[st.startsAt]; ok {
			slots[idx].AvailableStaff = append(slots[idx].AvailableStaff, staffMemberToOption(&st.member))
		} else {
			seen[st.startsAt] = len(slots)
			slots = append(slots, AvailableSlot{
				StartsAt:       st.startsAt,
				EndsAt:         st.endsAt,
				AvailableStaff: []StaffOption{staffMemberToOption(&st.member)},
			})
		}
	}

	// Filled = positions within working hours that have no available staff.
	var filled []FilledSlot
	for startsAt, endsAt := range allPositions {
		if _, open := seen[startsAt]; !open {
			filled = append(filled, FilledSlot{StartsAt: startsAt, EndsAt: endsAt})
		}
	}
	// Sort filled slots chronologically.
	for i := 1; i < len(filled); i++ {
		for j := i; j > 0 && filled[j].StartsAt.Before(filled[j-1].StartsAt); j-- {
			filled[j], filled[j-1] = filled[j-1], filled[j]
		}
	}

	return slots, filled, nil
}

// ── SearchMultiDayAvailability ──────────────────────────────────────────────

func (s *Service) SearchMultiDayAvailability(ctx context.Context, req SearchMultiDayAvailabilityRequest) (*MultiDayResult, error) {
	if req.TenantID == uuid.Nil {
		return nil, ErrTenantRequired
	}
	if len(req.ServiceIDs) == 0 {
		return nil, ErrServiceRequired
	}

	// Parse and validate date range.
	fromDate, err := time.Parse("2006-01-02", req.FromDate)
	if err != nil {
		return nil, ErrInvalidDate
	}
	toDate, err := time.Parse("2006-01-02", req.ToDate)
	if err != nil {
		return nil, ErrInvalidDate
	}
	if toDate.Before(fromDate) {
		return nil, ErrInvalidDate
	}
	dayCount := int(toDate.Sub(fromDate).Hours()/24) + 1
	if dayCount > 14 {
		return nil, ErrDateRangeTooLarge
	}

	// Load tenant config (consolidated: timezone, buffer, same_day, advance limits).
	cfg, err := s.repo.GetTenantBookingConfig(ctx, req.TenantID)
	if err != nil {
		return nil, fmt.Errorf("get tenant config: %w", err)
	}
	loc, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		loc = time.UTC
	}
	buffer := time.Duration(cfg.BufferMinutes) * time.Minute

	// Clamp date range to the tenant's booking advance window.
	// This ensures we never return slots the booking write path would reject.
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	if cfg.MaxAdvanceDays > 0 {
		maxDate := today.AddDate(0, 0, cfg.MaxAdvanceDays)
		if toDate.After(maxDate) {
			toDate = maxDate
		}
	}
	// Re-check after clamping — fromDate may now be after toDate.
	if toDate.Before(fromDate) {
		return &MultiDayResult{}, nil
	}
	dayCount = int(toDate.Sub(fromDate).Hours()/24) + 1

	// Fetch all requested services and sum their durations.
	var totalDuration time.Duration
	for _, svcID := range req.ServiceIDs {
		svc, err := s.repo.GetServiceByID(ctx, req.TenantID, svcID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, fmt.Errorf("service %s not found", svcID)
			}
			return nil, fmt.Errorf("get service: %w", err)
		}
		totalDuration += time.Duration(svc.DurationMinutes) * time.Minute
	}

	// The availability engine computes with effectiveDuration so that slots
	// account for the buffer. A slot is available only if totalDuration + buffer
	// fits before the next booking's starts_at. Since overlapsBooked checks
	// against blocked_until (which already includes buffer for existing bookings),
	// we need to check whether a NEW booking at [slotStart, slotStart+totalDuration)
	// with blocked_until = slotStart+totalDuration+buffer would overlap existing ones.
	// The simplest correct way: use totalDuration+buffer as the effective slot size
	// in computeOpenWindows. This way a slot is only offered if the full
	// duration + buffer fits without overlapping any existing blocked_until range.
	effectiveDuration := totalDuration + buffer

	// Find staff who can perform all requested services.
	var staff []StaffMember
	if req.StaffUserID != uuid.Nil {
		qualified, err := s.repo.ListStaffByServices(ctx, req.TenantID, req.ServiceIDs)
		if err != nil {
			return nil, fmt.Errorf("list staff: %w", err)
		}
		for _, m := range qualified {
			if m.ID == req.StaffUserID {
				staff = []StaffMember{m}
				break
			}
		}
	} else {
		staff, err = s.repo.ListStaffByServices(ctx, req.TenantID, req.ServiceIDs)
		if err != nil {
			return nil, fmt.Errorf("list staff: %w", err)
		}
	}

	if len(staff) == 0 {
		return &MultiDayResult{}, nil
	}

	staffIDs := make([]uuid.UUID, len(staff))
	for i, m := range staff {
		staffIDs[i] = m.ID
	}

	// Batch-load all scheduling data (4 queries total).
	rangeStart := time.Date(fromDate.Year(), fromDate.Month(), fromDate.Day(), 0, 0, 0, 0, loc)
	rangeEnd := time.Date(toDate.Year(), toDate.Month(), toDate.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, 1)

	rulesMap, err := s.repo.ListAllStaffScheduleRules(ctx, req.TenantID, staffIDs)
	if err != nil {
		return nil, fmt.Errorf("batch schedule rules: %w", err)
	}
	breaksMap, err := s.repo.ListAllStaffScheduleBreaks(ctx, req.TenantID, staffIDs)
	if err != nil {
		return nil, fmt.Errorf("batch schedule breaks: %w", err)
	}
	offsMap, err := s.repo.ListAllStaffTimeOffs(ctx, req.TenantID, staffIDs, rangeStart, rangeEnd)
	if err != nil {
		return nil, fmt.Errorf("batch time offs: %w", err)
	}
	bookedMap, err := s.repo.ListAllStaffBookedSlots(ctx, req.TenantID, staffIDs, rangeStart, rangeEnd)
	if err != nil {
		return nil, fmt.Errorf("batch booked slots: %w", err)
	}

	// minBookableTime is the earliest slot start that satisfies min_advance_minutes.
	// Slots starting before this time are excluded from both open and filled sets —
	// they are not "blocked", just not reachable under the tenant's booking rules.
	minBookableTime := now
	if cfg.MinAdvanceMinutes > 0 {
		minBookableTime = now.Add(time.Duration(cfg.MinAdvanceMinutes) * time.Minute)
	}

	// Build per-day availability.
	var days []DayAvailability
	var allSlots []AvailableSlot // flat list for recommendations

	for d := 0; d < dayCount; d++ {
		date := fromDate.AddDate(0, 0, d)
		dateInLoc := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
		dateStr := date.Format("2006-01-02")

		// Skip today if same-day booking is disabled.
		if !cfg.SameDayBookingEnabled && dateInLoc.Equal(today) {
			days = append(days, DayAvailability{Date: dateStr})
			continue
		}

		type staffTime struct {
			member   StaffMember
			startsAt time.Time
			endsAt   time.Time
		}
		var flat []staffTime
		allPositions := make(map[time.Time]time.Time)

		dayStart := dateInLoc
		dayEnd := dateInLoc.AddDate(0, 0, 1)

		for _, member := range staff {
			rules := rulesMap[member.ID]
			dayBreaks := filterBreaksByDay(breaksMap[member.ID], int(dateInLoc.Weekday()))

			// Filter time-offs to this day.
			var dayOffs []TimeOff
			for _, off := range offsMap[member.ID] {
				if off.StartAt.Before(dayEnd) && off.EndAt.After(dayStart) {
					dayOffs = append(dayOffs, off)
				}
			}

			// Filter booked slots to this day.
			var dayBooked []BookedSlot
			for _, b := range bookedMap[member.ID] {
				if b.StartsAt.Before(dayEnd) && b.BlockedUntil.After(dayStart) {
					dayBooked = append(dayBooked, b)
				}
			}

			for _, w := range computeOpenWindows(totalDuration, effectiveDuration, rules, dayOffs, dayBooked, dayBreaks, dateInLoc, loc) {
				if w.startsAt.Before(minBookableTime) {
					continue
				}
				flat = append(flat, staffTime{member: member, startsAt: w.startsAt, endsAt: w.endsAt})
				allPositions[w.startsAt] = w.endsAt
			}
			for _, w := range computeBlockedWindows(totalDuration, effectiveDuration, rules, dayOffs, dayBooked, dayBreaks, dateInLoc, loc) {
				if w.startsAt.Before(minBookableTime) {
					continue
				}
				allPositions[w.startsAt] = w.endsAt
			}
		}

		// Group open windows by startsAt.
		seen := make(map[time.Time]int)
		var daySlots []AvailableSlot
		for _, st := range flat {
			if idx, ok := seen[st.startsAt]; ok {
				daySlots[idx].AvailableStaff = append(daySlots[idx].AvailableStaff, staffMemberToOption(&st.member))
			} else {
				seen[st.startsAt] = len(daySlots)
				daySlots = append(daySlots, AvailableSlot{
					StartsAt:       st.startsAt,
					EndsAt:         st.endsAt,
					AvailableStaff: []StaffOption{staffMemberToOption(&st.member)},
				})
			}
		}

		// Filled = positions within working hours that have no available staff.
		var filledSlots []FilledSlot
		for startsAt, endsAt := range allPositions {
			if _, open := seen[startsAt]; !open {
				filledSlots = append(filledSlots, FilledSlot{StartsAt: startsAt, EndsAt: endsAt})
			}
		}
		for i := 1; i < len(filledSlots); i++ {
			for j := i; j > 0 && filledSlots[j].StartsAt.Before(filledSlots[j-1].StartsAt); j-- {
				filledSlots[j], filledSlots[j-1] = filledSlots[j-1], filledSlots[j]
			}
		}

		allSlots = append(allSlots, daySlots...)
		days = append(days, DayAvailability{Date: dateStr, Slots: daySlots, FilledSlots: filledSlots})
	}

	// Build inline recommendations from all collected slots.
	recs := s.buildRecommendations(ctx, req.TenantID, req.CustomerID, allSlots, loc, cfg.Timezone)

	return &MultiDayResult{Days: days, Recommendations: recs}, nil
}

// buildRecommendations produces 2-4 recommended slots from a flat list of
// available slots, operating on pre-loaded data.
func (s *Service) buildRecommendations(ctx context.Context, tenantID, customerID uuid.UUID, allSlots []AvailableSlot, loc *time.Location, tz string) []SlotRecommendation {
	if len(allSlots) == 0 {
		return nil
	}

	// Sort by start time.
	for i := 1; i < len(allSlots); i++ {
		for j := i; j > 0 && allSlots[j].StartsAt.Before(allSlots[j-1].StartsAt); j-- {
			allSlots[j], allSlots[j-1] = allSlots[j-1], allSlots[j]
		}
	}

	var recs []SlotRecommendation
	usedStarts := make(map[time.Time]bool)

	addRec := func(slot AvailableSlot, label string) {
		if usedStarts[slot.StartsAt] || len(recs) >= maxRecommendations {
			return
		}
		usedStarts[slot.StartsAt] = true
		recs = append(recs, SlotRecommendation{
			StartsAt:       slot.StartsAt,
			EndsAt:         slot.EndsAt,
			AvailableStaff: slot.AvailableStaff,
			Label:          label,
		})
	}

	// 1. Earliest available.
	addRec(allSlots[0], labelEarliest)

	// 2-3. Personalized recommendations if customer is known.
	if customerID != uuid.Nil {
		pattern, err := s.repo.GetCustomerBookingPatterns(ctx, tenantID, customerID, tz)
		if err != nil {
			s.log.Warn("failed to fetch booking patterns", zap.Error(err))
		} else if pattern.TotalVisits >= 3 {
			for _, slot := range allSlots {
				if slot.StartsAt.In(loc).Hour() == pattern.PreferredHour {
					addRec(slot, labelPreferredTime)
					break
				}
			}
		}

		if pattern != nil && pattern.StaffVisits >= 2 && pattern.PreferredStaff != uuid.Nil {
			for _, slot := range allSlots {
				for _, staff := range slot.AvailableStaff {
					if staff.ID == pattern.PreferredStaff {
						addRec(slot, labelPreferredStaff)
						break
					}
				}
				if len(recs) >= maxRecommendations {
					break
				}
			}
		}
	}

	// 4. Popular hours (tenant-wide fallback).
	if len(recs) < maxRecommendations {
		popular, err := s.repo.GetTenantPopularHours(ctx, tenantID, tz)
		if err != nil {
			s.log.Warn("failed to fetch popular hours", zap.Error(err))
		} else {
			for _, ph := range popular {
				if len(recs) >= maxRecommendations {
					break
				}
				for _, slot := range allSlots {
					if slot.StartsAt.In(loc).Hour() == ph.Hour {
						addRec(slot, labelPopular)
						break
					}
				}
			}
		}
	}

	// Fill up to at least 2 recommendations with earliest slots.
	for i := 1; i < len(allSlots) && len(recs) < 2; i++ {
		addRec(allSlots[i], labelEarliest)
	}

	return recs
}

type openWindow struct {
	startsAt time.Time
	endsAt   time.Time
}

type appointmentPlacementInput struct {
	TenantID             uuid.UUID
	StaffUserID          uuid.UUID
	ServiceIDs           []uuid.UUID
	StartsAt             time.Time
	EndsAt               time.Time
	BlockedUntil         time.Time
	ExcludeAppointmentID uuid.UUID
}

type appointmentPlacementResult struct {
	Staff *StaffMember
}

func (s *Service) validateAppointmentPlacement(ctx context.Context, in appointmentPlacementInput, loc *time.Location) (*appointmentPlacementResult, error) {
	if in.StaffUserID == uuid.Nil {
		return nil, ErrStaffRequired
	}

	staff, err := s.repo.GetStaffMember(ctx, in.TenantID, in.StaffUserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStaffRequired
		}
		return nil, fmt.Errorf("get staff member: %w", err)
	}
	if staff.Status != "" && staff.Status != "active" {
		return nil, ErrStaffUnavailableForService
	}

	if len(in.ServiceIDs) > 0 {
		qualified, err := s.repo.ListStaffByServices(ctx, in.TenantID, in.ServiceIDs)
		if err != nil {
			return nil, fmt.Errorf("check staff services: %w", err)
		}
		supportsAll := false
		for _, m := range qualified {
			if m.ID == in.StaffUserID {
				supportsAll = true
				break
			}
		}
		if !supportsAll {
			return nil, ErrStaffUnavailableForService
		}
	}

	rules, err := s.repo.ListStaffScheduleRules(ctx, in.TenantID, in.StaffUserID)
	if err != nil {
		return nil, fmt.Errorf("schedule rules: %w", err)
	}
	date := in.StartsAt.In(loc)
	dateStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
	p, ok := resolveSlotParams(rules, dateStart, loc)
	if !ok {
		return nil, ErrOutsideWorkingHours
	}
	if in.StartsAt.Before(p.workStart) || in.BlockedUntil.After(p.workEnd) {
		return nil, ErrOutsideWorkingHours
	}

	timeOffs, err := s.repo.ListTimeOffs(ctx, in.TenantID, in.StaffUserID, in.StartsAt, in.BlockedUntil)
	if err != nil {
		return nil, fmt.Errorf("check time offs: %w", err)
	}
	if len(timeOffs) > 0 {
		return nil, ErrSlotUnavailable
	}

	booked, err := s.repo.ListBookedSlots(ctx, in.TenantID, in.StaffUserID, in.StartsAt, in.BlockedUntil)
	if err != nil {
		return nil, fmt.Errorf("check booked slots: %w", err)
	}
	for _, slot := range booked {
		if in.ExcludeAppointmentID != uuid.Nil && slot.ID == in.ExcludeAppointmentID {
			continue
		}
		if in.StartsAt.Before(slot.BlockedUntil) && in.BlockedUntil.After(slot.StartsAt) {
			return nil, ErrSlotUnavailable
		}
	}

	dayBreaks, err := s.repo.ListScheduleBreaksByDay(ctx, in.TenantID, in.StaffUserID, int(dateStart.Weekday()))
	if err != nil {
		return nil, fmt.Errorf("check breaks: %w", err)
	}
	if overlapsBreaks(in.StartsAt, in.EndsAt, dayBreaks, dateStart, loc) {
		return nil, ErrSlotUnavailable
	}

	return &appointmentPlacementResult{Staff: staff}, nil
}

// slotParams holds the resolved scheduling parameters for one staff member on one day.
type slotParams struct {
	workStart time.Time
	workEnd   time.Time
	interval  time.Duration
}

// resolveSlotParams extracts the working hours from schedule rules for a
// specific day and location.
func resolveSlotParams(rules []ScheduleRule, date time.Time, loc *time.Location) (*slotParams, bool) {
	dayOfWeek := int(date.Weekday())

	var rule *ScheduleRule
	for i := range rules {
		if rules[i].DayOfWeek == dayOfWeek && rules[i].IsWorkingDay {
			rule = &rules[i]
			break
		}
	}
	if rule == nil {
		return nil, false
	}

	workStart, err := parseTimeOnDate(rule.StartTime, date, loc)
	if err != nil {
		return nil, false
	}
	workEnd, err := parseTimeOnDate(rule.EndTime, date, loc)
	if err != nil {
		return nil, false
	}

	interval := time.Duration(rule.SlotIntervalMinutes) * time.Minute
	if interval <= 0 {
		interval = 30 * time.Minute
	}

	return &slotParams{workStart: workStart, workEnd: workEnd, interval: interval}, true
}

// overlapsBreaks returns true if [start, end) overlaps any break in the list.
// Uses half-open interval semantics: a slot ending exactly at break start does NOT overlap.
func overlapsBreaks(start, end time.Time, breaks []ScheduleBreak, date time.Time, loc *time.Location) bool {
	for _, b := range breaks {
		bs, err := parseTimeOnDate(b.StartTime, date, loc)
		if err != nil {
			continue
		}
		be, err := parseTimeOnDate(b.EndTime, date, loc)
		if err != nil {
			continue
		}
		if start.Before(be) && end.After(bs) {
			return true
		}
	}
	return false
}

// filterBreaksByDay returns only breaks matching the given day_of_week.
func filterBreaksByDay(breaks []ScheduleBreak, dayOfWeek int) []ScheduleBreak {
	var filtered []ScheduleBreak
	for _, b := range breaks {
		if b.DayOfWeek == dayOfWeek {
			filtered = append(filtered, b)
		}
	}
	return filtered
}

// computeBlockedWindows returns slot positions within working hours that are
// blocked by a booking, time-off, or break (i.e. would be skipped by computeOpenWindows).
// Past slots are excluded — same rule as computeOpenWindows.
// serviceDuration is the actual service time; effectiveDuration includes buffer.
// Break checks use serviceDuration; booking overlap uses effectiveDuration.
func computeBlockedWindows(serviceDuration, effectiveDuration time.Duration, rules []ScheduleRule, timeOffs []TimeOff, booked []BookedSlot, breaks []ScheduleBreak, date time.Time, loc *time.Location) []openWindow {
	p, ok := resolveSlotParams(rules, date, loc)
	if !ok {
		return nil
	}

	now := time.Now().UTC()
	var windows []openWindow
	for slotStart := p.workStart; slotStart.Add(effectiveDuration).Before(p.workEnd) || slotStart.Add(effectiveDuration).Equal(p.workEnd); slotStart = slotStart.Add(p.interval) {
		serviceEnd := slotStart.Add(serviceDuration)
		slotEnd := slotStart.Add(effectiveDuration)
		if serviceEnd.Before(now) {
			continue
		}
		if overlapsTimeOff(slotStart, slotEnd, timeOffs) || overlapsBooked(slotStart, slotEnd, booked) || overlapsBreaks(slotStart, serviceEnd, breaks, date, loc) {
			windows = append(windows, openWindow{startsAt: slotStart, endsAt: serviceEnd})
		}
	}
	return windows
}

// computeOpenWindows returns all open time windows for one staff member on one day.
// serviceDuration is the actual service time; effectiveDuration includes buffer.
// Break checks use serviceDuration; booking overlap uses effectiveDuration.
func computeOpenWindows(serviceDuration, effectiveDuration time.Duration, rules []ScheduleRule, timeOffs []TimeOff, booked []BookedSlot,
	breaks []ScheduleBreak, date time.Time, loc *time.Location) []openWindow {
	p, ok := resolveSlotParams(rules, date, loc)
	if !ok {
		return nil
	}

	now := time.Now().UTC()
	var windows []openWindow
	for slotStart := p.workStart; slotStart.Add(effectiveDuration).Before(p.workEnd) || slotStart.Add(effectiveDuration).Equal(p.workEnd); slotStart = slotStart.Add(p.interval) {
		serviceEnd := slotStart.Add(serviceDuration)
		slotEnd := slotStart.Add(effectiveDuration)

		if serviceEnd.Before(now) {
			continue
		}
		if overlapsTimeOff(slotStart, slotEnd, timeOffs) {
			continue
		}
		if overlapsBooked(slotStart, slotEnd, booked) {
			continue
		}
		if overlapsBreaks(slotStart, serviceEnd, breaks, date, loc) {
			continue
		}
		windows = append(windows, openWindow{startsAt: slotStart, endsAt: serviceEnd})
	}
	return windows
}

func parseTimeOnDate(t string, date time.Time, loc *time.Location) (time.Time, error) {
	// t is "HH:MM:SS" or "HH:MM"
	parts := strings.Split(t, ":")
	if len(parts) < 2 {
		return time.Time{}, fmt.Errorf("invalid time %q", t)
	}
	var h, m int
	fmt.Sscanf(parts[0], "%d", &h)
	fmt.Sscanf(parts[1], "%d", &m)
	return time.Date(date.Year(), date.Month(), date.Day(), h, m, 0, 0, loc), nil
}

func overlapsTimeOff(start, end time.Time, offs []TimeOff) bool {
	for _, off := range offs {
		if start.Before(off.EndAt) && end.After(off.StartAt) {
			return true
		}
	}
	return false
}

// GetBookingLimitStatus returns the tenant's weekly booking limit and the
// customer's current-week booking count.
func (s *Service) GetBookingLimitStatus(ctx context.Context, tenantID, customerID uuid.UUID) (maxBookings int, count int64, err error) {
	maxBookings, err = s.repo.GetMaxWeeklyCustomerBookings(ctx, tenantID)
	if err != nil {
		return 0, 0, fmt.Errorf("get weekly booking limit: %w", err)
	}
	if maxBookings == 0 {
		return 0, 0, nil
	}
	weekStart, weekEnd := isoWeekBounds(time.Now())
	count, err = s.repo.CountCustomerAppointmentsInWeek(ctx, tenantID, customerID, weekStart, weekEnd)
	if err != nil {
		return 0, 0, fmt.Errorf("count weekly bookings: %w", err)
	}
	return maxBookings, count, nil
}

// isoWeekBounds returns the Monday 00:00:00 UTC and next Monday 00:00:00 UTC
// for the ISO week containing t.
func isoWeekBounds(t time.Time) (weekStart, weekEnd time.Time) {
	t = t.UTC()
	weekday := t.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	monday := t.AddDate(0, 0, -int(weekday-time.Monday))
	weekStart = time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, time.UTC)
	weekEnd = weekStart.AddDate(0, 0, 7)
	return
}

func overlapsBooked(start, end time.Time, booked []BookedSlot) bool {
	for _, b := range booked {
		if start.Before(b.BlockedUntil) && end.After(b.StartsAt) {
			return true
		}
	}
	return false
}

// ── CreateAppointment ─────────────────────────────────────────────────────────

func (s *Service) CreateAppointment(ctx context.Context, req CreateAppointmentRequest) (*Appointment, *StaffMember, error) {
	// ── Basic validation ──────────────────────────────────────────────────
	if req.TenantID == uuid.Nil {
		return nil, nil, ErrTenantRequired
	}
	if req.CustomerID == uuid.Nil {
		return nil, nil, ErrCustomerRequired
	}
	if len(req.ServiceIDs) == 0 {
		return nil, nil, ErrServiceRequired
	}
	if req.StartsAt.IsZero() {
		return nil, nil, ErrStartsAtRequired
	}
	if req.CreatedVia == "" {
		req.CreatedVia = CreatedViaCustomerApp
	}

	// ── Idempotency check ────────────────────────────────────────────────
	if req.IdempotencyKey != "" {
		existing, err := s.repo.GetAppointmentByIdempotencyKey(ctx, req.TenantID, req.IdempotencyKey)
		if err == nil && existing != nil {
			// Replay: verify payload matches.
			if existing.CustomerID != req.CustomerID || !existing.StartsAt.Equal(req.StartsAt.UTC()) {
				return nil, nil, ErrIdempotencyConflict
			}
			staff, _ := s.repo.GetStaffMember(ctx, req.TenantID, existing.StaffUserID)
			return existing, staff, nil
		}
	}

	// ── Tenant config ────────────────────────────────────────────────────
	cfg, err := s.repo.GetTenantBookingConfig(ctx, req.TenantID)
	if err != nil {
		return nil, nil, fmt.Errorf("get tenant config: %w", err)
	}
	loc, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		loc = time.UTC
	}
	buffer := time.Duration(cfg.BufferMinutes) * time.Minute

	// ── Advance booking window checks ────────────────────────────────────
	now := time.Now()
	if req.StartsAt.Before(now) {
		return nil, nil, ErrStartsAtRequired
	}
	if cfg.MinAdvanceMinutes > 0 {
		minTime := now.Add(time.Duration(cfg.MinAdvanceMinutes) * time.Minute)
		if req.StartsAt.Before(minTime) {
			return nil, nil, ErrTooSoon
		}
	}
	if cfg.MaxAdvanceDays > 0 {
		nowInLoc := now.In(loc)
		todayLoc := time.Date(nowInLoc.Year(), nowInLoc.Month(), nowInLoc.Day(), 0, 0, 0, 0, loc)
		maxDate := todayLoc.AddDate(0, 0, cfg.MaxAdvanceDays)
		if req.StartsAt.In(loc).After(maxDate) {
			return nil, nil, ErrTooFarOut
		}
	}

	// ── Same-day check ───────────────────────────────────────────────────
	if !cfg.SameDayBookingEnabled && req.CreatedVia == CreatedViaCustomerApp {
		nowInLoc := now.In(loc)
		todayLoc := time.Date(nowInLoc.Year(), nowInLoc.Month(), nowInLoc.Day(), 0, 0, 0, 0, loc)
		startsInLoc := req.StartsAt.In(loc)
		startsDay := time.Date(startsInLoc.Year(), startsInLoc.Month(), startsInLoc.Day(), 0, 0, 0, 0, loc)
		if startsDay.Equal(todayLoc) {
			return nil, nil, ErrSameDayDisabled
		}
	}

	// ── Weekly booking limit ─────────────────────────────────────────────
	if req.CreatedVia == CreatedViaCustomerApp && cfg.MaxWeeklyBookings > 0 {
		weekStart, weekEnd := isoWeekBounds(req.StartsAt)
		count, err := s.repo.CountCustomerAppointmentsInWeek(ctx, req.TenantID, req.CustomerID, weekStart, weekEnd)
		if err != nil {
			return nil, nil, fmt.Errorf("count weekly bookings: %w", err)
		}
		if count >= int64(cfg.MaxWeeklyBookings) {
			return nil, nil, ErrWeeklyBookingLimitReached
		}
	}

	// ── Fetch services, compute duration ─────────────────────────────────
	svcs := make([]*ServiceRecord, 0, len(req.ServiceIDs))
	var totalDuration time.Duration
	for _, svcID := range req.ServiceIDs {
		svc, err := s.repo.GetServiceByID(ctx, req.TenantID, svcID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, nil, ErrServiceInactive
			}
			return nil, nil, fmt.Errorf("get service: %w", err)
		}
		svcs = append(svcs, svc)
		totalDuration += time.Duration(svc.DurationMinutes) * time.Minute
	}

	endsAt := req.StartsAt.UTC().Add(totalDuration)
	blockedUntil := endsAt.Add(buffer)

	// ── Auto-assignment with retry ───────────────────────────────────────
	if req.StaffUserID == uuid.Nil {
		candidates, err := s.rankCandidates(ctx, req, svcs, blockedUntil, loc)
		if err != nil || len(candidates) == 0 {
			return nil, nil, ErrSlotUnavailable
		}

		maxAttempts := min(len(candidates), 3)

		for i := 0; i < maxAttempts; i++ {
			req.StaffUserID = candidates[i].ID
			appt, staff, err := s.createWithStaff(ctx, req, svcs, totalDuration, blockedUntil, cfg, loc)
			if err == nil {
				return appt, staff, nil
			}
			if !errors.Is(err, ErrSlotUnavailable) {
				return nil, nil, err
			}
			s.log.Info("auto-assign conflict, trying next candidate",
				zap.String("staff_user_id", candidates[i].ID.String()),
				zap.Int("attempt", i+1),
			)
			req.StaffUserID = uuid.Nil // reset for next iteration
		}
		return nil, nil, ErrSlotUnavailable
	}

	// ── Explicit staff ───────────────────────────────────────────────────
	return s.createWithStaff(ctx, req, svcs, totalDuration, blockedUntil, cfg, loc)
}

// createWithStaff runs the transactional INSERT for a specific staff member.
func (s *Service) createWithStaff(ctx context.Context, req CreateAppointmentRequest, svcs []*ServiceRecord,
	totalDuration time.Duration, blockedUntil time.Time, _ *TenantBookingConfig, loc *time.Location) (*Appointment, *StaffMember, error) {

	endsAt := req.StartsAt.UTC().Add(totalDuration)

	appt := &Appointment{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		CustomerID:   req.CustomerID,
		StaffUserID:  req.StaffUserID,
		StartsAt:     req.StartsAt.UTC(),
		EndsAt:       endsAt,
		BlockedUntil: blockedUntil,
		Status:       StatusConfirmed,
		CreatedVia:   req.CreatedVia,
	}
	if req.NotesCustomer != "" {
		appt.NotesCustomer = &req.NotesCustomer
	}
	if req.IdempotencyKey != "" {
		appt.IdempotencyKey = &req.IdempotencyKey
	}

	// Build service snapshots with staff-specific pricing.
	apptServices := make([]AppointmentService, 0, len(svcs))
	for _, svc := range svcs {
		price := svc.BasePrice
		if customPrice, err := s.repo.GetStaffCustomPrice(ctx, req.StaffUserID, svc.ID); err == nil && customPrice != "" {
			price = customPrice
		}
		apptSvc := AppointmentService{
			ID:                      uuid.New(),
			TenantID:                req.TenantID,
			AppointmentID:           appt.ID,
			ServiceNameSnapshot:     svc.Name,
			DurationMinutesSnapshot: svc.DurationMinutes,
			PriceSnapshot:           price,
			PointsRewardSnapshot:    svc.PointsReward,
		}
		if svc.ID != uuid.Nil {
			apptSvc.ServiceID = &svc.ID
		}
		apptServices = append(apptServices, apptSvc)
	}

	var validatedStaff *StaffMember
	if err := s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		// Advisory lock on staff schedule to prevent appointment/time-off races.
		if err := s.repo.AcquireStaffScheduleLock(txCtx, req.StaffUserID); err != nil {
			return fmt.Errorf("acquire staff lock: %w", err)
		}

		validated, err := s.validateAppointmentPlacement(txCtx, appointmentPlacementInput{
			TenantID:     req.TenantID,
			StaffUserID:  req.StaffUserID,
			ServiceIDs:   req.ServiceIDs,
			StartsAt:     appt.StartsAt,
			EndsAt:       appt.EndsAt,
			BlockedUntil: appt.BlockedUntil,
		}, loc)
		if err != nil {
			return err
		}
		validatedStaff = validated.Staff

		// INSERT appointment (exclusion constraint is secondary safety net).
		if err := s.repo.CreateAppointment(txCtx, appt); err != nil {
			if isOverlapErr(err) {
				return ErrSlotUnavailable
			}
			return fmt.Errorf("create appt: %w", err)
		}
		for i := range apptServices {
			if err := s.repo.CreateAppointmentService(txCtx, &apptServices[i]); err != nil {
				return fmt.Errorf("create appt service: %w", err)
			}
		}
		if s.reminders != nil {
			if err := s.reminders.ScheduleAppointmentReminders(txCtx, req.TenantID, appt.ID, req.CustomerID, appt.StartsAt); err != nil {
				return fmt.Errorf("schedule reminders: %w", err)
			}
		}
		if s.notifications != nil {
			refID := appt.ID
			if err := s.notifications.CreateNotification(txCtx, req.TenantID, req.CustomerID,
				"booking", "Appointment Confirmed",
				fmt.Sprintf("Your appointment is confirmed for %s.", appt.StartsAt.In(loc).Format("02 Jan 15:04")),
				fmt.Sprintf("berberim://appointments/%s", appt.ID), &refID,
			); err != nil {
				s.log.Warn("failed to create booking notification", zap.Error(err))
			}
		}
		return nil
	}); err != nil {
		return nil, nil, err
	}

	if validatedStaff == nil {
		validatedStaff, _ = s.repo.GetStaffMember(ctx, req.TenantID, appt.StaffUserID)
	}
	return appt, validatedStaff, nil
}

// rankCandidates returns qualified and available staff members for auto-assignment,
// ranked by: preferred staff → least-loaded today → UUID tiebreak.
func (s *Service) rankCandidates(ctx context.Context, req CreateAppointmentRequest, svcs []*ServiceRecord, blockedUntil time.Time, loc *time.Location) ([]StaffMember, error) {
	qualified, err := s.repo.ListStaffByServices(ctx, req.TenantID, req.ServiceIDs)
	if err != nil {
		return nil, fmt.Errorf("list staff: %w", err)
	}

	startsAt := req.StartsAt.UTC()
	endsAt := startsAt
	for _, svc := range svcs {
		endsAt = endsAt.Add(time.Duration(svc.DurationMinutes) * time.Minute)
	}

	// Filter to staff actually free at this time.
	var free []StaffMember
	for _, m := range qualified {
		// Check time-offs.
		offs, err := s.repo.ListTimeOffs(ctx, req.TenantID, m.ID, startsAt, blockedUntil)
		if err != nil {
			continue
		}
		if len(offs) > 0 {
			continue
		}
		// Check booked slots.
		booked, err := s.repo.ListBookedSlots(ctx, req.TenantID, m.ID, startsAt, blockedUntil)
		if err != nil {
			continue
		}
		if len(booked) > 0 {
			continue
		}
		// Check schedule rules (must be a working day and within hours).
		rules, err := s.repo.ListStaffScheduleRules(ctx, req.TenantID, m.ID)
		if err != nil {
			continue
		}
		date := startsAt.In(loc)
		dateStart := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
		p, ok := resolveSlotParams(rules, dateStart, loc)
		if !ok {
			continue
		}
		if startsAt.Before(p.workStart) || blockedUntil.After(p.workEnd) {
			continue
		}
		// Check recurring breaks (uses service end time, not blocked_until).
		breaks, err := s.repo.ListScheduleBreaksByDay(ctx, req.TenantID, m.ID, int(dateStart.Weekday()))
		if err != nil {
			continue
		}
		if overlapsBreaks(startsAt, endsAt, breaks, dateStart, loc) {
			continue
		}
		free = append(free, m)
	}

	if len(free) == 0 {
		return nil, nil
	}

	// Check if customer has a preferred staff member.
	var preferredStaff uuid.UUID
	if req.CustomerID != uuid.Nil {
		tz, _ := s.repo.GetTenantTimezone(ctx, req.TenantID)
		if tz == "" {
			tz = "UTC"
		}
		if pattern, err := s.repo.GetCustomerBookingPatterns(ctx, req.TenantID, req.CustomerID, tz); err == nil && pattern.StaffVisits >= 2 {
			preferredStaff = pattern.PreferredStaff
		}
	}

	// Count today's appointments for each candidate (for least-loaded ranking).
	nowInLoc := time.Now().In(loc)
	todayStart := time.Date(nowInLoc.Year(), nowInLoc.Month(), nowInLoc.Day(), 0, 0, 0, 0, loc)
	todayEnd := todayStart.AddDate(0, 0, 1)

	type ranked struct {
		member     StaffMember
		preferred  bool
		todayCount int64
	}
	rankings := make([]ranked, 0, len(free))
	for _, m := range free {
		count, _ := s.repo.CountStaffAppointmentsToday(ctx, req.TenantID, m.ID, todayStart, todayEnd)
		rankings = append(rankings, ranked{
			member:     m,
			preferred:  m.ID == preferredStaff,
			todayCount: count,
		})
	}

	// Sort: preferred first, then least-loaded, then UUID tiebreak.
	for i := 1; i < len(rankings); i++ {
		for j := i; j > 0; j-- {
			swap := false
			if rankings[j].preferred && !rankings[j-1].preferred {
				swap = true
			} else if rankings[j].preferred == rankings[j-1].preferred {
				if rankings[j].todayCount < rankings[j-1].todayCount {
					swap = true
				} else if rankings[j].todayCount == rankings[j-1].todayCount {
					if rankings[j].member.ID.String() < rankings[j-1].member.ID.String() {
						swap = true
					}
				}
			}
			if !swap {
				break
			}
			rankings[j], rankings[j-1] = rankings[j-1], rankings[j]
		}
	}

	result := make([]StaffMember, len(rankings))
	for i, r := range rankings {
		result[i] = r.member
	}
	return result, nil
}

// ── CancelAppointment ─────────────────────────────────────────────────────────

func (s *Service) CancelAppointment(ctx context.Context, req CancelAppointmentRequest) error {
	if req.TenantID == uuid.Nil {
		return ErrTenantRequired
	}
	return s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		appt, err := s.repo.GetAppointmentForUpdate(txCtx, req.TenantID, req.AppointmentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return fmt.Errorf("get appointment: %w", err)
		}
		if req.CustomerID != uuid.Nil && appt.CustomerID != req.CustomerID {
			return ErrNotFound
		}
		if appt.Status != StatusConfirmed {
			return fmt.Errorf("%w: cannot cancel a %s appointment", ErrInvalidTransition, appt.Status)
		}
		extra := map[string]interface{}{
			"cancellation_reason": req.Reason,
			"cancelled_by_type":   req.CancelledByType,
		}
		if err := s.repo.UpdateAppointmentStatus(txCtx, req.TenantID, appt.ID, StatusCancelled, extra); err != nil {
			return fmt.Errorf("cancel: %w", err)
		}
		if s.reminders != nil {
			if err := s.reminders.CancelAppointmentReminders(txCtx, req.TenantID, appt.ID, "appointment_cancelled"); err != nil {
				return fmt.Errorf("cancel reminders: %w", err)
			}
		}
		if s.notifications != nil {
			loc := s.loadTenantLocation(txCtx, req.TenantID)
			refID := appt.ID
			if err := s.notifications.CreateNotification(txCtx, req.TenantID, appt.CustomerID,
				"status", "Appointment Cancelled",
				fmt.Sprintf("Your appointment on %s has been cancelled.", appt.StartsAt.In(loc).Format("02 Jan 15:04")),
				fmt.Sprintf("berberim://appointments/%s", appt.ID), &refID,
			); err != nil {
				s.log.Warn("failed to create cancellation notification", zap.Error(err))
			}
		}
		return nil
	})
}

// ── RescheduleAppointment ─────────────────────────────────────────────────────

func (s *Service) RescheduleAppointment(ctx context.Context, req RescheduleAppointmentRequest) (*Appointment, error) {
	var newAppt *Appointment
	err := s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		old, err := s.repo.GetAppointmentForUpdate(txCtx, req.TenantID, req.AppointmentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return fmt.Errorf("get appointment: %w", err)
		}
		if req.CustomerID != uuid.Nil && old.CustomerID != req.CustomerID {
			return ErrNotFound
		}
		if old.Status != StatusConfirmed {
			return fmt.Errorf("%w: cannot reschedule a %s appointment", ErrInvalidTransition, old.Status)
		}

		newStaffID := old.StaffUserID
		if req.NewStaffUserID != uuid.Nil {
			newStaffID = req.NewStaffUserID
		}

		// Copy service snapshots from the original.
		origSvcs, err := s.repo.ListAppointmentServices(ctx, old.ID)
		if err != nil {
			return fmt.Errorf("list services: %w", err)
		}
		serviceIDs := make([]uuid.UUID, 0, len(origSvcs))
		for _, svc := range origSvcs {
			if svc.ServiceID != nil && *svc.ServiceID != uuid.Nil {
				serviceIDs = append(serviceIDs, *svc.ServiceID)
			}
		}

		// Load buffer from tenant config for the new blocked_until.
		cfg, err := s.repo.GetTenantBookingConfig(txCtx, req.TenantID)
		if err != nil {
			return fmt.Errorf("get tenant config: %w", err)
		}
		buffer := time.Duration(cfg.BufferMinutes) * time.Minute
		newEndsAt := req.NewStartsAt.UTC().Add(old.Duration())

		newAppt = &Appointment{
			ID:                           uuid.New(),
			TenantID:                     req.TenantID,
			CustomerID:                   old.CustomerID,
			StaffUserID:                  newStaffID,
			StartsAt:                     req.NewStartsAt.UTC(),
			EndsAt:                       newEndsAt,
			BlockedUntil:                 newEndsAt.Add(buffer),
			Status:                       StatusConfirmed,
			CreatedVia:                   old.CreatedVia,
			RescheduledFromAppointmentID: &old.ID,
		}

		// Advisory lock + time-off check for the new staff/time.
		if err := s.repo.AcquireStaffScheduleLock(txCtx, newStaffID); err != nil {
			return fmt.Errorf("acquire staff lock: %w", err)
		}
		loc, _ := time.LoadLocation(cfg.Timezone)
		if loc == nil {
			loc = time.UTC
		}
		if _, err := s.validateAppointmentPlacement(txCtx, appointmentPlacementInput{
			TenantID:             req.TenantID,
			StaffUserID:          newStaffID,
			ServiceIDs:           serviceIDs,
			StartsAt:             newAppt.StartsAt,
			EndsAt:               newAppt.EndsAt,
			BlockedUntil:         newAppt.BlockedUntil,
			ExcludeAppointmentID: old.ID,
		}, loc); err != nil {
			return err
		}

		if err := s.repo.UpdateAppointmentStatus(txCtx, req.TenantID, old.ID, StatusRescheduled, nil); err != nil {
			return fmt.Errorf("mark rescheduled: %w", err)
		}
		if err := s.repo.CreateAppointment(txCtx, newAppt); err != nil {
			if isOverlapErr(err) {
				return ErrSlotUnavailable
			}
			return fmt.Errorf("create rescheduled appointment: %w", err)
		}

		for _, origSvc := range origSvcs {
			newSvc := &AppointmentService{
				ID:                      uuid.New(),
				TenantID:                req.TenantID,
				AppointmentID:           newAppt.ID,
				ServiceID:               origSvc.ServiceID,
				ServiceNameSnapshot:     origSvc.ServiceNameSnapshot,
				DurationMinutesSnapshot: origSvc.DurationMinutesSnapshot,
				PriceSnapshot:           origSvc.PriceSnapshot,
				PointsRewardSnapshot:    origSvc.PointsRewardSnapshot,
			}
			if err := s.repo.CreateAppointmentService(txCtx, newSvc); err != nil {
				return fmt.Errorf("copy service snapshot: %w", err)
			}
		}
		if s.reminders != nil {
			if err := s.reminders.CancelAppointmentReminders(txCtx, req.TenantID, old.ID, "appointment_rescheduled"); err != nil {
				return fmt.Errorf("cancel old reminders: %w", err)
			}
			if err := s.reminders.ScheduleAppointmentReminders(txCtx, req.TenantID, newAppt.ID, newAppt.CustomerID, newAppt.StartsAt); err != nil {
				return fmt.Errorf("schedule new reminders: %w", err)
			}
		}
		if s.notifications != nil {
			loc := s.loadTenantLocation(txCtx, req.TenantID)
			refID := newAppt.ID
			if err := s.notifications.CreateNotification(txCtx, req.TenantID, newAppt.CustomerID,
				"status", "Appointment Rescheduled",
				fmt.Sprintf("Your appointment has been rescheduled to %s.", newAppt.StartsAt.In(loc).Format("02 Jan 15:04")),
				fmt.Sprintf("berberim://appointments/%s", newAppt.ID), &refID,
			); err != nil {
				s.log.Warn("failed to create reschedule notification", zap.Error(err))
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return newAppt, nil
}

// ── CompleteAppointment ───────────────────────────────────────────────────────

func (s *Service) CompleteAppointment(ctx context.Context, req CompleteAppointmentRequest) error {
	return s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		appt, err := s.repo.GetAppointmentForUpdate(txCtx, req.TenantID, req.AppointmentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return fmt.Errorf("get appointment: %w", err)
		}
		if appt.Status != StatusPaymentReceived {
			return fmt.Errorf("%w: cannot complete a %s appointment (payment must be received first)", ErrInvalidTransition, appt.Status)
		}
		now := time.Now()
		if err := s.repo.UpdateAppointmentStatus(txCtx, req.TenantID, appt.ID, StatusCompleted, map[string]interface{}{
			"completed_at": now,
		}); err != nil {
			return fmt.Errorf("complete: %w", err)
		}
		if s.reminders != nil {
			if err := s.reminders.CancelAppointmentReminders(txCtx, req.TenantID, appt.ID, "appointment_completed"); err != nil {
				return fmt.Errorf("cancel reminders: %w", err)
			}
		}
		return nil
	})
}

// ── MarkNoShow ────────────────────────────────────────────────────────────────

func (s *Service) MarkNoShow(ctx context.Context, req MarkNoShowRequest) error {
	return s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		appt, err := s.repo.GetAppointmentForUpdate(txCtx, req.TenantID, req.AppointmentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return fmt.Errorf("get appointment: %w", err)
		}
		if appt.Status != StatusConfirmed {
			return fmt.Errorf("%w: cannot mark no-show on a %s appointment", ErrInvalidTransition, appt.Status)
		}
		now := time.Now()
		if err := s.repo.UpdateAppointmentStatus(txCtx, req.TenantID, appt.ID, StatusNoShow, map[string]interface{}{
			"no_show_marked_at": now,
		}); err != nil {
			return fmt.Errorf("no-show: %w", err)
		}
		if s.reminders != nil {
			if err := s.reminders.CancelAppointmentReminders(txCtx, req.TenantID, appt.ID, "appointment_no_show"); err != nil {
				return fmt.Errorf("cancel reminders: %w", err)
			}
		}
		return nil
	})
}

// ── MarkPaymentReceived ───────────────────────────────────────────────────────

func (s *Service) MarkPaymentReceived(ctx context.Context, req MarkPaymentReceivedRequest) error {
	return s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		appt, err := s.repo.GetAppointmentForUpdate(txCtx, req.TenantID, req.AppointmentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return fmt.Errorf("get appointment: %w", err)
		}
		if appt.Status != StatusConfirmed {
			return fmt.Errorf("%w: payment can only be marked on confirmed appointments", ErrInvalidTransition)
		}

		if err := s.repo.UpdateAppointmentStatus(txCtx, req.TenantID, appt.ID, StatusPaymentReceived, nil); err != nil {
			return fmt.Errorf("mark payment: %w", err)
		}

		// Award loyalty points in the same transaction.
		svcs, err := s.repo.ListAppointmentServices(txCtx, appt.ID)
		if err != nil {
			return fmt.Errorf("list appointment services: %w", err)
		}
		totalPoints := 0
		for _, svc := range svcs {
			totalPoints += svc.PointsRewardSnapshot
		}
		if totalPoints > 0 && s.loyalty != nil {
			if err := s.loyalty.AwardPoints(txCtx, req.TenantID, appt.CustomerID, appt.ID, totalPoints); err != nil {
				return fmt.Errorf("award loyalty: %w", err)
			}
		}
		return nil
	})
}

// ── ListAppointments ──────────────────────────────────────────────────────────

func (s *Service) ListAppointments(ctx context.Context, q ListQuery) (*ListResult, error) {
	if q.TenantID == uuid.Nil {
		return nil, ErrTenantRequired
	}

	appts, total, err := s.repo.ListAppointments(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("list appointments: %w", err)
	}

	apptIDs := make([]uuid.UUID, 0, len(appts))
	staffIDs := make(map[uuid.UUID]bool)
	custIDs := make(map[uuid.UUID]bool)
	for _, a := range appts {
		apptIDs = append(apptIDs, a.ID)
		staffIDs[a.StaffUserID] = true
		custIDs[a.CustomerID] = true
	}

	allSvcs, err := s.repo.ListMultiAppointmentServices(ctx, apptIDs)
	if err != nil {
		s.log.Error("failed to fetch services for appointments", zap.Error(err))
	}

	// Fetch staff members in batch
	staffMap := make(map[uuid.UUID]*StaffMember)
	for sid := range staffIDs {
		if staff, err := s.repo.GetStaffMember(ctx, q.TenantID, sid); err == nil {
			staffMap[sid] = staff
		}
	}

	// Fetch customers in batch
	custMap := make(map[uuid.UUID]*CustomerInfo)
	for cid := range custIDs {
		if cust, err := s.repo.GetCustomerInfo(ctx, q.TenantID, cid); err == nil {
			custMap[cid] = cust
		}
	}

	// Fetch reviews in batch
	reviewMap, err := s.repo.ListReviewsByAppointmentIDs(ctx, apptIDs)
	if err != nil {
		s.log.Error("failed to fetch reviews for appointments", zap.Error(err))
	}

	// Group services by appointment ID
	svcsMap := make(map[uuid.UUID][]AppointmentService)
	for _, svc := range allSvcs {
		svcsMap[svc.AppointmentID] = append(svcsMap[svc.AppointmentID], svc)
	}

	apptSvcs := make([][]AppointmentService, 0, len(appts))
	apptStaff := make([]*StaffMember, 0, len(appts))
	apptCust := make([]*CustomerInfo, 0, len(appts))
	apptReviews := make([]*ReviewInfo, 0, len(appts))

	for _, a := range appts {
		apptSvcs = append(apptSvcs, svcsMap[a.ID])
		apptStaff = append(apptStaff, staffMap[a.StaffUserID])
		apptCust = append(apptCust, custMap[a.CustomerID])
		apptReviews = append(apptReviews, reviewMap[a.ID])
	}

	pageSize := q.PageSize
	if pageSize < 1 {
		pageSize = 20
	}

	totalPages := int32(math.Ceil(float64(total) / float64(pageSize)))

	return &ListResult{
		Appointments: appts,
		Services:     apptSvcs,
		Staff:        apptStaff,
		Customers:    apptCust,
		Reviews:      apptReviews,
		Total:        int32(total),
		TotalPages:   totalPages,
	}, nil
}

// ── GetAppointment ────────────────────────────────────────────────────────────

func (s *Service) GetAppointment(ctx context.Context, tenantID, appointmentID uuid.UUID) (*GetResult, error) {
	appt, err := s.repo.GetAppointment(ctx, tenantID, appointmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("get appointment: %w", err)
	}

	svcs, err := s.repo.ListAppointmentServices(ctx, appointmentID)
	if err != nil {
		return nil, fmt.Errorf("list services: %w", err)
	}

	staff, err := s.repo.GetStaffMember(ctx, tenantID, appt.StaffUserID)
	if err != nil {
		s.log.Warn("failed to fetch staff member for appointment", zap.String("appointment_id", appt.ID.String()), zap.Error(err))
	}

	cust, err := s.repo.GetCustomerInfo(ctx, tenantID, appt.CustomerID)
	if err != nil {
		s.log.Warn("failed to fetch customer for appointment", zap.String("appointment_id", appt.ID.String()), zap.Error(err))
	}

	return &GetResult{
		Appointment: appt,
		Services:    svcs,
		Staff:       staff,
		Customer:    cust,
	}, nil
}

func (s *Service) GetCustomerAppointment(ctx context.Context, tenantID, customerID, appointmentID uuid.UUID) (*GetResult, error) {
	res, err := s.GetAppointment(ctx, tenantID, appointmentID)
	if err != nil {
		return nil, err
	}
	if res.Appointment.CustomerID != customerID {
		return nil, ErrNotFound
	}
	return res, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

func staffMemberToOption(m *StaffMember) StaffOption {
	return StaffOption{
		ID:          m.ID,
		FirstName:   m.FirstName,
		LastName:    m.LastName,
		AvatarKey:   m.AvatarKey,
		Specialty:   m.Specialty,
		Bio:         m.Bio,
		AvgRating:   m.AvgRating,
		ReviewCount: m.ReviewCount,
	}
}

// isOverlapErr returns true when a PostgreSQL exclusion constraint violation
// (SQLSTATE 23P01) is detected — signalling a double-booking attempt.
func isOverlapErr(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23P01" // exclusion_violation
	}
	return false
}

// ── Slot Recommendations ─────────────────────────────────────────────────────

const (
	labelEarliest       = "earliest"
	labelPreferredTime  = "preferred_time"
	labelPreferredStaff = "preferred_staff"
	labelPopular        = "popular"
	maxRecommendations  = 4
)

// ── SearchStaffAvailability ─────────────────────────────────────────────────

func (s *Service) SearchStaffAvailability(ctx context.Context, req SearchStaffAvailabilityRequest) (*StaffAvailabilityResult, error) {
	if req.TenantID == uuid.Nil {
		return nil, ErrTenantRequired
	}
	if req.StaffUserID == uuid.Nil {
		return nil, ErrStaffRequired
	}

	// Parse and validate date range.
	fromDate, err := time.Parse("2006-01-02", req.FromDate)
	if err != nil {
		return nil, ErrInvalidDate
	}
	toDate, err := time.Parse("2006-01-02", req.ToDate)
	if err != nil {
		return nil, ErrInvalidDate
	}
	if toDate.Before(fromDate) {
		return nil, ErrInvalidDate
	}
	dayCount := int(toDate.Sub(fromDate).Hours()/24) + 1
	if dayCount > 14 {
		return nil, ErrDateRangeTooLarge
	}

	// Load compatible services for this staff member.
	compatibleServices, err := s.repo.ListStaffServicesByStaff(ctx, req.TenantID, req.StaffUserID)
	if err != nil {
		return nil, fmt.Errorf("list staff services: %w", err)
	}

	// If service_ids provided, filter and compute duration from those.
	// Otherwise, use the shortest compatible service as default duration.
	var totalDuration time.Duration
	if len(req.ServiceIDs) > 0 {
		compatibleByID := make(map[uuid.UUID]bool, len(compatibleServices))
		for _, svc := range compatibleServices {
			compatibleByID[svc.ID] = true
		}
		for _, svcID := range req.ServiceIDs {
			if !compatibleByID[svcID] {
				return nil, ErrStaffUnavailableForService
			}
			svc, err := s.repo.GetServiceByID(ctx, req.TenantID, svcID)
			if err != nil {
				return nil, fmt.Errorf("get service: %w", err)
			}
			totalDuration += time.Duration(svc.DurationMinutes) * time.Minute
		}
	} else if len(compatibleServices) > 0 {
		shortest := compatibleServices[0].DurationMinutes
		for _, svc := range compatibleServices[1:] {
			if svc.DurationMinutes < shortest {
				shortest = svc.DurationMinutes
			}
		}
		totalDuration = time.Duration(shortest) * time.Minute
	} else {
		totalDuration = 30 * time.Minute // fallback
	}

	// Load tenant config.
	cfg, err := s.repo.GetTenantBookingConfig(ctx, req.TenantID)
	if err != nil {
		return nil, fmt.Errorf("get tenant config: %w", err)
	}
	loc, err := time.LoadLocation(cfg.Timezone)
	if err != nil {
		loc = time.UTC
	}
	buffer := time.Duration(cfg.BufferMinutes) * time.Minute
	effectiveDuration := totalDuration + buffer

	// Load scheduling data for this single staff member.
	rangeStart := time.Date(fromDate.Year(), fromDate.Month(), fromDate.Day(), 0, 0, 0, 0, loc)
	rangeEnd := time.Date(toDate.Year(), toDate.Month(), toDate.Day(), 0, 0, 0, 0, loc).AddDate(0, 0, 1)

	rules, err := s.repo.ListStaffScheduleRules(ctx, req.TenantID, req.StaffUserID)
	if err != nil {
		return nil, fmt.Errorf("schedule rules: %w", err)
	}
	allBreaks, err := s.repo.ListScheduleBreaks(ctx, req.TenantID, req.StaffUserID)
	if err != nil {
		return nil, fmt.Errorf("schedule breaks: %w", err)
	}
	timeOffs, err := s.repo.ListTimeOffs(ctx, req.TenantID, req.StaffUserID, rangeStart, rangeEnd)
	if err != nil {
		return nil, fmt.Errorf("time offs: %w", err)
	}
	booked, err := s.repo.ListBookedSlots(ctx, req.TenantID, req.StaffUserID, rangeStart, rangeEnd)
	if err != nil {
		return nil, fmt.Errorf("booked slots: %w", err)
	}

	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	var days []DayAvailability
	for d := 0; d < dayCount; d++ {
		date := fromDate.AddDate(0, 0, d)
		dateInLoc := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, loc)
		dateStr := date.Format("2006-01-02")

		if !cfg.SameDayBookingEnabled && dateInLoc.Equal(today) {
			days = append(days, DayAvailability{Date: dateStr})
			continue
		}

		dayStart := dateInLoc
		dayEnd := dateInLoc.AddDate(0, 0, 1)
		dayBreaks := filterBreaksByDay(allBreaks, int(dateInLoc.Weekday()))

		var dayOffs []TimeOff
		for _, off := range timeOffs {
			if off.StartAt.Before(dayEnd) && off.EndAt.After(dayStart) {
				dayOffs = append(dayOffs, off)
			}
		}
		var dayBooked []BookedSlot
		for _, b := range booked {
			if b.StartsAt.Before(dayEnd) && b.BlockedUntil.After(dayStart) {
				dayBooked = append(dayBooked, b)
			}
		}

		var daySlots []AvailableSlot
		for _, w := range computeOpenWindows(totalDuration, effectiveDuration, rules, dayOffs, dayBooked, dayBreaks, dateInLoc, loc) {
			daySlots = append(daySlots, AvailableSlot{
				StartsAt: w.startsAt,
				EndsAt:   w.endsAt,
			})
		}

		var filledSlots []FilledSlot
		for _, w := range computeBlockedWindows(totalDuration, effectiveDuration, rules, dayOffs, dayBooked, dayBreaks, dateInLoc, loc) {
			filledSlots = append(filledSlots, FilledSlot{
				StartsAt: w.startsAt,
				EndsAt:   w.endsAt,
			})
		}

		days = append(days, DayAvailability{
			Date:        dateStr,
			Slots:       daySlots,
			FilledSlots: filledSlots,
		})
	}

	return &StaffAvailabilityResult{
		Days:               days,
		CompatibleServices: compatibleServices,
	}, nil
}

// ── GetAvailabilityDays ─────────────────────────────────────────────────────

// GetAvailabilityDays returns which dates have at least one available slot.
func (s *Service) GetAvailabilityDays(ctx context.Context, tenantID uuid.UUID, serviceIDs []uuid.UUID, staffUserID uuid.UUID, fromDate, toDate string) ([]string, error) {
	result, err := s.SearchMultiDayAvailability(ctx, SearchMultiDayAvailabilityRequest{
		TenantID:    tenantID,
		ServiceIDs:  serviceIDs,
		StaffUserID: staffUserID,
		FromDate:    fromDate,
		ToDate:      toDate,
	})
	if err != nil {
		return nil, err
	}

	var dates []string
	for _, day := range result.Days {
		if len(day.Slots) > 0 {
			dates = append(dates, day.Date)
		}
	}
	return dates, nil
}
