package customer

import (
	"time"

	"github.com/google/uuid"
)

type Customer struct {
	ID                         uuid.UUID  `gorm:"column:id;primaryKey"`
	TenantID                   uuid.UUID  `gorm:"column:tenant_id"`
	PhoneNumber                string     `gorm:"column:phone_number"`
	FirstName                  *string    `gorm:"column:first_name"`
	LastName                   *string    `gorm:"column:last_name"`
	AvatarURL                  *string    `gorm:"column:avatar_url"`
	Status                     string     `gorm:"column:status"`
	CreatedAt                  time.Time  `gorm:"column:created_at"`
	UpdatedAt                  time.Time  `gorm:"column:updated_at"`
	TotalCompletedAppointments int        `gorm:"column:total_completed_appointments"`
	LastAppointmentAt          *time.Time `gorm:"column:last_appointment_at"`
	LoyaltyPoints              int        `gorm:"column:loyalty_points"`
}

func (Customer) TableName() string { return "customers" }
