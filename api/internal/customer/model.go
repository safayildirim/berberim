package customer

import (
	"time"

	"github.com/google/uuid"
)

// Customer is the read model used by tenant-scoped customer queries.
// It combines global customer fields with tenant-scoped computed/membership fields.
type Customer struct {
	ID          uuid.UUID `gorm:"column:id;primaryKey"`
	PhoneNumber string    `gorm:"column:phone_number"`
	FirstName   *string   `gorm:"column:first_name"`
	LastName    *string   `gorm:"column:last_name"`
	AvatarKey   *string   `gorm:"column:avatar_key"`
	Status      string    `gorm:"column:status"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`

	// Tenant-scoped membership fields (from JOIN with customer_tenant_memberships)
	MembershipStatus string    `gorm:"column:membership_status"`
	JoinedAt         time.Time `gorm:"column:joined_at"`

	// Tenant-scoped profile fields (from JOIN with tenant_customer_profiles)
	NotesInternal *string `gorm:"column:notes_internal"`

	// Computed aggregates (from LEFT JOIN with appointments / loyalty_wallets)
	TotalCompletedAppointments int        `gorm:"column:total_completed_appointments"`
	LastAppointmentAt          *time.Time `gorm:"column:last_appointment_at"`
	LoyaltyPoints              int        `gorm:"column:loyalty_points"`
}

func (Customer) TableName() string { return "customers" }
