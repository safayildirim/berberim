package appointment

import (
	"time"

	"github.com/google/uuid"
)

// Appointment mirrors the appointments table.
type Appointment struct {
	ID                           uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID                     uuid.UUID `gorm:"type:uuid;not null"`
	CustomerID                   uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID                  uuid.UUID `gorm:"type:uuid;not null"`
	StartsAt                     time.Time `gorm:"not null"`
	EndsAt                       time.Time `gorm:"not null"`
	BlockedUntil                 time.Time `gorm:"not null"`
	Status                       string    `gorm:"size:30;not null"`
	CancellationReason           *string   `gorm:"type:text"`
	CancelledByType              *string   `gorm:"size:30"`
	CompletedAt                  *time.Time
	NoShowMarkedAt               *time.Time
	NotesCustomer                *string    `gorm:"type:text"`
	NotesInternal                *string    `gorm:"type:text"`
	RescheduledFromAppointmentID *uuid.UUID `gorm:"type:uuid"`
	IdempotencyKey               *string    `gorm:"size:64"`
	CreatedVia                   string     `gorm:"size:30;not null"`
	CreatedAt                    time.Time
	UpdatedAt                    time.Time
}

func (Appointment) TableName() string { return "appointments" }

// Duration returns the planned duration of the appointment.
func (a *Appointment) Duration() time.Duration {
	return a.EndsAt.Sub(a.StartsAt)
}

// AppointmentService mirrors the appointment_services table (snapshot of service at booking time).
type AppointmentService struct {
	ID                      uuid.UUID  `gorm:"type:uuid;primaryKey"`
	TenantID                uuid.UUID  `gorm:"type:uuid;not null"`
	AppointmentID           uuid.UUID  `gorm:"type:uuid;not null"`
	ServiceID               *uuid.UUID `gorm:"type:uuid"`
	ServiceNameSnapshot     string     `gorm:"size:150;not null"`
	DurationMinutesSnapshot int        `gorm:"not null"`
	PriceSnapshot           string     `gorm:"type:numeric(12,2);not null"`
	PointsRewardSnapshot    int        `gorm:"not null;default:0"`
	CreatedAt               time.Time
}

func (AppointmentService) TableName() string { return "appointment_services" }

// ServiceRecord mirrors the services table (read-only from appointment package).
type ServiceRecord struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID        uuid.UUID `gorm:"type:uuid;not null"`
	Name            string    `gorm:"size:150;not null"`
	Description     *string   `gorm:"type:text"`
	DurationMinutes int       `gorm:"not null"`
	BasePrice       string    `gorm:"type:numeric(12,2);not null"`
	PointsReward    int       `gorm:"not null;default:0"`
	CategoryName    *string   `gorm:"size:100"`
	IsActive        bool      `gorm:"not null;default:true"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (ServiceRecord) TableName() string { return "services" }

// StaffMember is used for availability computation.
type StaffMember struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID    uuid.UUID `gorm:"type:uuid;not null"`
	FirstName   string    `gorm:"size:100;not null"`
	LastName    string    `gorm:"size:100;not null"`
	AvatarKey   *string   `gorm:"column:avatar_key"`
	Specialty   *string
	Bio         *string
	Status      string
	AvgRating   float64 `gorm:"column:avg_rating"`
	ReviewCount int     `gorm:"column:review_count"`
}

// CustomerInfo is a lightweight read-only projection of a customer row
// enriched with a visit count computed from the appointments table.
type CustomerInfo struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	TenantID    uuid.UUID `gorm:"type:uuid;not null" json:"tenant_id"`
	PhoneNumber string    `gorm:"size:30;not null" json:"phone_number"`
	FirstName   *string   `gorm:"size:100" json:"first_name"`
	LastName    *string   `gorm:"size:100" json:"last_name"`
	Status      string    `gorm:"size:30;not null" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	VisitCount  int       `gorm:"column:visit_count" json:"visit_count"`
}

func (CustomerInfo) TableName() string { return "customers" }

// ScheduleRule mirrors staff_schedule_rules.
type ScheduleRule struct {
	ID                  uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID            uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID         uuid.UUID `gorm:"type:uuid;not null"`
	DayOfWeek           int       `gorm:"not null"` // 0=Sunday … 6=Saturday
	StartTime           string    `gorm:"type:time;not null"`
	EndTime             string    `gorm:"type:time;not null"`
	SlotIntervalMinutes int       `gorm:"not null;default:30"`
	IsWorkingDay        bool      `gorm:"not null;default:true"`
}

// ScheduleBreak represents a recurring break for a staff member on a specific
// day of the week. Stored in the staff_schedule_breaks table.
type ScheduleBreak struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID    uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID uuid.UUID `gorm:"type:uuid;not null"`
	DayOfWeek   int       `gorm:"not null"`
	StartTime   string    `gorm:"type:time;not null"`
	EndTime     string    `gorm:"type:time;not null"`
	Label       *string   `gorm:"size:50"`
}

func (ScheduleBreak) TableName() string { return "staff_schedule_breaks" }

