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

	// Helper: set up GetTenantTimezone mock returning UTC for all tests that pass validation.
	withTZ := func(r *mocks.MockRepoInterface) {
		r.On("GetTenantTimezone", mock.Anything, tenantID).Return("UTC", nil)
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
				withTZ(r)
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
				withTZ(r)
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
				withTZ(r)
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
				withTZ(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA}, nil)
				// No rule for testDate's weekday.
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
				withTZ(r)
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
				withTZ(r)
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
				withTZ(r)
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
				withTZ(r)
				r.On("ListStaffByServices", mock.Anything, tenantID, []uuid.UUID{svcID}).Return([]appointment.StaffMember{memberA}, nil)
				r.On("ListStaffScheduleRules", mock.Anything, tenantID, staffA).Return([]appointment.ScheduleRule{workRule(staffA, "09:00", "10:00")},
					nil)
				r.On("ListTimeOffs", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return(noTimeOffs, nil)
				// 09:00–09:30 is already booked.
				r.On("ListBookedSlots", mock.Anything, tenantID, staffA, mock.Anything, mock.Anything).Return([]appointment.BookedSlot{
					{StartsAt: at(9, 0), EndsAt: at(9, 30)},
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
				withTZ(r)
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
				withTZ(r)
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

	// setupFullCreate sets up all mocks needed for a successful appointment creation
	// past the weekly limit check.
	setupFullCreate := func(r *mocks.MockRepoInterface, count int64, maxBookings int) {
		r.On("GetMaxWeeklyCustomerBookings", mock.Anything, tenantID).Return(maxBookings, nil)
		if maxBookings > 0 {
			r.On("CountCustomerAppointmentsInWeek", mock.Anything, tenantID, customerID, weekStart, weekEnd).Return(count, nil)
		}
		r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
		r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
			fn := args.Get(1).(func(context.Context) error)
			_ = fn(context.Background())
		}).Return(nil)
		r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
		r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
		r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
	}

	t.Run("customer with 0 bookings succeeds", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupFullCreate(r, 0, 2)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("customer with 1 booking succeeds", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			setupFullCreate(r, 1, 2)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("customer with 2 bookings blocked", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetMaxWeeklyCustomerBookings", mock.Anything, tenantID).Return(2, nil)
			r.On("CountCustomerAppointmentsInWeek", mock.Anything, tenantID, customerID, weekStart, weekEnd).Return(int64(2), nil)
		})
		_, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.ErrorIs(t, err, appointment.ErrWeeklyBookingLimitReached)
	})

	t.Run("admin booking bypasses limit", func(t *testing.T) {
		req := baseReq
		req.CreatedVia = appointment.CreatedViaAdminPanel
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			// No weekly limit mocks — they should not be called.
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
				fn := args.Get(1).(func(context.Context) error)
				_ = fn(context.Background())
			}).Return(nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("walk-in booking bypasses limit", func(t *testing.T) {
		req := baseReq
		req.CreatedVia = appointment.CreatedViaWalkIn
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
				fn := args.Get(1).(func(context.Context) error)
				_ = fn(context.Background())
			}).Return(nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), req)
		require.NoError(t, err)
		assert.NotNil(t, appt)
	})

	t.Run("limit 0 disables restriction", func(t *testing.T) {
		svc := newService(t, func(r *mocks.MockRepoInterface) {
			r.On("GetMaxWeeklyCustomerBookings", mock.Anything, tenantID).Return(0, nil)
			// CountCustomerAppointmentsInWeek should NOT be called when limit is 0.
			r.On("GetServiceByID", mock.Anything, tenantID, svcID).Return(svc30, nil)
			r.On("RunInTx", mock.Anything, mock.Anything).Run(func(args mock.Arguments) {
				fn := args.Get(1).(func(context.Context) error)
				_ = fn(context.Background())
			}).Return(nil)
			r.On("CreateAppointment", mock.Anything, mock.Anything).Return(nil)
			r.On("CreateAppointmentService", mock.Anything, mock.Anything).Return(nil)
			r.On("GetStaffMember", mock.Anything, tenantID, staffID).Return(&appointment.StaffMember{ID: staffID}, nil)
		})
		appt, _, err := svc.CreateAppointment(context.Background(), baseReq)
		require.NoError(t, err)
		assert.NotNil(t, appt)
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
