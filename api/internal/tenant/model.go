package tenant

import (
	"time"

	"github.com/google/uuid"
)

type Tenant struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name        string    `gorm:"size:255;not null"`
	Slug        string    `gorm:"size:100;not null;uniqueIndex"`
	PhoneNumber *string   `gorm:"size:30"`
	Address     *string   `gorm:"type:text"`
	Latitude    *float64  `gorm:"type:numeric(10,7)"`
	Longitude   *float64  `gorm:"type:numeric(10,7)"`
	Status      string    `gorm:"size:30;not null;default:active"`
	Timezone    string    `gorm:"size:100;not null;default:Europe/Istanbul"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (Tenant) TableName() string { return "tenants" }

type TenantBranding struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID       uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	LogoURL        *string   `gorm:"type:text"`
	PrimaryColor   *string   `gorm:"size:20"`
	SecondaryColor *string   `gorm:"size:20"`
	TertiaryColor  *string   `gorm:"size:20"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (TenantBranding) TableName() string { return "tenant_brandings" }

type TenantSettings struct {
	ID                        uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID                  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	NotificationReminderHours int       `gorm:"not null;default:24"`
	CancellationLimitHours    int       `gorm:"not null;default:1"`
	LoyaltyEnabled            bool      `gorm:"not null;default:true"`
	WalkInEnabled             bool      `gorm:"not null;default:true"`
	SameDayBookingEnabled     bool      `gorm:"not null;default:true"`
	MaxWeeklyCustomerBookings int       `gorm:"not null;default:2"`
	CreatedAt                 time.Time
	UpdatedAt                 time.Time
}

func (TenantSettings) TableName() string { return "tenant_settings" }

type TenantUser struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID     uuid.UUID `gorm:"type:uuid;not null"`
	Email        string    `gorm:"size:255;not null"`
	PasswordHash string    `gorm:"type:text;not null"`
	FirstName    string    `gorm:"size:100;not null"`
	LastName     string    `gorm:"size:100;not null"`
	Role         string    `gorm:"size:30;not null"`
	Status       string    `gorm:"size:30;not null;default:active"`
	AvatarURL    *string   `gorm:"column:avatar_url;type:text"`
	Specialty    *string   `gorm:"size:100"`
	Bio          *string   `gorm:"type:text"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	AvgRating    float64 `gorm:"column:avg_rating"`
	ReviewCount  int     `gorm:"column:review_count"`
}

func (TenantUser) TableName() string { return "tenant_users" }

// CatalogService mirrors the services table.
type CatalogService struct {
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

func (CatalogService) TableName() string { return "services" }

// ScheduleRule maps to the staff_schedule_rules table.
type ScheduleRule struct {
	ID                  uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID            uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID         uuid.UUID `gorm:"type:uuid;not null"`
	DayOfWeek           int       `gorm:"not null"`
	StartTime           string    `gorm:"type:time;not null"`
	EndTime             string    `gorm:"type:time;not null"`
	SlotIntervalMinutes int       `gorm:"not null;default:30"`
	IsWorkingDay        bool      `gorm:"not null;default:true"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

func (ScheduleRule) TableName() string { return "staff_schedule_rules" }

// TimeOff maps to the staff_time_offs table.
type TimeOff struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID    uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID uuid.UUID `gorm:"type:uuid;not null"`
	StartAt     time.Time `gorm:"not null"`
	EndAt       time.Time `gorm:"not null"`
	Reason      *string   `gorm:"type:text"`
	Type        string    `gorm:"size:30;not null"`
	CreatedAt   time.Time
}

func (TimeOff) TableName() string { return "staff_time_offs" }

// StaffServiceAssignment maps to the staff_services table.
// ServiceName is populated via a JOIN with services when listing.
type StaffServiceAssignment struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID    uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID uuid.UUID `gorm:"type:uuid;not null"`
	ServiceID   uuid.UUID `gorm:"type:uuid;not null"`
	CustomPrice *string   `gorm:"type:numeric(12,2)"`
	IsActive    bool      `gorm:"not null;default:true"`
	CreatedAt   time.Time
	ServiceName string `gorm:"column:service_name;-:create;-:update"`
}

func (StaffServiceAssignment) TableName() string { return "staff_services" }

// StaffCalendarAppointment is a read-only projection for calendar queries.
type StaffCalendarAppointment struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID          uuid.UUID `gorm:"type:uuid"`
	CustomerID        uuid.UUID `gorm:"type:uuid"`
	StaffUserID       uuid.UUID `gorm:"type:uuid"`
	StartsAt          time.Time
	EndsAt            time.Time
	Status            string
	CreatedVia        string
	CreatedAt         time.Time
	UpdatedAt         time.Time
	CustomerFirstName string `gorm:"column:customer_first_name"`
	CustomerLastName  string `gorm:"column:customer_last_name"`
}

// AnalyticsResult holds the aggregate analytics data.
type AnalyticsResult struct {
	TotalAppointments     int
	CompletedAppointments int
	CancelledAppointments int
	NoShowCount           int
	TotalRevenue          string
	ActiveCustomers       int
	ReturningCustomers    int
	TotalVisits           int
	StaffUtilization      float64
	RewardsRedeemed       int
}

type PopularServiceResult struct {
	Name  string
	Count int
}
