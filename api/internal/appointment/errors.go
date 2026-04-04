package appointment

import "errors"

var (
	ErrNotFound                  = errors.New("appointment not found")
	ErrSlotUnavailable           = errors.New("slot no longer available — please choose another time")
	ErrInvalidTransition         = errors.New("invalid status transition")
	ErrTenantRequired            = errors.New("tenant_id is required")
	ErrServiceRequired           = errors.New("service_id is required")
	ErrStaffRequired             = errors.New("staff_user_id is required")
	ErrCustomerRequired          = errors.New("customer_id is required")
	ErrStartsAtRequired          = errors.New("starts_at is required")
	ErrDateRequired              = errors.New("date is required")
	ErrInvalidStartsAt           = errors.New("invalid starts_at timestamp")
	ErrInvalidDate               = errors.New("invalid date — expected YYYY-MM-DD")
	ErrWeeklyBookingLimitReached = errors.New("weekly booking limit reached — please choose a different week")
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
