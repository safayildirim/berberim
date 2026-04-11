package appointment_test

import (
	"context"
	"testing"
	"time"

	"github.com/berberim/api/internal/appointment"
	"github.com/berberim/api/internal/appointment/mocks"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// testDate is a fixed far-future date so "past slot" filtering never fires.
// 2099-04-06 falls on a Monday (DayOfWeek = 1).
var (
	testDate      = time.Date(2099, 4, 6, 0, 0, 0, 0, time.UTC)
	testDateStr   = "2099-04-06"
	testDayOfWeek = int(testDate.Weekday())
)

// at returns a UTC time on testDate at the given hour and minute.
func at(h, m int) time.Time {
	return time.Date(2099, 4, 6, h, m, 0, 0, time.UTC)
}

// workRule builds a ScheduleRule for testDate's weekday.
func workRule(staffID uuid.UUID, startHHMM, endHHMM string) appointment.ScheduleRule {
	return appointment.ScheduleRule{
		ID:                  uuid.New(),
		StaffUserID:         staffID,
		DayOfWeek:           testDayOfWeek,
		StartTime:           startHHMM,
		EndTime:             endHHMM,
		SlotIntervalMinutes: 30,
		IsWorkingDay:        true,
	}
}

// service builds a mock with common default expectations applied after tc.setup.
func newService(t *testing.T, setup func(*mocks.MockRepoInterface)) *appointment.Service {
	t.Helper()
	repo := mocks.NewMockRepoInterface(t)
	setup(repo)
	repo.On("ListBookedSlots", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return([]appointment.BookedSlot{}, nil).Maybe()
	return appointment.NewService(repo, nil, zap.NewNop())
}

func TestSearchAvailability(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")
	staffA := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	staffB := uuid.MustParse("cccccccc-0000-0000-0000-000000000002")

	svc30min := &appointment.ServiceRecord{ID: svcID, DurationMinutes: 30}

	memberA := appointment.StaffMember{ID: staffA, FirstName: "Ahmet", LastName: "Yilmaz"}
	memberB := appointment.StaffMember{ID: staffB, FirstName: "Mehmet", LastName: "Kaya"}

	noTimeOffs := []appointment.TimeOff{}
	noBooked := []appointment.BookedSlot{}

	// Helper: set up GetTenantBookingConfig mock with UTC/no-buffer config.
	utcCfg := &appointment.TenantBookingConfig{Timezone: "UTC", SameDayBookingEnabled: true}
	withCfg := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(utcCfg, nil)
	}

	// Helper: set up empty breaks for any staff (default for SearchAvailability tests).
	withNoBreaks := func(r *mocks.MockRepoInterface) {
		r.On("ListScheduleBreaks", mock.Anything, mock.Anything, mock.Anything).Return([]appointment.ScheduleBreak{}, nil)
	}

	type testCase struct {
		name       string
		req        appointment.SearchAvailabilityRequest
		setup      func(*mocks.MockRepoInterface)
		wantErr    error
		wantErrMsg string // substring match when wantErr is nil but error expected
		wantSlots  int
		checkSlots func(t *testing.T, slots []appointment.AvailableSlot)
	}

	tests := []testCase{
		// ── Validation ───────────────────────────────────────────────────────────
		{
			name:    "missing tenant_id",
			req:     appointment.SearchAvailabilityRequest{ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup:   func(_ *mocks.MockRepoInterface) {},
			wantErr: appointment.ErrTenantRequired,
		},
		{
			name:    "missing service_ids",
			req:     appointment.SearchAvailabilityRequest{TenantID: tenantID, Date: testDateStr},
			setup:   func(_ *mocks.MockRepoInterface) {},
			wantErr: appointment.ErrServiceRequired,
		},
		{
			name:    "missing date",
			req:     appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}},
			setup:   func(_ *mocks.MockRepoInterface) {},
			wantErr: appointment.ErrDateRequired,
		},
		{
			name: "invalid date format",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: "06/04/2099"},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
			},
			wantErr: appointment.ErrInvalidDate,
		},

		// ── Service lookup ───────────────────────────────────────────────────────
		{
			name: "service not found returns error",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(nil, gorm.ErrRecordNotFound)
			},
			wantErrMsg: "not found",
		},

		// ── Staff resolution ─────────────────────────────────────────────────────
		{
			name: "no qualified staff returns empty slots",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{}, nil)
			},
			wantSlots: 0,
		},
		{
			name: "staff_user_id filter not in qualified list returns empty slots",
			req: appointment.SearchAvailabilityRequest{
				TenantID:    tenantID,
				ServiceIDs:  []uuid.UUID{svcID},
				Date:        testDateStr,
				StaffUserID: staffA,
			},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				// Only staffB qualifies — staffA cannot perform this service.
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberB}, nil)
			},
			wantSlots: 0,
		},

		// ── Schedule rules ───────────────────────────────────────────────────────
		{
			name: "staff has no working rule for the day returns empty slots",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{}, nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noBooked, nil)
			},
			wantSlots: 0,
		},

		// ── Slot computation ─────────────────────────────────────────────────────
		{
			name: "single staff 1h window with 30min service returns two slots",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "10:00")},
					nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noBooked, nil)
			},
			wantSlots: 2,
			checkSlots: func(t *testing.T, slots []appointment.AvailableSlot) {
				assert.Equal(t, at(9, 0), slots[0].StartsAt)
				assert.Equal(t, at(9, 30), slots[0].EndsAt)
				assert.Len(t, slots[0].AvailableStaff, 1)
				assert.Equal(t, staffA, slots[0].AvailableStaff[0].ID)

				assert.Equal(t, at(9, 30), slots[1].StartsAt)
				assert.Equal(t, at(10, 0), slots[1].EndsAt)
				assert.Len(t, slots[1].AvailableStaff, 1)
			},
		},
		{
			name: "two staff available at same time are merged into one slot",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA, memberB}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "09:30")},
					nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffB).Return([]appointment.ScheduleRule{workRule(staffB, "09:00", "09:30")},
					nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffB, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noBooked, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffB, mock.Anything, mock.Anything).Return(noBooked, nil)
			},
			wantSlots: 1,
			checkSlots: func(t *testing.T, slots []appointment.AvailableSlot) {
				assert.Equal(t, at(9, 0), slots[0].StartsAt)
				assert.Len(t, slots[0].AvailableStaff, 2, "both staff should appear in a single slot")
				staffIDs := []uuid.UUID{slots[0].AvailableStaff[0].ID, slots[0].AvailableStaff[1].ID}
				assert.ElementsMatch(t, []uuid.UUID{staffA, staffB}, staffIDs)
			},
		},
		{
			name: "two staff with different schedules produce separate slots",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA, memberB}, nil)
				// staffA: 09:00–09:30, staffB: 10:00–10:30
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "09:30")},
					nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffB).Return([]appointment.ScheduleRule{workRule(staffB, "10:00", "10:30")},
					nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffB, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noBooked, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffB, mock.Anything, mock.Anything).Return(noBooked, nil)
			},
			wantSlots: 2,
			checkSlots: func(t *testing.T, slots []appointment.AvailableSlot) {
				assert.Equal(t, at(9, 0), slots[0].StartsAt)
				assert.Equal(t, staffA, slots[0].AvailableStaff[0].ID)
				assert.Equal(t, at(10, 0), slots[1].StartsAt)
				assert.Equal(t, staffB, slots[1].AvailableStaff[0].ID)
			},
		},

		// ── Conflict filtering ───────────────────────────────────────────────────
		{
			name: "slot overlapping a booked appointment is skipped",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "10:00")},
					nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				// 09:00–09:30 is already booked.
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return([]appointment.BookedSlot{
					{StartsAt: at(9, 0), BlockedUntil: at(9, 30)},
				}, nil)
			},
			wantSlots: 1,
			checkSlots: func(t *testing.T, slots []appointment.AvailableSlot) {
				assert.Equal(t, at(9, 30), slots[0].StartsAt, "only the 09:30 slot should remain")
			},
		},
		{
			name: "slot overlapping a time-off is skipped",
			req:  appointment.SearchAvailabilityRequest{TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID}, Date: testDateStr},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "10:00")},
					nil)
				// 09:00–09:30 is a time-off.
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return([]appointment.TimeOff{
					{StartAt: at(9, 0), EndAt: at(9, 30)},
				}, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noBooked, nil)
			},
			wantSlots: 1,
			checkSlots: func(t *testing.T, slots []appointment.AvailableSlot) {
				assert.Equal(t, at(9, 30), slots[0].StartsAt, "only the 09:30 slot should remain")
			},
		},

		// ── StaffUserID filter ───────────────────────────────────────────────────
		{
			name: "staff_user_id filter restricts results to that staff only",
			req: appointment.SearchAvailabilityRequest{
				TenantID:    tenantID,
				ServiceIDs:  []uuid.UUID{svcID},
				Date:        testDateStr,
				StaffUserID: staffA,
			},
			setup: func(r *mocks.MockRepoInterface) {
				r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30min, nil)
				withCfg(r)
				withNoBreaks(r)
				// Both staff qualify, but only staffA should be returned.
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA, memberB}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "09:30")},
					nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noBooked, nil)
			},
			wantSlots: 1,
			checkSlots: func(t *testing.T, slots []appointment.AvailableSlot) {
				assert.Len(t, slots[0].AvailableStaff, 1)
				assert.Equal(t, staffA, slots[0].AvailableStaff[0].ID)
				assert.Equal(t, "Ahmet", slots[0].AvailableStaff[0].FirstName)
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			svc := newService(t, tc.setup)

			slots, _, err := svc.SearchAvailability(context.Background(), tc.req)

			if tc.wantErr != nil {
				require.ErrorIs(t, err, tc.wantErr)
				return
			}
			if tc.wantErrMsg != "" {
				require.Error(t, err)
				assert.ErrorContains(t, err, tc.wantErrMsg)
				return
			}

			require.NoError(t, err)
			assert.Len(t, slots, tc.wantSlots)
			if tc.checkSlots != nil {
				tc.checkSlots(t, slots)
			}
		})
	}
}