func (ScheduleRule) TableName() string { return "staff_schedule_rules" }

// TimeOff mirrors staff_time_offs.
type TimeOff struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID    uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID uuid.UUID `gorm:"type:uuid;not null"`
	StartAt     time.Time `gorm:"not null"`
	EndAt       time.Time `gorm:"not null"`
}

func (TimeOff) TableName() string { return "staff_time_offs" }

// BookedSlot is a lightweight projection of a booked appointment.
// BlockedUntil includes the buffer period after the service ends.
type BookedSlot struct {
	ID           uuid.UUID
	StartsAt     time.Time
	BlockedUntil time.Time
}

// AvailableSlot is computed output of the availability algorithm.
type StaffOption struct {
	ID          uuid.UUID `json:"id"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	AvatarKey   *string   `json:"avatar_key"`
	Specialty   *string   `json:"specialty"`
	Bio         *string   `json:"bio"`
	AvgRating   float64   `json:"avg_rating"`
	ReviewCount int       `json:"review_count"`
}

type AvailableSlot struct {
	StartsAt       time.Time
	EndsAt         time.Time
	AvailableStaff []StaffOption
}

// FilledSlot is a slot-interval position within working hours where all
// qualified staff are booked. Returned alongside available slots so the UI
// can render it as unavailable/seated.
type FilledSlot struct {
	StartsAt time.Time
	EndsAt   time.Time
}

// ReviewInfo is a lightweight projection of a review used to hydrate
// appointment lists without importing the review package.
type ReviewInfo struct {
	ID            uuid.UUID
	AppointmentID uuid.UUID
	Rating        int
	Comment       *string
	IsAnonymous   bool
	CustomerID    uuid.UUID
	StaffUserID   uuid.UUID
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// ListQuery is the input for paginated appointment list queries.
type ListQuery struct {
	TenantID    uuid.UUID
	CustomerID  uuid.UUID // zero = no filter
	StaffUserID uuid.UUID // zero = no filter
	DateFrom    *time.Time
	DateTo      *time.Time
	Status      string // empty = no filter
	Page        int
	PageSize    int
}

// ListResult holds the combined result of listing appointments with their
// associated services, staff members, and customer info.
type ListResult struct {
	Appointments []Appointment
	Services     [][]AppointmentService
	Staff        []*StaffMember
	Customers    []*CustomerInfo
	Reviews      []*ReviewInfo
	Total        int32
	TotalPages   int32
}

// GetResult holds the combined result of fetching a single appointment
// with its associated services, staff member, and customer info.
type GetResult struct {
	Appointment *Appointment
	Services    []AppointmentService
	Staff       *StaffMember
	Customer    *CustomerInfo
}

// BookingPattern captures a customer's most common booking preferences
// derived from past appointment history.
type BookingPattern struct {
	PreferredHour  int       // most common booking hour (0-23)
	PreferredStaff uuid.UUID // most visited staff member
	StaffVisits    int       // number of visits with preferred staff
	TotalVisits    int       // total completed visits
}

// PopularHour represents a frequently booked hour at a tenant.
type PopularHour struct {
	Hour         int
	BookingCount int
}

// SlotRecommendation is a single recommended time slot with a label explaining
// why it was recommended.
type SlotRecommendation struct {
	StartsAt       time.Time
	EndsAt         time.Time
	AvailableStaff []StaffOption
	Label          string // "earliest", "preferred_time", "preferred_staff", "popular"
}

// ── Multi-day availability types ────────────────────────────────────────────

// TenantBookingConfig consolidates all tenant-level settings used by the
// availability engine and the booking write path into a single read.
type TenantBookingConfig struct {
	Timezone              string `gorm:"column:timezone"`
	BufferMinutes         int    `gorm:"column:buffer_minutes"`
	SameDayBookingEnabled bool   `gorm:"column:same_day_booking_enabled"`
	MinAdvanceMinutes     int    `gorm:"column:min_advance_minutes"`
	MaxAdvanceDays        int    `gorm:"column:max_advance_days"`
	MaxWeeklyBookings     int    `gorm:"column:max_weekly_bookings"`
}

type SearchMultiDayAvailabilityRequest struct {
	TenantID    uuid.UUID
	ServiceIDs  []uuid.UUID
	StaffUserID uuid.UUID // optional — zero means all qualified staff
	FromDate    string    // YYYY-MM-DD, inclusive
	ToDate      string    // YYYY-MM-DD, inclusive (max 14 days)
	CustomerID  uuid.UUID // optional — for personalized recommendations
}

type DayAvailability struct {
	Date        string
	Slots       []AvailableSlot
	FilledSlots []FilledSlot
}

type MultiDayResult struct {
	Days            []DayAvailability
	Recommendations []SlotRecommendation
}

type SearchStaffAvailabilityRequest struct {
	TenantID    uuid.UUID
	StaffUserID uuid.UUID   // required
	ServiceIDs  []uuid.UUID // optional filter
	FromDate    string
	ToDate      string
}

type StaffAvailabilityResult struct {
	Days               []DayAvailability
	CompatibleServices []ServiceRecord
}
