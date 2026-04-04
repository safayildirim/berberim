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

type RepoInterface interface {
	GetTenantTimezone(ctx context.Context, tenantID uuid.UUID) (string, error)
	GetMaxWeeklyCustomerBookings(ctx context.Context, tenantID uuid.UUID) (int, error)
	CountCustomerAppointmentsInWeek(ctx context.Context, tenantID, customerID uuid.UUID, weekStart, weekEnd time.Time) (int64, error)
	GetServiceByID(ctx context.Context, tenantID, serviceID uuid.UUID) (*ServiceRecord, error)
	GetStaffMember(ctx context.Context, tenantID, staffUserID uuid.UUID) (*StaffMember, error)
	GetCustomerInfo(ctx context.Context, tenantID, customerID uuid.UUID) (*CustomerInfo, error)
	ListStaffByServices(ctx context.Context, tenantID uuid.UUID, serviceIDs []uuid.UUID) ([]StaffMember, error)
	ListStaffScheduleRules(ctx context.Context, tenantID, staffUserID uuid.UUID) ([]ScheduleRule, error)
	ListTimeOffs(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]TimeOff, error)
	ListBookedSlots(ctx context.Context, tenantID, staffUserID uuid.UUID, from, to time.Time) ([]BookedSlot, error)
	CreateAppointment(ctx context.Context, a *Appointment) error
	CreateAppointmentService(ctx context.Context, as *AppointmentService) error
	GetAppointment(ctx context.Context, tenantID, appointmentID uuid.UUID) (*Appointment, error)
	GetAppointmentForUpdate(ctx context.Context, tenantID, appointmentID uuid.UUID) (*Appointment, error)
	UpdateAppointmentStatus(ctx context.Context, tenantID, appointmentID uuid.UUID, status string, extra map[string]interface{}) error
	ListAppointments(ctx context.Context, q ListQuery) ([]Appointment, int64, error)
	ListAppointmentServices(ctx context.Context, appointmentID uuid.UUID) ([]AppointmentService, error)
	ListMultiAppointmentServices(ctx context.Context, appointmentIDs []uuid.UUID) ([]AppointmentService, error)
	ListReviewsByAppointmentIDs(ctx context.Context, appointmentIDs []uuid.UUID) (map[uuid.UUID]*ReviewInfo, error)
	RunInTx(ctx context.Context, fn func(ctx context.Context) error) error
	GetCustomerBookingPatterns(ctx context.Context, tenantID, customerID uuid.UUID, tz string) (*BookingPattern, error)
	GetTenantPopularHours(ctx context.Context, tenantID uuid.UUID, tz string) ([]PopularHour, error)
}

type Service struct {
	repo      RepoInterface
	loyalty   LoyaltyService
	reminders ReminderScheduler
	log       *zap.Logger
}

func NewService(repo RepoInterface, loyalty LoyaltyService, log *zap.Logger) *Service {
	return &Service{repo: repo, loyalty: loyalty, log: log}
}

func (s *Service) SetReminderScheduler(reminderScheduler ReminderScheduler) {
	s.reminders = reminderScheduler
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
	TenantID      uuid.UUID
	CustomerID    uuid.UUID
	StaffUserID   uuid.UUID
	ServiceIDs    []uuid.UUID
	StartsAt      time.Time
	NotesCustomer string
	CreatedVia    string
}

type CancelAppointmentRequest struct {
	TenantID      uuid.UUID
	AppointmentID uuid.UUID
	Reason        string
	// "customer" | "staff" | "admin"
	CancelledByType string
}