func TestCreateAppointment_WeeklyLimit(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	customerID := uuid.MustParse("dddddddd-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")

	baseReq := appointment.CreateAppointmentRequest{
		TenantID:    tenantID,
		CustomerID:  customerID,
		StaffUserID: staffID,
		ServiceIDs:  []uuid.UUID{svcID},
		StartsAt:    at(10, 0), // Monday 2099-04-06 10:00 UTC
		CreatedVia:  appointment.CreatedViaCustomerApp,
	}

	svc30 := &appointment.ServiceRecord{
		ID: svcID, Name: "Haircut", DurationMinutes: 30, BasePrice: "50.00",
	}

	// weekStart for 2099-04-06 (Monday) should be 2099-04-06T00:00:00Z
	weekStart := time.Date(2099, 4, 6, 0, 0, 0, 0, time.UTC)
	weekEnd := time.Date(2099, 4, 13, 0, 0, 0, 0, time.UTC)

	defaultCfg := &appointment.TenantBookingConfig{
		Timezone:              "UTC",
		BufferMinutes:         0,
		SameDayBookingEnabled: true,
		MinAdvanceMinutes:     0,
		MaxAdvanceDays:        0, // 0 = disabled (test dates are far-future)
		MaxWeeklyBookings:     2,
	}

	// setupFullCreate sets up all mocks needed for a successful appointment creation
	// past the weekly limit check.
	setupFullCreate := func(r *mocks.MockRepoInterface, count int64, cfg *appointment.TenantBookingConfig) {
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(cfg, nil)
		if cfg.MaxWeeklyBookings > 0 {
			r.On("CountCustomerAppointmentsInWeek", mock.Anything, tenantID, customerID, weekStart, weekEnd).Return(count, nil)
		}
		r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
		r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
			fn := args.Get(1).(func(context.Context) error)
			_ = fn(context.Background())
		}).Return(nil)
		r.On("AcquireStaffScheduleLock", mock.Anything, staffID).Return(nil)
		r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{{ID: staffID}}, nil)
		r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
		r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
		r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, mock.Anything).Return([]appointment.ScheduleBreak{}, nil)
		r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
		r.On("GetStaffCustomPrice", mock.Anything, staffID, svcID).Return("", nil)
		r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
		r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
	}

	// setupCreateNoLimit sets up mocks for non-customer-app bookings (no weekly limit check).
	setupCreateNoLimit := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(defaultCfg, nil)
		r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
		r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
			fn := args.Get(1).(func(context.Context) error)
			_ = fn(context.Background())
		}).Return(nil)
		r.On("AcquireStaffScheduleLock", mock.Anything, staffID).Return(nil)
		r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{{ID: staffID}}, nil)
		r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
		r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
		r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, mock.Anything).Return([]appointment.ScheduleBreak{}, nil)
		r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
		r.On("GetStaffCustomPrice", mock.Anything, staffID, svcID).Return("", nil)
		r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
		r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
	}

	t.Run("customer with 0 bookings succeeds", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupFullCreate(r, 0, defaultCfg)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("customer with 1 booking succeeds", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupFullCreate(r, 1, defaultCfg)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("customer with 2 bookings blocked", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(defaultCfg, nil)
			r.On("CountCustomerAppointmentsInWeek", mock.Anything, tenantID, customerID, weekStart, weekEnd).Return(int64(2), nil)
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrWeeklyBookingLimitReached)
	})

	t.Run("admin booking bypasses limit", func(t *testing.T) {
		req := baseReq
		req.CreatedVia = appointment.CreatedViaAdminPanel
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupCreateNoLimit(r)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("walk-in booking bypasses limit", func(t *testing.T) {
		req := baseReq
		req.CreatedVia = appointment.CreatedViaWalkIn
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupCreateNoLimit(r)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("limit 0 disables restriction", func(t *testing.T) {
		noLimitCfg := &appointment.TenantBookingConfig{
			Timezone:              "UTC",
			BufferMinutes:         0,
			SameDayBookingEnabled: true,
			MinAdvanceMinutes:     0,
			MaxAdvanceDays:        0,
			MaxWeeklyBookings:     0,
		}
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupFullCreate(r, 0, noLimitCfg)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})
}

func TestCreateAppointment_ExplicitStaffPlacementValidation(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	customerID := uuid.MustParse("dddddddd-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	otherStaffID := uuid.MustParse("cccccccc-0000-0000-0000-000000000002")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")

	baseReq := appointment.CreateAppointmentRequest{
		TenantID:    tenantID,
		CustomerID:  customerID,
		StaffUserID: staffID,
		ServiceIDs:  []uuid.UUID{svcID},
		StartsAt:    at(10, 0),
		CreatedVia:  appointment.CreatedViaCustomerApp,
	}
	cfg := &appointment.TenantBookingConfig{
		Timezone:              "UTC",
		SameDayBookingEnabled: true,
	}
	svc30 := &appointment.ServiceRecord{
		ID: svcID, Name: "Haircut", DurationMinutes: 30, BasePrice: "50.00",
	}

	setupUntilPlacement := func(r *mocks.MockRepoInterface, req appointment.CreateAppointmentRequest) {
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(cfg, nil)
		r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
		r.On("GetStaffCustomPrice", mock.Anything, staffID, svcID).Return("", nil)
		r.On("RunInTx", mock.Anything, mock.Anything).Return(func(_ context.Context, fn func(context.Context) error) error {
			return fn(context.Background())
		})
		r.On("AcquireStaffScheduleLock", mock.Anything, req.StaffUserID).Return(nil)
		r.On("GetStaffMember", mock.Anything, tenantID, req.StaffUserID).Return(&appointment.StaffMember{
			ID:     req.StaffUserID,
			Status: "active",
		}, nil)
	}

	t.Run("rejects staff that cannot perform all selected services", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupUntilPlacement(r, baseReq)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{
				{ID: otherStaffID, Status: "active"},
			}, nil)
		})

		_, _, err := svc.CreateAppointment(context.Background(), baseReq)

		require.ErrorIs(t, err, appointment.ErrStaffUnavailableForService)
	})

	t.Run("rejects appointment outside staff working hours", func(t *testing.T) {
		req := baseReq
		req.StartsAt = at(18, 0)
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupUntilPlacement(r, req)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{
				{ID: staffID, Status: "active"},
			}, nil)
			r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{
				workRule(staffID, "09:00", "18:00"),
			}, nil)
		})

		_, _, err := svc.CreateAppointment(context.Background(), req)

		require.ErrorIs(t, err, appointment.ErrOutsideWorkingHours)
	})

	t.Run("rejects booked overlap using blocked_until", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupUntilPlacement(r, baseReq)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{
				{ID: staffID, Status: "active"},
			}, nil)
			r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{
				workRule(staffID, "09:00", "18:00"),
			}, nil)
			r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
			r.On("ListBookedSlots", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.BookedSlot{
				{ID: uuid.New(), StartsAt: at(9, 30), BlockedUntil: at(10, 15)},
			}, nil)
		})

		_, _, err := svc.CreateAppointment(context.Background(), baseReq)

		require.ErrorIs(t, err, appointment.ErrSlotUnavailable)
	})
}

