package review

import (
	"time"

	"github.com/google/uuid"
)

type Review struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID      uuid.UUID `gorm:"type:uuid;not null"`
	AppointmentID uuid.UUID `gorm:"type:uuid;not null"`
	CustomerID    uuid.UUID `gorm:"type:uuid;not null"`
	StaffUserID   uuid.UUID `gorm:"type:uuid;not null"`
	Rating        int       `gorm:"not null"`
	Comment       *string   `gorm:"type:text"`
	IsAnonymous   bool      `gorm:"not null;default:false"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
	CustomerName  string `gorm:"-:migration"` // Populated by JOIN in list queries; not a DB column.
}

func (Review) TableName() string { return "staff_reviews" }

// ReviewAppointment is a lightweight projection of an appointment row
// used to validate review eligibility without importing the appointment package.
type ReviewAppointment struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	CustomerID  uuid.UUID `gorm:"type:uuid"`
	StaffUserID uuid.UUID `gorm:"type:uuid"`
	Status      string    `gorm:"size:30"`
}