type RescheduleAppointmentRequest struct {
	TenantID       uuid.UUID
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

	loc := s.loadTenantLocation(ctx, req.TenantID)

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
		for _, w := range computeOpenWindows(totalDuration, rules, timeOffs, booked, dayStart, loc) {
			flat = append(flat, staffTime{member: member, startsAt: w.startsAt, endsAt: w.endsAt})
			allPositions[w.startsAt] = w.endsAt
		}
		// Also record positions that are within working hours but blocked (booked/time-off).
		for _, w := range computeBlockedWindows(totalDuration, rules, timeOffs, booked, dayStart, loc) {
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

type openWindow struct {
	startsAt time.Time
	endsAt   time.Time
}

// computeBlockedWindows returns slot positions within working hours that are
// blocked by a booking or time-off (i.e. would be skipped by computeOpenWindows).
// Past slots are excluded — same rule as computeOpenWindows.
func computeBlockedWindows(duration time.Duration, rules []ScheduleRule, timeOffs []TimeOff, booked []BookedSlot, date time.Time, loc *time.Location) []openWindow {
	dayOfWeek := int(date.Weekday())

	var rule *ScheduleRule
	for i := range rules {
		if rules[i].DayOfWeek == dayOfWeek && rules[i].IsWorkingDay {
			rule = &rules[i]
			break
		}
	}
	if rule == nil {
		return nil
	}

	workStart, err := parseTimeOnDate(rule.StartTime, date, loc)
	if err != nil {
		return nil
	}
	workEnd, err := parseTimeOnDate(rule.EndTime, date, loc)
	if err != nil {
		return nil
	}

	interval := time.Duration(rule.SlotIntervalMinutes) * time.Minute
	if interval <= 0 {
		interval = 30 * time.Minute
	}

	now := time.Now().UTC()
	var windows []openWindow
	for slotStart := workStart; slotStart.Add(duration).Before(workEnd) || slotStart.Add(duration).Equal(workEnd); slotStart = slotStart.Add(interval) {
		slotEnd := slotStart.Add(duration)
		if slotEnd.Before(now) {
			continue
		}
		if overlapsTimeOff(slotStart, slotEnd, timeOffs) || overlapsBooked(slotStart, slotEnd, booked) {
			windows = append(windows, openWindow{startsAt: slotStart, endsAt: slotEnd})
		}
	}
	return windows
}

// computeOpenWindows returns all open time windows for one staff member on one day.
func computeOpenWindows(duration time.Duration, rules []ScheduleRule, timeOffs []TimeOff, booked []BookedSlot,
	date time.Time, loc *time.Location) []openWindow {
	dayOfWeek := int(date.Weekday()) // 0=Sunday

	var rule *ScheduleRule
	for i := range rules {
		if rules[i].DayOfWeek == dayOfWeek && rules[i].IsWorkingDay {
			rule = &rules[i]
			break
		}
	}
	if rule == nil {
		return nil
	}

	workStart, err := parseTimeOnDate(rule.StartTime, date, loc)
	if err != nil {
		return nil
	}
	workEnd, err := parseTimeOnDate(rule.EndTime, date, loc)
	if err != nil {
		return nil
	}

	interval := time.Duration(rule.SlotIntervalMinutes) * time.Minute
	if interval <= 0 {
		interval = 30 * time.Minute
	}

	now := time.Now().UTC()
	var windows []openWindow
	for slotStart := workStart; slotStart.Add(duration).Before(workEnd) || slotStart.Add(duration).Equal(workEnd); slotStart = slotStart.Add(interval) {
		slotEnd := slotStart.Add(duration)

		if slotEnd.Before(now) {
			continue
		}
		if overlapsTimeOff(slotStart, slotEnd, timeOffs) {
			continue
		}
		if overlapsBooked(slotStart, slotEnd, booked) {
			continue
		}
		windows = append(windows, openWindow{startsAt: slotStart, endsAt: slotEnd})
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
		if start.Before(b.EndsAt) && end.After(b.StartsAt) {
			return true
		}
	}
	return false
}

// ── CreateAppointment ─────────────────────────────────────────────────────────

func (s *Service) CreateAppointment(ctx context.Context, req CreateAppointmentRequest) (*Appointment, *StaffMember, error) {
	if req.TenantID == uuid.Nil {
		return nil, nil, ErrTenantRequired
	}
	if req.CustomerID == uuid.Nil {
		return nil, nil, ErrCustomerRequired
	}
	if req.StaffUserID == uuid.Nil {
		// Auto-assign: find available staff for this specific slot.
		// We reuse SearchAvailability to respect all business rules (schedules, time-offs, overlaps).
		slots, _, err := s.SearchAvailability(ctx, SearchAvailabilityRequest{
			TenantID:   req.TenantID,
			ServiceIDs: req.ServiceIDs,
			Date:       req.StartsAt.Format("2006-01-02"),
		})
		if err != nil {
			return nil, nil, fmt.Errorf("auto-assign staff: %w", err)
		}

		for _, slot := range slots {
			if slot.StartsAt.Equal(req.StartsAt) {
				if len(slot.AvailableStaff) > 0 {
					// Pick the first available staff.
					// In the future, this could be randomized or load-balanced.
					req.StaffUserID = slot.AvailableStaff[0].ID
					break
				}
			}
		}

		if req.StaffUserID == uuid.Nil {
			return nil, nil, ErrSlotUnavailable
		}
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

	// Enforce weekly booking limit for customer-app bookings.
	if req.CreatedVia == CreatedViaCustomerApp {
		maxBookings, err := s.repo.GetMaxWeeklyCustomerBookings(ctx, req.TenantID)
		if err != nil {
			return nil, nil, fmt.Errorf("get weekly booking limit: %w", err)
		}
		if maxBookings > 0 {
			weekStart, weekEnd := isoWeekBounds(req.StartsAt)
			count, err := s.repo.CountCustomerAppointmentsInWeek(ctx, req.TenantID, req.CustomerID, weekStart, weekEnd)
			if err != nil {
				return nil, nil, fmt.Errorf("count weekly bookings: %w", err)
			}
			if count >= int64(maxBookings) {
				return nil, nil, ErrWeeklyBookingLimitReached
			}
		}
	}

	// Fetch all services and compute total duration.
	svcs := make([]*ServiceRecord, 0, len(req.ServiceIDs))
	var totalDuration time.Duration
	for _, svcID := range req.ServiceIDs {
		svc, err := s.repo.GetServiceByID(ctx, req.TenantID, svcID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, nil, fmt.Errorf("service %s not found", svcID)
			}
			return nil, nil, fmt.Errorf("get service: %w", err)
		}
		svcs = append(svcs, svc)
		totalDuration += time.Duration(svc.DurationMinutes) * time.Minute
	}

	appt := &Appointment{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		CustomerID:  req.CustomerID,
		StaffUserID: req.StaffUserID,
		StartsAt:    req.StartsAt.UTC(),
		EndsAt:      req.StartsAt.UTC().Add(totalDuration),
		Status:      StatusConfirmed,
		CreatedVia:  req.CreatedVia,
	}
	if req.NotesCustomer != "" {
		appt.NotesCustomer = &req.NotesCustomer
	}

	apptServices := make([]AppointmentService, 0, len(svcs))
	for _, svc := range svcs {
		apptSvc := AppointmentService{
			ID:                      uuid.New(),
			TenantID:                req.TenantID,
			AppointmentID:           appt.ID,
			ServiceNameSnapshot:     svc.Name,
			DurationMinutesSnapshot: svc.DurationMinutes,
			PriceSnapshot:           svc.BasePrice,
			PointsRewardSnapshot:    svc.PointsReward,
		}
		if svc.ID != uuid.Nil {
			apptSvc.ServiceID = &svc.ID
		}
		apptServices = append(apptServices, apptSvc)
	}

	if err := s.repo.RunInTx(ctx, func(ctx context.Context) error {
		if err := s.repo.CreateAppointment(ctx, appt); err != nil {
			if isOverlapErr(err) {
				return ErrSlotUnavailable
			}
			return fmt.Errorf("create appt: %w", err)
		}
		for _, as := range apptServices {
			if err := s.repo.CreateAppointmentService(ctx, &as); err != nil {
				return fmt.Errorf("create appt service: %w", err)
			}
		}
		if s.reminders != nil {
			if err := s.reminders.ScheduleAppointmentReminders(ctx, req.TenantID, appt.ID, req.CustomerID, appt.StartsAt); err != nil {
				return fmt.Errorf("schedule reminders: %w", err)
			}
		}
		return nil
	}); err != nil {
		return nil, nil, err
	}

	staff, _ := s.repo.GetStaffMember(ctx, req.TenantID, appt.StaffUserID)
	return appt, staff, nil
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

		newAppt = &Appointment{
			ID:                           uuid.New(),
			TenantID:                     req.TenantID,
			CustomerID:                   old.CustomerID,
			StaffUserID:                  newStaffID,
			StartsAt:                     req.NewStartsAt.UTC(),
			EndsAt:                       req.NewStartsAt.UTC().Add(old.Duration()),
			Status:                       StatusConfirmed,
			CreatedVia:                   old.CreatedVia,
			RescheduledFromAppointmentID: &old.ID,
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

// ── helpers ───────────────────────────────────────────────────────────────────

func staffMemberToOption(m *StaffMember) StaffOption {
	return StaffOption{
		ID:          m.ID,
		FirstName:   m.FirstName,
		LastName:    m.LastName,
		AvatarURL:   m.AvatarURL,
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
	recommendationDays  = 7 // scan today + 6 days ahead
	maxRecommendations  = 4
)

// GetSlotRecommendations returns 2-4 recommended time slots based on
// heuristics: earliest available, customer's preferred time/staff, and
// tenant-wide popularity.
func (s *Service) GetSlotRecommendations(ctx context.Context, req GetSlotRecommendationsRequest) ([]SlotRecommendation, error) {
	if req.TenantID == uuid.Nil {
		return nil, ErrTenantRequired
	}
	if len(req.ServiceIDs) == 0 {
		return nil, ErrServiceRequired
	}

	loc := s.loadTenantLocation(ctx, req.TenantID)
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	// Collect available slots across multiple days by reusing SearchAvailability.
	var allSlots []AvailableSlot
	for d := 0; d < recommendationDays; d++ {
		date := today.AddDate(0, 0, d)
		dateStr := date.Format("2006-01-02")
		slots, _, err := s.SearchAvailability(ctx, SearchAvailabilityRequest{
			TenantID:    req.TenantID,
			ServiceIDs:  req.ServiceIDs,
			Date:        dateStr,
			StaffUserID: req.StaffUserID,
		})
		if err != nil {
			return nil, fmt.Errorf("availability for %s: %w", dateStr, err)
		}
		allSlots = append(allSlots, slots...)
	}

	if len(allSlots) == 0 {
		return nil, nil
	}

	// Sort by start time.
	for i := 1; i < len(allSlots); i++ {
		for j := i; j > 0 && allSlots[j].StartsAt.Before(allSlots[j-1].StartsAt); j-- {
			allSlots[j], allSlots[j-1] = allSlots[j-1], allSlots[j]
		}
	}

	// Fetch tenant timezone string for pattern queries.
	tz, _ := s.repo.GetTenantTimezone(ctx, req.TenantID)
	if tz == "" {
		tz = "UTC"
	}

	var recs []SlotRecommendation
	usedStarts := make(map[time.Time]bool)

	addRec := func(slot AvailableSlot, label string) {
		if usedStarts[slot.StartsAt] {
			return
		}
		if len(recs) >= maxRecommendations {
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
	if req.CustomerID != uuid.Nil {
		pattern, err := s.repo.GetCustomerBookingPatterns(ctx, req.TenantID, req.CustomerID, tz)
		if err != nil {
			s.log.Warn("failed to fetch booking patterns", zap.Error(err))
		} else if pattern.TotalVisits >= 3 {
			// Preferred time: find a slot at the customer's most common hour.
			for _, slot := range allSlots {
				if slot.StartsAt.In(loc).Hour() == pattern.PreferredHour {
					addRec(slot, labelPreferredTime)
					break
				}
			}
		}

		if pattern != nil && pattern.StaffVisits >= 2 && pattern.PreferredStaff != uuid.Nil {
			// Preferred staff: find next slot where the preferred staff is available.
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
		popular, err := s.repo.GetTenantPopularHours(ctx, req.TenantID, tz)
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

	// If still under 2 recommendations, fill with next earliest slots.
	for i := 1; i < len(allSlots) && len(recs) < 2; i++ {
		addRec(allSlots[i], labelEarliest)
	}

	return recs, nil
}