// ── Pure-function availability engine tests ───────────────────────────────────
//
// These tests call computeOpenWindows / overlapsBreaks directly via the
// exported test helpers in export_test.go — no mocks required.

func TestComputeOpenWindows_Breaks(t *testing.T) {
	staffA := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	date := testDate
	loc := time.UTC
	svc30 := 30 * time.Minute
	noTimeOffs := []appointment.TimeOff{}
	noBooked := []appointment.BookedSlot{}

	mkBreak := func(start, end string) appointment.ScheduleBreak {
		return appointment.ScheduleBreak{DayOfWeek: testDayOfWeek, StartTime: start, EndTime: end}
	}
	oneBreak := func(start, end string) []appointment.ScheduleBreak {
		return []appointment.ScheduleBreak{mkBreak(start, end)}
	}

	slotStarts := func(windows []appointment.TestWindow) map[time.Time]bool {
		m := make(map[time.Time]bool, len(windows))
		for _, w := range windows {
			m[w.StartsAt] = true
		}
		return m
	}

	tests := []struct {
		name              string
		serviceDuration   time.Duration
		effectiveDuration time.Duration
		breaks            []appointment.ScheduleBreak
		booked            []appointment.BookedSlot
		rule              appointment.ScheduleRule
		wantOpen          []time.Time // these slots MUST appear
		wantBlocked       []time.Time // these slots must NOT appear
	}{
		{
			name:              "no breaks — full 1h window produces two 30-min slots",
			serviceDuration:   svc30,
			effectiveDuration: svc30,
			breaks:            nil,
			rule:              workRule(staffA, "09:00", "10:00"),
			wantOpen:          []time.Time{at(9, 0), at(9, 30)},
		},
		{
			// [12:30, 13:00) vs break [13:00, 14:00): slot end == break start → no overlap.
			name:              "slot ending exactly at break start IS available (half-open interval)",
			serviceDuration:   svc30,
			effectiveDuration: svc30,
			breaks:            oneBreak("13:00", "14:00"),
			rule:              workRule(staffA, "09:00", "18:00"),
			wantOpen:          []time.Time{at(12, 30)},
			wantBlocked:       []time.Time{at(13, 0)},
		},
		{
			// [10:30, 11:00) vs break [10:00, 10:30): slot start == break end → no overlap.
			name:              "slot starting exactly at break end IS available (half-open interval)",
			serviceDuration:   svc30,
			effectiveDuration: svc30,
			breaks:            oneBreak("10:00", "10:30"),
			rule:              workRule(staffA, "09:00", "18:00"),
			wantOpen:          []time.Time{at(10, 30)},
			wantBlocked:       []time.Time{at(10, 0)},
		},
		{
			// Slot 12:30–13:00 (serviceEnd=13:00) does NOT overlap break [13:00, 14:00).
			// effectiveDuration extends to 13:10 (buffer) but break check uses serviceEnd only.
			// If break check wrongly used effectiveDuration, 12:30 would be blocked.
			name:              "break check uses serviceDuration not effectiveDuration (buffer invariant)",
			serviceDuration:   svc30,
			effectiveDuration: 40 * time.Minute, // 10-min buffer
			breaks:            oneBreak("13:00", "14:00"),
			rule:              workRule(staffA, "09:00", "18:00"),
			wantOpen:          []time.Time{at(12, 30)}, // service ends at 13:00, no overlap
			wantBlocked:       []time.Time{at(13, 0)},  // service ends at 13:30, overlaps break
		},
		{
			name:            "multiple breaks same day block correct windows",
			serviceDuration: svc30, effectiveDuration: svc30,
			breaks: []appointment.ScheduleBreak{
				mkBreak("10:30", "10:45"),
				mkBreak("13:00", "14:00"),
			},
			rule: workRule(staffA, "09:00", "18:00"),
			wantOpen: []time.Time{
				at(10, 0),  // 10:00–10:30 ends at break1 start → available
				at(11, 0),  // after break1
				at(12, 30), // 12:30–13:00 ends at break2 start → available
				at(14, 0),  // after break2
			},
			wantBlocked: []time.Time{
				at(10, 30), // overlaps break1 [10:30, 10:45)
				at(13, 0),  // overlaps break2 [13:00, 14:00)
				at(13, 30), // still inside break2
			},
		},
		{
			// Breaks [10:00, 10:30) and [10:30, 11:00) are adjacent (no overlap with each other).
			// 10:00 slot: service ends 10:30, overlaps break1.
			// 10:30 slot: service ends 11:00, start==break2.start → overlaps break2.
			name:            "adjacent breaks block both slots, adjacent boundary slot available",
			serviceDuration: svc30, effectiveDuration: svc30,
			breaks: []appointment.ScheduleBreak{
				mkBreak("10:00", "10:30"),
				mkBreak("10:30", "11:00"),
			},
			rule:        workRule(staffA, "09:00", "18:00"),
			wantOpen:    []time.Time{at(9, 30), at(11, 0)},
			wantBlocked: []time.Time{at(10, 0), at(10, 30)},
		},
		{
			// Break at 17:30–18:00 is outside working hours 09:00–17:00.
			// Slots at 16:00 and 16:30 should remain available.
			name:            "break outside working hours has no effect on available slots",
			serviceDuration: svc30, effectiveDuration: svc30,
			breaks: oneBreak("17:30", "18:00"),
			rule:   workRule(staffA, "09:00", "17:00"),
			wantOpen: []time.Time{
				at(16, 0),  // 16:00–16:30, inside working hours, before "phantom" break
				at(16, 30), // 16:30–17:00
			},
		},
		{
			// A previous appointment was booked with a 10-min buffer, so BlockedUntil=09:40.
			// effectiveDuration in this call is also 40 min (matching the buffer convention).
			// Slot 09:30: slotEnd = 09:30+40min = 10:10; overlapsBooked(09:30, 10:10, [{09:00, 09:40}]) → true.
			// Slot 10:00: slotEnd = 10:00+40min = 10:40; overlapsBooked(10:00, 10:40, [{09:00, 09:40}]) → false.
			name:              "booked slot's BlockedUntil (with buffer) blocks the adjacent slot",
			serviceDuration:   svc30,
			effectiveDuration: 40 * time.Minute,
			breaks:            nil,
			booked: []appointment.BookedSlot{
				{StartsAt: at(9, 0), BlockedUntil: at(9, 40)}, // 30-min service + 10-min buffer
			},
			rule:        workRule(staffA, "09:00", "11:00"),
			wantOpen:    []time.Time{at(10, 0)},
			wantBlocked: []time.Time{at(9, 0), at(9, 30)},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rules := []appointment.ScheduleRule{tc.rule}
			booked := tc.booked
			if booked == nil {
				booked = noBooked
			}
			windows := appointment.ComputeOpenWindowsForTest(
				tc.serviceDuration, tc.effectiveDuration,
				rules, noTimeOffs, booked, tc.breaks,
				date, loc,
			)
			starts := slotStarts(windows)
			for _, want := range tc.wantOpen {
				assert.Truef(t, starts[want], "slot at %s should be available", want.Format("15:04"))
			}
			for _, notWant := range tc.wantBlocked {
				assert.Falsef(t, starts[notWant], "slot at %s should NOT be available", notWant.Format("15:04"))
			}
		})
	}
}

