package auth

import (
	"time"

	"github.com/google/uuid"
)

type SigningKey struct {
	KID           string `gorm:"column:kid;primaryKey;size:64"`
	Status        string `gorm:"size:32"`
	PublicKeyPEM  string `gorm:"type:text"`
	PrivateKeyRef string `gorm:"size:512"`
	CreatedAt     time.Time
	NotBefore     time.Time
	NotAfter      time.Time
	RotatedAt     *time.Time
}

func (SigningKey) TableName() string { return "signing_keys" }

type Customer struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	PhoneNumber string    `gorm:"size:30;not null"`
	FirstName   *string   `gorm:"size:100"`
	LastName    *string   `gorm:"size:100"`
	Status      string    `gorm:"size:30;not null;default:active"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (Customer) TableName() string { return "customers" }

type CustomerIdentity struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	CustomerID     uuid.UUID `gorm:"type:uuid;not null"`
	Provider       string    `gorm:"size:30;not null"`
	ProviderUserID string    `gorm:"type:text;not null"`
	CreatedAt      time.Time
}

func (CustomerIdentity) TableName() string { return "customer_identities" }

type OTPCode struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey"`
	CustomerID uuid.UUID `gorm:"type:uuid;not null"`
	Code       string    `gorm:"size:6;not null"`
	ExpiresAt  time.Time `gorm:"not null"`
	VerifiedAt *time.Time
	CreatedAt  time.Time
}

func (OTPCode) TableName() string { return "customer_otp_codes" }

type TenantUser struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	TenantID     uuid.UUID `gorm:"type:uuid;not null"`
	Email        string    `gorm:"size:255;not null"`
	PasswordHash string    `gorm:"type:text;not null"`
	FirstName    string    `gorm:"size:100;not null"`
	LastName     string    `gorm:"size:100;not null"`
	Role         string    `gorm:"size:30;not null"`
	Status       string    `gorm:"size:30;not null;default:active"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (TenantUser) TableName() string { return "tenant_users" }

type PlatformUser struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string    `gorm:"size:255;not null;uniqueIndex"`
	PasswordHash string    `gorm:"type:text;not null"`
	Role         string    `gorm:"size:30;not null"`
	Status       string    `gorm:"size:30;not null;default:active"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

func (PlatformUser) TableName() string { return "platform_users" }

type Tenant struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name      string    `gorm:"size:255;not null"`
	Slug      string    `gorm:"size:100;not null;uniqueIndex"`
	Status    string    `gorm:"size:30;not null;default:active"`
	Timezone  string    `gorm:"size:100;not null;default:Europe/Istanbul"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (Tenant) TableName() string { return "tenants" }

type UserDevice struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserType       string     `gorm:"size:20;not null"`
	UserID         uuid.UUID  `gorm:"type:uuid;not null"`
	TenantID       *uuid.UUID `gorm:"type:uuid"`
	InstallationID string     `gorm:"size:128;not null"`
	Provider       string     `gorm:"size:20;not null;default:expo"`
	PushToken      *string    `gorm:"type:text"`
	Platform       string     `gorm:"size:10;not null"`
	AppVersion     *string    `gorm:"size:32"`
	Locale         *string    `gorm:"size:16"`
	Timezone       *string    `gorm:"size:100"`
	OSVersion      *string    `gorm:"size:64"`
	DeviceModel    *string    `gorm:"size:120"`
	UserAgent      *string    `gorm:"type:text"`
	IsActive       bool       `gorm:"not null;default:true"`
	LastSeenAt     time.Time  `gorm:"not null"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (UserDevice) TableName() string { return "user_devices" }

type Session struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey"`
	UserType         string     `gorm:"size:20;not null"`
	UserID           uuid.UUID  `gorm:"type:uuid;not null"`
	TenantID         *uuid.UUID `gorm:"type:uuid"`
	RefreshTokenHash string     `gorm:"type:text;not null;uniqueIndex"`
	DeviceID         *uuid.UUID `gorm:"type:uuid"`
	IPAddress        *string    `gorm:"type:inet"`
	UserAgent        *string    `gorm:"type:text"`
	LastUsedAt       time.Time  `gorm:"not null"`
	ExpiresAt        time.Time  `gorm:"not null"`
	RevokedAt        *time.Time
	CreatedAt        time.Time
	DevicePlatform   *string `gorm:"->;column:device_platform"`
	DeviceModel      *string `gorm:"->;column:device_model"`
	DeviceAppVersion *string `gorm:"->;column:device_app_version"`
	DeviceOSVersion  *string `gorm:"->;column:device_os_version"`
}

func (Session) TableName() string { return "sessions" }
