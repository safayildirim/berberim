package notification

import (
	"time"

	"github.com/google/uuid"
)

const (
	StatusPending    = "pending"
	StatusProcessing = "processing"
	StatusSent       = "sent"
	StatusFailed     = "failed"
	StatusCancelled  = "cancelled"
	StatusSkipped    = "skipped"
)

const (
	RecipientTypeCustomer = "customer"
	RecipientTypeStaff    = "tenant_user"
)

type NotificationSettings struct {
	ID                         uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID                   uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	AppointmentReminderEnabled bool      `gorm:"not null;default:true"`
	ReminderOffsetMinutes      int32     `gorm:"not null;default:120"`
	SendToCustomer             bool      `gorm:"not null;default:true"`
	SendToStaff                bool      `gorm:"not null;default:false"`
	IsActive                   bool      `gorm:"not null;default:true"`
	CreatedAt                  time.Time
	UpdatedAt                  time.Time
}

func (NotificationSettings) TableName() string { return "notification_settings" }

type Reminder struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID      uuid.UUID `gorm:"type:uuid;not null"`
	AppointmentID uuid.UUID `gorm:"type:uuid;not null"`
	RecipientType string    `gorm:"size:20;not null"`
	RecipientID   uuid.UUID `gorm:"type:uuid;not null"`
	Channel       string    `gorm:"size:20;not null"`
	Type          string    `gorm:"size:40;not null"`
	ScheduledAt   time.Time `gorm:"not null"`
	NextAttemptAt time.Time `gorm:"not null"`
	Status        string    `gorm:"size:20;not null"`
	DedupeKey     string    `gorm:"size:255;not null;uniqueIndex"`
	PayloadJSON   []byte    `gorm:"type:jsonb;not null"`
	AttemptCount  int32     `gorm:"not null;default:0"`
	LastError     *string   `gorm:"type:text"`
	SentAt        *time.Time
	CancelledAt   *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (Reminder) TableName() string { return "notification_reminders" }

type UserDevice struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserType       string     `gorm:"size:20;not null"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null"`
	TenantID       *uuid.UUID `gorm:"type:uuid"`
	InstallationID string     `gorm:"size:128;not null"`
	Provider       string     `gorm:"size:20;not null"`
	PushToken      *string    `gorm:"type:text"`
	Platform       string     `gorm:"size:10;not null"`
	AppVersion     *string    `gorm:"size:32"`
	Locale         *string    `gorm:"size:16"`
	Timezone       *string    `gorm:"size:100"`
	OSVersion      *string    `gorm:"size:64"`
	DeviceModel    *string    `gorm:"size:120"`
	UserAgent      *string    `gorm:"type:text"`
	IsActive       bool       `gorm:"not null"`
	LastSeenAt     time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (UserDevice) TableName() string { return "user_devices" }

type AppointmentSnapshot struct {
	ID         uuid.UUID
	TenantID   uuid.UUID
	CustomerID uuid.UUID
	Status     string
	StartsAt   time.Time
}