func TestComputeBlockedWindows_BreaksAppearAsBlocked(t *testing.T) {
	staffA := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	date := testDate
	loc := time.UTC
	svc30 := 30 * time.Minute
	noTimeOffs := []appointment.TimeOff{}
	noBooked := []appointment.BookedSlot{}

	breaks := []appointment.ScheduleBreak{
		{DayOfWeek: testDayOfWeek, StartTime: "13:00", EndTime: "14:00"},
	}
	rules := []appointment.ScheduleRule{workRule(staffA, "09:00", "18:00")}

	blocked := appointment.ComputeBlockedWindowsForTest(svc30, svc30, rules, noTimeOffs, noBooked, breaks, date, loc)

	blockedStarts := make(map[time.Time]bool)
	for _, w := range blocked {
		blockedStarts[w.StartsAt] = true
	}

	// Slot 13:00 (serviceEnd=13:30) overlaps break → should appear as blocked.
	assert.True(t, blockedStarts[at(13, 0)], "13:00 slot should appear in blocked windows")
	// Slot 12:30 (serviceEnd=13:00) ends exactly at break start → NOT blocked.
	assert.False(t, blockedStarts[at(12, 30)], "12:30 slot should NOT appear in blocked windows")
}

func TestOverlapsBreaks(t *testing.T) {
	date := testDate
	loc := time.UTC

	mkBreak := func(start, end string) appointment.ScheduleBreak {
		return appointment.ScheduleBreak{DayOfWeek: testDayOfWeek, StartTime: start, EndTime: end}
	}

	tests := []struct {
		name   string
		start  time.Time
		end    time.Time
		breaks []appointment.ScheduleBreak
		want   bool
	}{
		{
			name:  "empty breaks list returns false",
			start: at(10, 0), end: at(10, 30),
			breaks: nil,
			want:   false,
		},
		{
			name:  "slot entirely before break",
			start: at(9, 0), end: at(9, 30),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   false,
		},
		{
			name:  "slot entirely after break",
			start: at(11, 0), end: at(11, 30),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   false,
		},
		{
			// Half-open: slot [09:30, 10:00) vs break [10:00, 10:30) → 10:00 not after 10:00.
			name:  "slot ends exactly at break start — NOT overlapping (half-open)",
			start: at(9, 30), end: at(10, 0),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   false,
		},
		{
			// Half-open: slot [10:30, 11:00) vs break [10:00, 10:30) → 10:30 not before 10:30.
			name:  "slot starts exactly at break end — NOT overlapping (half-open)",
			start: at(10, 30), end: at(11, 0),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   false,
		},
		{
			name:  "slot exactly matches break boundaries",
			start: at(10, 0), end: at(10, 30),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   true,
		},
		{
			name:  "slot partially overlaps break from left",
			start: at(9, 45), end: at(10, 15),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   true,
		},
		{
			name:  "slot partially overlaps break from right",
			start: at(10, 15), end: at(10, 45),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   true,
		},
		{
			name:  "slot spans entire break (break contained within slot)",
			start: at(9, 30), end: at(11, 0),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   true,
		},
		{
			name:  "slot contained within break",
			start: at(10, 5), end: at(10, 25),
			breaks: []appointment.ScheduleBreak{mkBreak("10:00", "10:30")},
			want:   true,
		},
		{
			name:  "slot between two non-overlapping breaks — no conflict",
			start: at(11, 0), end: at(11, 30),
			breaks: []appointment.ScheduleBreak{
				mkBreak("10:00", "10:30"),
				mkBreak("13:00", "14:00"),
			},
			want: false,
		},
		{
			name:  "slot overlaps second of two breaks",
			start: at(13, 0), end: at(13, 30),
			breaks: []appointment.ScheduleBreak{
				mkBreak("10:30", "10:45"),
				mkBreak("13:00", "14:00"),
			},
			want: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := appointment.OverlapsBreaksForTest(tc.start, tc.end, tc.breaks, date, loc)
			assert.Equal(t, tc.want, got)
		})
	}
}

// ── CreateAppointment break conflict tests ────────────────────────────────────

