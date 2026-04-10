package membership

import (
	"time"

	"github.com/google/uuid"
)

type Membership struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey"`
	CustomerID uuid.UUID  `gorm:"type:uuid;not null"`
	TenantID   uuid.UUID  `gorm:"type:uuid;not null"`
	Status     string     `gorm:"size:30;not null;default:active"`
	LinkCodeID *uuid.UUID `gorm:"type:uuid"`
	JoinedAt   time.Time  `gorm:"not null"`
	DisabledAt *time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (Membership) TableName() string { return "customer_tenant_memberships" }

type LinkCode struct {
	ID              uuid.UUID  `gorm:"type:uuid;primaryKey"`
	TenantID        uuid.UUID  `gorm:"type:uuid;not null"`
	Code            string     `gorm:"size:8;not null"`
	CreatedByUserID uuid.UUID  `gorm:"type:uuid;not null"`
	MaxUses         int        `gorm:"not null;default:1"`
	CurrentUses     int        `gorm:"not null;default:0"`
	ExpiresAt       time.Time  `gorm:"not null"`
	RevokedAt       *time.Time
	RevokedByUserID *uuid.UUID `gorm:"type:uuid"`
	CreatedAt       time.Time
}

func (LinkCode) TableName() string { return "tenant_link_codes" }

type CustomerProfile struct {
	MembershipID uuid.UUID `gorm:"type:uuid;primaryKey"`
	NotesInternal *string  `gorm:"type:text"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (CustomerProfile) TableName() string { return "tenant_customer_profiles" }

// MembershipWithTenant is a read projection for customer-facing tenant list.
type MembershipWithTenant struct {
	TenantID   uuid.UUID
	TenantName string
	TenantSlug string
	LogoURL    *string
	Status     string
	JoinedAt   time.Time
}
