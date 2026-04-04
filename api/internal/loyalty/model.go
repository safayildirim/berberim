package loyalty

import (
	"time"

	"github.com/google/uuid"
)

// Wallet mirrors the loyalty_wallets table.
type Wallet struct {
	ID                   uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID             uuid.UUID `gorm:"type:uuid;not null"`
	CustomerID           uuid.UUID `gorm:"type:uuid;not null"`
	CurrentPoints        int       `gorm:"not null;default:0"`
	LifetimeEarnedPoints int       `gorm:"not null;default:0"`
	LifetimeSpentPoints  int       `gorm:"not null;default:0"`
	UpdatedAt            time.Time
}

func (Wallet) TableName() string { return "loyalty_wallets" }

// Transaction mirrors the loyalty_transactions table.
type Transaction struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey"`
	TenantID      uuid.UUID  `gorm:"type:uuid;not null"`
	CustomerID    uuid.UUID  `gorm:"type:uuid;not null"`
	AppointmentID *uuid.UUID `gorm:"type:uuid"`
	Type          string     `gorm:"size:30;not null"` // earn | redeem | expire | adjust
	Points        int        `gorm:"not null"`
	BalanceAfter  int        `gorm:"not null"`
	Reason        string     `gorm:"type:text;not null"`
	ExpiresAt     *time.Time
	CreatedByType string     `gorm:"size:30;not null"` // system | admin | staff
	CreatedByID   *uuid.UUID `gorm:"type:uuid"`
	CreatedAt     time.Time
}

func (Transaction) TableName() string { return "loyalty_transactions" }