func TestCreateAppointment_BreakConflicts(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	customerID := uuid.MustParse("dddddddd-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")

	// Appointment at 10:00 UTC (Monday), service=30min → EndsAt=10:30.
	baseReq := appointment.CreateAppointmentRequest{
		TenantID:    tenantID,
		CustomerID:  customerID,
		StaffUserID: staffID,
		ServiceIDs:  []uuid.UUID{svcID},
		StartsAt:    at(10, 0),
		CreatedVia:  appointment.CreatedViaCustomerApp,
	}
	svc30 := &appointment.ServiceRecord{ID: svcID, Name: "Haircut", DurationMinutes: 30, BasePrice: "50.00"}

	noLimitCfg := &appointment.TenantBookingConfig{
		Timezone: "UTC", SameDayBookingEnabled: true, MaxAdvanceDays: 0, MaxWeeklyBookings: 0,
	}

	// txPropagates makes RunInTx call the inner function and return its error —
	// this is the correct transaction behaviour (as opposed to the always-nil mock
	// used by success-path tests).
	txPropagates := func(r *mocks.MockRepoInterface) {
		r.EXPECT().RunInTx(mock.Anything, mock.Anything).RunAndReturn(
			func(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) },
		)
	}
	// preTx sets up mocks called before RunInTx.
	preTx := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noLimitCfg, nil)
		r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
		r.On("GetStaffCustomPrice", mock.Anything, staffID, svcID).Return("", nil)
		r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{{ID: staffID}}, nil)
		r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
	}
	// lockAndTimeOff sets up lock + empty time-off mocks inside the transaction.
	lockAndTimeOff := func(r *mocks.MockRepoInterface) {
		r.On("AcquireStaffScheduleLock", mock.Anything, staffID).Return(nil)
		r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
	}

	t.Run("appointment overlapping a break is rejected with ErrSlotUnavailable", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			preTx(r)
			txPropagates(r)
			lockAndTimeOff(r)
			// Break 10:00–11:00 overlaps appointment [10:00, 10:30).
			r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, testDayOfWeek).Return(
				[]appointment.ScheduleBreak{{DayOfWeek: testDayOfWeek, StartTime: "10:00", EndTime: "11:00"}}, nil)
			// CreateAppointment must NOT be called; absence of mock ensures panic if it is.
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrSlotUnavailable)
	})

	t.Run("appointment ending exactly at break start is allowed (half-open boundary)", func(t *testing.T) {
		// StartsAt=09:30, EndsAt=10:00 — ends exactly when break starts.
		req := baseReq
		req.StartsAt = at(9, 30)

		svc := newService(t, func(r *mocks.MockRepoInterface) {
			preTx(r)
			txPropagates(r)
			lockAndTimeOff(r)
			// Break at [10:00, 11:00): overlapsBreaks(09:30, 10:00, ...) → false → allowed.
			r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, testDayOfWeek).Return(
				[]appointment.ScheduleBreak{{DayOfWeek: testDayOfWeek, StartTime: "10:00", EndTime: "11:00"}}, nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("break check uses EndsAt not BlockedUntil — buffer does not block a clean boundary", func(t *testing.T) {
		// StartsAt=12:30, EndsAt=13:00, buffer=10min → BlockedUntil=13:10.
		// Break at [13:00, 14:00): break check uses EndsAt=13:00, not BlockedUntil=13:10.
		// overlapsBreaks(12:30, 13:00, [break{13:00, 14:00}]) → false → allowed.
		req := baseReq
		req.StartsAt = at(12, 30)

		cfgWithBuffer := &appointment.TenantBookingConfig{
			Timezone: "UTC", BufferMinutes: 10, SameDayBookingEnabled: true, MaxAdvanceDays: 0,
		}
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(cfgWithBuffer, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("GetStaffCustomPrice", mock.Anything, staffID, svcID).Return("", nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{{ID: staffID}}, nil)
			r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
			txPropagates(r)
			lockAndTimeOff(r)
			r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, testDayOfWeek).Return(
				[]appointment.ScheduleBreak{{DayOfWeek: testDayOfWeek, StartTime: "13:00", EndTime: "14:00"}}, nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err, "buffer overlapping break start must not block the appointment itself")
		assert.NotNil(t, appt)
	})

	t.Run("no breaks — proceeds to CreateAppointment normally", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			preTx(r)
			txPropagates(r)
			lockAndTimeOff(r)
			r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, testDayOfWeek).Return([]appointment.ScheduleBreak{}, nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})
}

// ── RescheduleAppointment break conflict tests ────────────────────────────────

func TestRescheduleAppointment_BreakConflicts(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	customerID := uuid.MustParse("dddddddd-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	apptID := uuid.MustParse("eeeeeeee-0000-0000-0000-000000000001")

	// Original appointment: Monday 09:00–09:30.
	existingAppt := &appointment.Appointment{
		ID:           apptID,
		TenantID:     tenantID,
		CustomerID:   customerID,
		StaffUserID:  staffID,
		StartsAt:     at(9, 0).UTC(),
		EndsAt:       at(9, 30).UTC(),
		BlockedUntil: at(9, 30).UTC(),
		Status:       appointment.StatusConfirmed,
		CreatedVia:   appointment.CreatedViaCustomerApp,
	}
	defaultCfg := &appointment.TenantBookingConfig{Timezone: "UTC", BufferMinutes: 0}

	// txPropagates makes RunInTx propagate the inner function's error.
	txPropagates := func(r *mocks.MockRepoInterface) {
		r.EXPECT().RunInTx(mock.Anything, mock.Anything).RunAndReturn(
			func(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) },
		)
	}
	// commonInTx sets up the fixed calls inside RescheduleAppointment's transaction.
	commonInTx := func(r *mocks.MockRepoInterface) {
		r.On("GetAppointmentForUpdate", mock.Anything, tenantID, apptID).Return(existingAppt, nil)
		r.On("ListAppointmentServices", mock.Anything, apptID).Return([]appointment.AppointmentService{}, nil)
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(defaultCfg, nil)
		r.On("AcquireStaffScheduleLock", mock.Anything, staffID).Return(nil)
		r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
		r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
	}

	t.Run("reschedule to time overlapping a break is rejected", func(t *testing.T) {
		// New slot: 10:00–10:30 (30-min duration from existingAppt.Duration()).
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			txPropagates(r)
			commonInTx(r)
			// Break 10:00–11:00 overlaps the new [10:00, 10:30) window.
			r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, testDayOfWeek).Return(
				[]appointment.ScheduleBreak{{DayOfWeek: testDayOfWeek, StartTime: "10:00", EndTime: "11:00"}}, nil)
			// UpdateAppointmentStatus and CreateAppointment must NOT be called.
		})
		_, err := svc.RescheduleAppointment(context.Background(), appointment.RescheduleAppointmentRequest{
			TenantID:      tenantID,
			AppointmentID: apptID,
			NewStartsAt:   at(10, 0),
		})
		require.ErrorIs(t, err, appointment.ErrSlotUnavailable)
	})

	t.Run("reschedule ending exactly at break start is allowed (half-open boundary)", func(t *testing.T) {
		// New slot: 09:30–10:00 (same duration); break starts at 10:00 → no overlap.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			txPropagates(r)
			commonInTx(r)
			r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, testDayOfWeek).Return(
				[]appointment.ScheduleBreak{{DayOfWeek: testDayOfWeek, StartTime: "10:00", EndTime: "11:00"}}, nil)
			// Reschedule proceeds: mark old as rescheduled, insert new.
			r.On("UpdateAppointmentStatus", mock.Anything, tenantID, apptID, appointment.StatusRescheduled, mock.Anything).Return(nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
		})
		newAppt, err := svc.RescheduleAppointment(context.Background(), appointment.RescheduleAppointmentRequest{
			TenantID:      tenantID,
			AppointmentID: apptID,
			NewStartsAt:   at(9, 30),
		})
		require.NoError(t, err)
		assert.NotNil(t, newAppt)
	})
}

// ── Idempotency tests ─────────────────────────────────────────────────────────

func TestCreateAppointment_Idempotency(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	customerID := uuid.MustParse("dddddddd-0000-0000-0000-000000000001")
	staffID := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")
	idempKey := "idem-key-abc-123"

	baseReq := appointment.CreateAppointmentRequest{
		TenantID:       tenantID,
		CustomerID:     customerID,
		StaffUserID:    staffID,
		ServiceIDs:     []uuid.UUID{svcID},
		StartsAt:       at(10, 0),
		CreatedVia:     appointment.CreatedViaCustomerApp,
		IdempotencyKey: idempKey,
	}
	existingAppt := &appointment.Appointment{
		ID:          uuid.MustParse("ffffffff-0000-0000-0000-000000000001"),
		TenantID:    tenantID,
		CustomerID:  customerID,
		StaffUserID: staffID,
		StartsAt:    at(10, 0).UTC(),
		Status:      appointment.StatusConfirmed,
	}

	noLimitCfg := &appointment.TenantBookingConfig{
		Timezone: "UTC", SameDayBookingEnabled: true, MaxAdvanceDays: 0, MaxWeeklyBookings: 0,
	}
	svc30 := &appointment.ServiceRecord{ID: svcID, DurationMinutes: 30, BasePrice: "50.00"}

	// successPath sets up all mocks needed for a full successful booking.
	successPath := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noLimitCfg, nil)
		r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
		r.On("GetStaffCustomPrice", mock.Anything, staffID, svcID).Return("", nil)
		r.EXPECT().RunInTx(mock.Anything, mock.Anything).RunAndReturn(
			func(ctx context.Context, fn func(context.Context) error) error { return fn(ctx) })
		r.On("AcquireStaffScheduleLock", mock.Anything, staffID).Return(nil)
		r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{{ID: staffID}}, nil)
		r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return([]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
		r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
		r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, mock.Anything).Return([]appointment.ScheduleBreak{}, nil)
		r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
		r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
		r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
	}

	t.Run("replay with matching payload short-circuits and returns existing appointment", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetAppointmentByIdempotencyKey", mock.Anything, tenantID, idempKey).Return(existingAppt, nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
			// No GetTenantBookingConfig, no RunInTx — should short-circuit after idempotency check.
		})
		appt, staff, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		require.NotNil(t, appt)
		assert.Equal(t, existingAppt.ID, appt.ID, "should return the pre-existing appointment")
		assert.NotNil(t, staff)
	})

	t.Run("idempotency conflict — key exists for a different customer", func(t *testing.T) {
		conflictAppt := *existingAppt
		conflictAppt.CustomerID = uuid.New() // different customer
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetAppointmentByIdempotencyKey", mock.Anything, tenantID, idempKey).Return(&conflictAppt, nil)
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrIdempotencyConflict)
	})

	t.Run("idempotency conflict — key exists for a different starts_at", func(t *testing.T) {
		conflictAppt := *existingAppt
		conflictAppt.StartsAt = at(11, 0).UTC() // different time
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetAppointmentByIdempotencyKey", mock.Anything, tenantID, idempKey).Return(&conflictAppt, nil)
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrIdempotencyConflict)
	})

	t.Run("no idempotency key — skips idempotency check entirely", func(t *testing.T) {
		req := baseReq
		req.IdempotencyKey = ""
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			// GetAppointmentByIdempotencyKey must NOT be called.
			successPath(r)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("key not found — proceeds as a new booking", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetAppointmentByIdempotencyKey", mock.Anything, tenantID, idempKey).Return(nil, gorm.ErrRecordNotFound)
			successPath(r)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})
}

// ── Auto-assignment tests ─────────────────────────────────────────────────────

