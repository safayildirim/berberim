package appointment

import "errors"

var (
	ErrNotFound                   = errors.New("appointment not found")
	ErrSlotUnavailable            = errors.New("slot no longer available — please choose another time")
	ErrInvalidTransition          = errors.New("invalid status transition")
	ErrTenantRequired             = errors.New("tenant_id is required")
	ErrServiceRequired            = errors.New("service_id is required")
	ErrStaffRequired              = errors.New("staff_user_id is required")
	ErrCustomerRequired           = errors.New("customer_id is required")
	ErrStartsAtRequired           = errors.New("starts_at is required")
	ErrDateRequired               = errors.New("date is required")
	ErrInvalidStartsAt            = errors.New("invalid starts_at timestamp")
	ErrInvalidDate                = errors.New("invalid date — expected YYYY-MM-DD")
	ErrWeeklyBookingLimitReached  = errors.New("weekly booking limit reached — please choose a different week")
	ErrDateRangeTooLarge          = errors.New("date range exceeds maximum of 14 days")
	ErrSameDayDisabled            = errors.New("same-day booking is not available for this shop")
	ErrTooSoon                    = errors.New("appointment is too soon — check minimum advance booking time")
	ErrTooFarOut                  = errors.New("appointment is too far in advance — check maximum advance booking days")
	ErrServiceInactive            = errors.New("one or more selected services are no longer available")
	ErrStaffUnavailableForService = errors.New("selected staff cannot perform one or more selected services")
	ErrOutsideWorkingHours        = errors.New("appointment is outside staff working hours")
	ErrIdempotencyConflict        = errors.New("idempotency key already used for a different booking")
)

const (
	StatusConfirmed       = "confirmed"
	StatusPaymentReceived = "payment_received"
	StatusCompleted       = "completed"
	StatusCancelled       = "cancelled"
	StatusNoShow          = "no_show"
	StatusRescheduled     = "rescheduled"

	CreatedViaCustomerApp = "customer_app"
	CreatedViaAdminPanel  = "admin_panel"
	CreatedViaWalkIn      = "walk_in"
)

// ActiveStatuses are appointment statuses that represent a live booking.
// These statuses block the staff member's time in availability checks and
// are enforced by the DB exclusion constraint.
//
// If you add a status here, also update:
//   - migration: exclusion constraint WHERE clause
//   - repo.go: ListBookedSlots / ListAllStaffBookedSlots queries
//   - repo.go: ListConflictingAppointments query
//   - repo.go: CountCustomerAppointmentsInWeek query
var ActiveStatuses = []string{StatusConfirmed, StatusPaymentReceived}

// TerminalStatuses are statuses where the appointment no longer occupies time.
var TerminalStatuses = []string{StatusCompleted, StatusCancelled, StatusNoShow, StatusRescheduled}