func TestCreateAppointment_AutoAssign(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	customerID := uuid.MustParse("dddddddd-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")
	staffA := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	staffB := uuid.MustParse("cccccccc-0000-0000-0000-000000000002")
	staffC := uuid.MustParse("cccccccc-0000-0000-0000-000000000003")

	// StaffUserID intentionally zero → triggers auto-assignment.
	// CreatedViaAdminPanel skips the weekly booking limit check.
	baseReq := appointment.CreateAppointmentRequest{
		TenantID:   tenantID,
		CustomerID: customerID,
		ServiceIDs: []uuid.UUID{svcID},
		StartsAt:   at(10, 0),
		CreatedVia: appointment.CreatedViaAdminPanel,
	}
	svc30 := &appointment.ServiceRecord{ID: svcID, DurationMinutes: 30, BasePrice: "50.00"}
	noLimitCfg := &appointment.TenantBookingConfig{
		Timezone: "UTC", SameDayBookingEnabled: true, MaxAdvanceDays: 0, MaxWeeklyBookings: 0,
	}

	// freeStaff sets up the rankCandidates availability checks for one staff member.
	// ListTimeOffs and ListScheduleBreaksByDay are also called inside createWithStaff,
	// so setting them without .Once() lets both calls match the same mock.
	freeStaff := func(r *mocks.MockRepoInterface, staffID uuid.UUID) {
		r.On("ListTimeOffs", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.TimeOff{}, nil)
		r.On("ListBookedSlots", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return([]appointment.BookedSlot{}, nil)
		r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffID).Return(
			[]appointment.ScheduleRule{workRule(staffID, "09:00", "18:00")}, nil)
		r.On("ListScheduleBreaksByDay", mock.Anything, tenantID, staffID, mock.Anything).Return([]appointment.ScheduleBreak{}, nil)
		r.On("CountStaffAppointmentsToday", mock.Anything, tenantID, staffID, mock.Anything, mock.Anything).Return(int64(0), nil)
	}
	// noPreferredStaff stubs the preferred-staff lookup so it returns no preference.
	// rankCandidates calls these when at least one free candidate exists.
	noPreferredStaff := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantTimezone", mock.Anything, tenantID).Return("UTC", nil)
		r.On("GetCustomerBookingPatterns", mock.Anything, tenantID, customerID, "UTC").
			Return(&appointment.BookingPattern{StaffVisits: 0}, nil)
	}

	t.Run("no qualified staff — returns ErrSlotUnavailable immediately", func(t *testing.T) {
		// ListStaffByServices returns empty → rankCandidates returns nil immediately,
		// before reaching the GetTenantTimezone / GetCustomerBookingPatterns calls.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noLimitCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{}, nil)
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrSlotUnavailable)
	})

	t.Run("all 3 candidates conflict (DB race) — returns ErrSlotUnavailable after max retries", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noLimitCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return(
				[]appointment.StaffMember{{ID: staffA}, {ID: staffB}, {ID: staffC}}, nil)
			freeStaff(r, staffA)
			freeStaff(r, staffB)
			freeStaff(r, staffC)
			noPreferredStaff(r)
			// GetStaffCustomPrice is called before RunInTx for each candidate attempt.
			r.On("GetStaffCustomPrice", mock.Anything, mock.Anything, svcID).Return("", nil)
			// Every RunInTx returns ErrSlotUnavailable (simulates DB exclusion constraint).
			r.On("RunInTx", mock.Anything, mock.Anything).Return(appointment.ErrSlotUnavailable)
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrSlotUnavailable)
	})

	t.Run("single free candidate — appointment created successfully", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noLimitCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return(
				[]appointment.StaffMember{{ID: staffA}}, nil)
			freeStaff(r, staffA)
			noPreferredStaff(r)
			r.On("GetStaffCustomPrice", mock.Anything, staffA, svcID).Return("", nil)
			// RunInTx executes fn and returns nil (successful path).
			r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
				fn := args.Get(1).(func(context.Context) error)
				_ = fn(context.Background())
			}).Return(nil)
			r.On("AcquireStaffScheduleLock", mock.Anything, staffA).Return(nil)
			// ListTimeOffs and ListScheduleBreaksByDay are already registered via freeStaff;
			// the same mocks fire again for the in-transaction checks.
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffA).Return(&appointment.StaffMember{ID: staffA}, nil)
		})
		appt, staff, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
		assert.NotNil(t, staff)
	})
}

// ── Buffer / BlockedUntil tests via SearchAvailability ────────────────────────

func TestSearchAvailability_Buffer(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")
	staffA := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")

	svc30 := &appointment.ServiceRecord{ID: svcID, DurationMinutes: 30}
	member := appointment.StaffMember{ID: staffA}
	noTimeOffs := []appointment.TimeOff{}

	req := appointment.SearchAvailabilityRequest{
		TenantID:   tenantID,
		ServiceIDs: []uuid.UUID{svcID},
		Date:       testDateStr,
	}

	noBufCfg := &appointment.TenantBookingConfig{Timezone: "UTC", SameDayBookingEnabled: true, BufferMinutes: 0}

	t.Run("booked slot with buffer in BlockedUntil prevents adjacent slot", func(t *testing.T) {
		// BookedSlot: StartsAt=09:00, BlockedUntil=09:40 (30-min service + 10-min buffer).
		// Slot 09:30: overlapsBooked(09:30, 10:00, [{09:00, 09:40}]) → 09:30 < 09:40 → blocked.
		// Slot 10:00: overlapsBooked(10:00, 10:30, [{09:00, 09:40}]) → 10:00 < 09:40? No → available.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noBufCfg, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{member}, nil)
			r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return(
				[]appointment.ScheduleRule{workRule(staffA, "09:00", "11:00")}, nil)
			r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
			r.On("ListScheduleBreaks", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleBreak{}, nil)
			// Booked slot includes buffer in BlockedUntil.
			r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(
				[]appointment.BookedSlot{{StartsAt: at(9, 0), BlockedUntil: at(9, 40)}}, nil)
		})
		slots, _, err := svc.SearchAvailability(context.Background(), req)
		require.NoError(t, err)

		startsMap := make(map[time.Time]bool)
		for _, s := range slots {
			startsMap[s.StartsAt] = true
		}
		assert.False(t, startsMap[at(9, 30)], "09:30 should be blocked by buffer period (BlockedUntil=09:40)")
		assert.True(t, startsMap[at(10, 0)], "10:00 should be available (after buffer expires)")
	})

	t.Run("booked slot without buffer allows the immediately adjacent slot", func(t *testing.T) {
		// BookedSlot: StartsAt=09:00, BlockedUntil=09:30 (no buffer).
		// Slot 09:30: overlapsBooked(09:30, 10:00, [{09:00, 09:30}]) → 09:30 < 09:30? No → available.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(noBufCfg, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{member}, nil)
			r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return(
				[]appointment.ScheduleRule{workRule(staffA, "09:00", "11:00")}, nil)
			r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
			r.On("ListScheduleBreaks", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleBreak{}, nil)
			// No buffer: BlockedUntil == EndsAt.
			r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(
				[]appointment.BookedSlot{{StartsAt: at(9, 0), BlockedUntil: at(9, 30)}}, nil)
		})
		slots, _, err := svc.SearchAvailability(context.Background(), req)
		require.NoError(t, err)

		startsMap := make(map[time.Time]bool)
		for _, s := range slots {
			startsMap[s.StartsAt] = true
		}
		assert.True(t, startsMap[at(9, 30)], "09:30 should be available when there is no buffer")
	})

	t.Run("tenant buffer in config shrinks effective slot window", func(t *testing.T) {
		// Tenant has BufferMinutes=10. Service is 30min → effectiveDuration=40min.
		// Working hours: 09:00–10:00. Only one slot fits: 09:00 (09:00+40min=09:40 ≤ 10:00).
		// Without buffer, two slots would fit (09:00 and 09:30). With buffer, only 09:00.
		bufCfg := &appointment.TenantBookingConfig{Timezone: "UTC", SameDayBookingEnabled: true, BufferMinutes: 10}
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(bufCfg, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{member}, nil)
			r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return(
				[]appointment.ScheduleRule{workRule(staffA, "09:00", "10:00")}, nil)
			r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
			r.On("ListScheduleBreaks", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleBreak{}, nil)
			r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(
				[]appointment.BookedSlot{}, nil)
		})
		slots, _, err := svc.SearchAvailability(context.Background(), req)
		require.NoError(t, err)
		require.Len(t, slots, 1, "only one slot fits when buffer is 10min in a 60min window")
		assert.Equal(t, at(9, 0), slots[0].StartsAt)
		assert.Equal(t, at(9, 30), slots[0].EndsAt, "EndsAt is service end, not blocked_until")
	})
}

func TestISOWeekBounds(t *testing.T) {
	tests := []struct {
		name      string
		input     time.Time
		wantStart time.Time
		wantEnd   time.Time
	}{
		{
			name:      "monday",
			input:     time.Date(2099, 4, 6, 10, 30, 0, 0, time.UTC),
			wantStart: time.Date(2099, 4, 6, 0, 0, 0, 0, time.UTC),
			wantEnd:   time.Date(2099, 4, 13, 0, 0, 0, 0, time.UTC),
		},
		{
			name:      "wednesday",
			input:     time.Date(2099, 4, 8, 14, 0, 0, 0, time.UTC),
			wantStart: time.Date(2099, 4, 6, 0, 0, 0, 0, time.UTC),
			wantEnd:   time.Date(2099, 4, 13, 0, 0, 0, 0, time.UTC),
		},
		{
			name:      "sunday",
			input:     time.Date(2099, 4, 12, 23, 59, 0, 0, time.UTC),
			wantStart: time.Date(2099, 4, 6, 0, 0, 0, 0, time.UTC),
			wantEnd:   time.Date(2099, 4, 13, 0, 0, 0, 0, time.UTC),
		},
		{
			name:      "next monday is new week",
			input:     time.Date(2099, 4, 13, 0, 0, 0, 0, time.UTC),
			wantStart: time.Date(2099, 4, 13, 0, 0, 0, 0, time.UTC),
			wantEnd:   time.Date(2099, 4, 20, 0, 0, 0, 0, time.UTC),
		},
		{
			name:      "year boundary — sunday dec 31 2098",
			input:     time.Date(2098, 12, 31, 12, 0, 0, 0, time.UTC),
			wantStart: time.Date(2098, 12, 29, 0, 0, 0, 0, time.UTC), // Monday Dec 29
			wantEnd:   time.Date(2099, 1, 5, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			start, end := appointment.ISOWeekBoundsForTest(tc.input)
			assert.Equal(t, tc.wantStart, start)
			assert.Equal(t, tc.wantEnd, end)
		})
	}
}

// ── SearchMultiDayAvailability ────────────────────────────────────────────────

func TestSearchMultiDayAvailability(t *testing.T) {
	tenantID := uuid.MustParse("aaaaaaaa-0000-0000-0000-000000000001")
	svcID := uuid.MustParse("bbbbbbbb-0000-0000-0000-000000000001")
	staffA := uuid.MustParse("cccccccc-0000-0000-0000-000000000001")
	staffB := uuid.MustParse("cccccccc-0000-0000-0000-000000000002")

	svc30 := &appointment.ServiceRecord{ID: svcID, DurationMinutes: 30}
	memberA := appointment.StaffMember{ID: staffA, FirstName: "Ahmet", LastName: "Yilmaz"}
	memberB := appointment.StaffMember{ID: staffB, FirstName: "Mehmet", LastName: "Kaya"}

	// testDate = 2099-04-06 (Monday, DayOfWeek=1).
	// testDate2 = 2099-04-07 (Tuesday, DayOfWeek=2).
	testDate2Str := "2099-04-07"

	// at2 returns a UTC time on testDate+1 (Tuesday) at h:m.
	at2 := func(h, m int) time.Time {
		return time.Date(2099, 4, 7, h, m, 0, 0, time.UTC)
	}

	// ruleForDay builds a ScheduleRule for an explicit day_of_week.
	ruleForDay := func(staffID uuid.UUID, dow int, start, end string) appointment.ScheduleRule {
		return appointment.ScheduleRule{
			ID: uuid.New(), StaffUserID: staffID, DayOfWeek: dow,
			StartTime: start, EndTime: end, SlotIntervalMinutes: 30, IsWorkingDay: true,
		}
	}

	// monRule / tueRule shorthands.
	monRule := func(staffID uuid.UUID, start, end string) appointment.ScheduleRule {
		return ruleForDay(staffID, 1, start, end) // Monday
	}
	tueRule := func(staffID uuid.UUID, start, end string) appointment.ScheduleRule {
		return ruleForDay(staffID, 2, start, end) // Tuesday
	}

	// baseCfg is a default config: UTC, same-day enabled, no buffer, no advance limits.
	baseCfg := &appointment.TenantBookingConfig{
		Timezone: "UTC", SameDayBookingEnabled: true,
		BufferMinutes: 0, MinAdvanceMinutes: 0, MaxAdvanceDays: 0, MaxWeeklyBookings: 0,
	}

	// emptyMaps are empty batch-load return values.
	emptyOffsMap := map[uuid.UUID][]appointment.TimeOff{}
	emptyBookedMap := map[uuid.UUID][]appointment.BookedSlot{}

	// setupBatch wires the four batch-load calls for the given staffIDs.
	setupBatch := func(r *mocks.MockRepoInterface,
		rules map[uuid.UUID][]appointment.ScheduleRule,
		breaks map[uuid.UUID][]appointment.ScheduleBreak,
		offs map[uuid.UUID][]appointment.TimeOff,
		booked map[uuid.UUID][]appointment.BookedSlot,
	) {
		r.On("ListAllStaffScheduleRules", mock.Anything, tenantID, mock.Anything).Return(rules, nil)
		r.On("ListAllStaffScheduleBreaks", mock.Anything, tenantID, mock.Anything).Return(breaks, nil)
		r.On("ListAllStaffTimeOffs", mock.Anything, tenantID, mock.Anything, mock.Anything, mock.Anything).Return(offs, nil)
		r.On("ListAllStaffBookedSlots", mock.Anything, tenantID, mock.Anything, mock.Anything, mock.Anything).Return(booked, nil)
	}

	// withPopularHours stubs out the recommendation fallback (popular hours).
	withPopularHours := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantPopularHours", mock.Anything, tenantID, "UTC").Return([]appointment.PopularHour{}, nil)
	}

	t.Run("validation: missing tenant_id", func(t *testing.T) {
		svc := newService(t, func(_ *mocks.MockRepoInterface) {})
		_, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			ServiceIDs: []uuid.UUID{svcID}, FromDate: testDateStr, ToDate: testDateStr,
		})
		require.ErrorIs(t, err, appointment.ErrTenantRequired)
	})

	t.Run("validation: missing service_ids", func(t *testing.T) {
		svc := newService(t, func(_ *mocks.MockRepoInterface) {})
		_, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, FromDate: testDateStr, ToDate: testDateStr,
		})
		require.ErrorIs(t, err, appointment.ErrServiceRequired)
	})

	t.Run("validation: date range exceeding 14 days", func(t *testing.T) {
		svc := newService(t, func(_ *mocks.MockRepoInterface) {})
		_, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: "2099-04-01", ToDate: "2099-04-16", // 16 days
		})
		require.ErrorIs(t, err, appointment.ErrDateRangeTooLarge)
	})

	t.Run("two days: slots returned per day, batch loading used", func(t *testing.T) {
		// staffA works Mon 09:00-10:00 and Tue 10:00-11:00.
		// Mon: 2 slots (09:00, 09:30). Tue: 2 slots (10:00, 10:30).
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{
					staffA: {monRule(staffA, "09:00", "10:00"), tueRule(staffA, "10:00", "11:00")},
				},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}},
				emptyOffsMap, emptyBookedMap,
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDate2Str,
		})
		require.NoError(t, err)
		require.Len(t, result.Days, 2)

		monDay := result.Days[0]
		assert.Equal(t, testDateStr, monDay.Date)
		assert.Len(t, monDay.Slots, 2)
		assert.Equal(t, at(9, 0), monDay.Slots[0].StartsAt)
		assert.Equal(t, at(9, 30), monDay.Slots[0].EndsAt)
		assert.Len(t, monDay.Slots[0].AvailableStaff, 1)
		assert.Equal(t, staffA, monDay.Slots[0].AvailableStaff[0].ID)

		tueDay := result.Days[1]
		assert.Equal(t, testDate2Str, tueDay.Date)
		assert.Len(t, tueDay.Slots, 2)
		assert.Equal(t, at2(10, 0), tueDay.Slots[0].StartsAt)
	})

	t.Run("FilledSlots populated for blocked positions", func(t *testing.T) {
		// staffA works Mon 09:00-10:00. Slot 09:00 is booked (BlockedUntil=09:30).
		// Open: [09:30]. Filled: [09:00] (within working hours, but blocked).
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{staffA: {monRule(staffA, "09:00", "10:00")}},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}},
				emptyOffsMap,
				map[uuid.UUID][]appointment.BookedSlot{
					staffA: {{StartsAt: at(9, 0), BlockedUntil: at(9, 30)}},
				},
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		require.Len(t, result.Days, 1)

		day := result.Days[0]
		assert.Len(t, day.Slots, 1, "only 09:30 is open")
		assert.Equal(t, at(9, 30), day.Slots[0].StartsAt)

		require.Len(t, day.FilledSlots, 1, "09:00 must appear as a filled slot")
		assert.Equal(t, at(9, 0), day.FilledSlots[0].StartsAt)
		assert.Equal(t, at(9, 30), day.FilledSlots[0].EndsAt)
	})

	t.Run("break excludes slot and adds it to FilledSlots", func(t *testing.T) {
		// staffA works Mon 09:00-10:00. Break at 09:00-09:30.
		// Slot 09:00 (ends 09:30) overlaps break → excluded from open; appears in filled.
		// Slot 09:30 (ends 10:00) does not overlap break → open.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{staffA: {monRule(staffA, "09:00", "10:00")}},
				map[uuid.UUID][]appointment.ScheduleBreak{
					staffA: {{DayOfWeek: 1, StartTime: "09:00", EndTime: "09:30"}},
				},
				emptyOffsMap, emptyBookedMap,
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		require.Len(t, result.Days, 1)

		day := result.Days[0]
		assert.Len(t, day.Slots, 1, "only 09:30 is open")
		assert.Equal(t, at(9, 30), day.Slots[0].StartsAt)

		require.Len(t, day.FilledSlots, 1, "09:00 blocked by break must appear as filled")
		assert.Equal(t, at(9, 0), day.FilledSlots[0].StartsAt)
	})

	t.Run("two staff at same time are merged into one slot with both in AvailableStaff", func(t *testing.T) {
		// Both staffA and staffB work Mon 09:00-09:30.
		// Result: one slot at 09:00 with AvailableStaff = [staffA, staffB].
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA, memberB}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{
					staffA: {monRule(staffA, "09:00", "09:30")},
					staffB: {monRule(staffB, "09:00", "09:30")},
				},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}, staffB: {}},
				emptyOffsMap, emptyBookedMap,
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		require.Len(t, result.Days[0].Slots, 1)
		slot := result.Days[0].Slots[0]
		assert.Equal(t, at(9, 0), slot.StartsAt)
		staffIDs := []uuid.UUID{slot.AvailableStaff[0].ID, slot.AvailableStaff[1].ID}
		assert.ElementsMatch(t, []uuid.UUID{staffA, staffB}, staffIDs)
	})

	t.Run("recommendations included inline", func(t *testing.T) {
		// staffA works Mon 09:00-10:00. Recommendations should include at least "Earliest".
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{staffA: {monRule(staffA, "09:00", "10:00")}},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}},
				emptyOffsMap, emptyBookedMap,
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		require.NotEmpty(t, result.Recommendations, "recommendations must be returned when slots exist")
		assert.Equal(t, "earliest", result.Recommendations[0].Label)
		assert.Equal(t, at(9, 0), result.Recommendations[0].StartsAt)
	})

	t.Run("max_advance_days clamps far-future request to empty result", func(t *testing.T) {
		// MaxAdvanceDays=1 means max bookable date = today+1, which is far before 2099.
		// After clamping, toDate < fromDate → empty result returned without any queries.
		clampedCfg := &appointment.TenantBookingConfig{
			Timezone: "UTC", SameDayBookingEnabled: true, MaxAdvanceDays: 1,
		}
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(clampedCfg, nil)
			// No GetServiceByID, ListStaffByServices, or batch calls — early return after clamp.
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDate2Str,
		})
		require.NoError(t, err)
		assert.Empty(t, result.Days)
		assert.Empty(t, result.Recommendations)
	})

	t.Run("status filtering: completed appointment does not block slot", func(t *testing.T) {
		// ListAllStaffBookedSlots only returns confirmed/payment_received (enforced in repo query).
		// This test verifies the service passes no completed slots through — if it did, a slot
		// would be incorrectly blocked. We simulate by returning an empty bookedMap.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{staffA: {monRule(staffA, "09:00", "09:30")}},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}},
				emptyOffsMap,
				emptyBookedMap, // no confirmed/payment_received — completed/cancelled excluded by repo
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		assert.Len(t, result.Days[0].Slots, 1, "slot available — no confirmed bookings blocking it")
	})

	t.Run("buffer in config applied: effectiveDuration shrinks slot window", func(t *testing.T) {
		// BufferMinutes=10, service=30min → effectiveDuration=40min.
		// Working hours: 09:00–10:00 (60min). Only one slot fits (09:00+40min=09:40 ≤ 10:00).
		bufCfg := &appointment.TenantBookingConfig{
			Timezone: "UTC", SameDayBookingEnabled: true, BufferMinutes: 10,
		}
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(bufCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{staffA: {monRule(staffA, "09:00", "10:00")}},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}},
				emptyOffsMap, emptyBookedMap,
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		require.Len(t, result.Days[0].Slots, 1, "only one slot fits with 10-min buffer in 60-min window")
		assert.Equal(t, at(9, 0), result.Days[0].Slots[0].StartsAt)
		assert.Equal(t, at(9, 30), result.Days[0].Slots[0].EndsAt, "EndsAt is service end, not blocked_until")
	})

	t.Run("staff_user_id filter returns only that staff member's slots", func(t *testing.T) {
		// staffA: Mon 09:00-09:30. staffB: Mon 10:00-10:30. Filter to staffB only.
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			// Both qualify; service filters to staffB in-memory after ListStaffByServices.
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{memberA, memberB}, nil)
			setupBatch(r,
				map[uuid.UUID][]appointment.ScheduleRule{
					staffA: {monRule(staffA, "09:00", "09:30")},
					staffB: {monRule(staffB, "10:00", "10:30")},
				},
				map[uuid.UUID][]appointment.ScheduleBreak{staffA: {}, staffB: {}},
				emptyOffsMap, emptyBookedMap,
			)
			withPopularHours(r)
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
			StaffUserID: staffB,
		})
		require.NoError(t, err)
		require.Len(t, result.Days[0].Slots, 1)
		assert.Equal(t, at(10, 0), result.Days[0].Slots[0].StartsAt)
		assert.Equal(t, staffB, result.Days[0].Slots[0].AvailableStaff[0].ID)
	})

	t.Run("no qualified staff returns empty result without batch calls", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetTenantBookingConfig", mock.Anything, tenantID).Return(baseCfg, nil)
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).
				Return([]appointment.StaffMember{}, nil)
			// No batch calls expected when staff list is empty.
		})
		result, err := svc.SearchMultiDayAvailability(context.Background(), appointment.SearchMultiDayAvailabilityRequest{
			TenantID: tenantID, ServiceIDs: []uuid.UUID{svcID},
			FromDate: testDateStr, ToDate: testDateStr,
		})
		require.NoError(t, err)
		assert.Empty(t, result.Days)
	})
}
