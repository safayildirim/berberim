package auth

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) GetTenantByID(ctx context.Context, id uuid.UUID) (*Tenant, error) {
	var t Tenant
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&t).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *Repo) GetCustomerByPhone(ctx context.Context, phone string) (*Customer, error) {
	var c Customer
	err := r.db.WithContext(ctx).Where("phone_number = ?", phone).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repo) GetCustomerByID(ctx context.Context, id uuid.UUID) (*Customer, error) {
	var c Customer
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repo) UpsertCustomer(ctx context.Context, c *Customer) error {
	return r.db.WithContext(ctx).Save(c).Error
}

func (r *Repo) CreateOTPCode(ctx context.Context, o *OTPCode) error {
	return r.db.WithContext(ctx).Create(o).Error
}

// InvalidatePendingOTPs marks all unverified, unexpired OTPs for a customer as verified (expires them).
func (r *Repo) InvalidatePendingOTPs(ctx context.Context, customerID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&OTPCode{}).
		Where("customer_id = ? AND verified_at IS NULL AND expires_at > ?", customerID, time.Now()).
		Update("verified_at", time.Now()).Error
}

func (r *Repo) FindValidOTPCode(ctx context.Context, customerID uuid.UUID, code string) (*OTPCode, error) {
	var o OTPCode
	err := r.db.WithContext(ctx).
		Where("customer_id = ? AND code = ? AND verified_at IS NULL AND expires_at > ?", customerID, code, time.Now()).
		Order("created_at DESC").
		First(&o).Error
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) MarkOTPVerified(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&OTPCode{}).Where("id = ?", id).Update("verified_at", now).Error
}

func (r *Repo) GetCustomerIdentity(ctx context.Context, provider, providerUserID string) (*CustomerIdentity, error) {
	var ci CustomerIdentity
	err := r.db.WithContext(ctx).
		Where("provider = ? AND provider_user_id = ?", provider, providerUserID).
		First(&ci).Error
	if err != nil {
		return nil, err
	}
	return &ci, nil
}

func (r *Repo) CreateCustomerIdentity(ctx context.Context, ci *CustomerIdentity) error {
	return r.db.WithContext(ctx).Create(ci).Error
}

func (r *Repo) GetTenantUserByEmail(ctx context.Context, tenantID uuid.UUID, email string) (*TenantUser, error) {
	var u TenantUser
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND email = ?", tenantID, email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) GetTenantUserByID(ctx context.Context, tenantID, userID uuid.UUID) (*TenantUser, error) {
	var u TenantUser
	err := r.db.WithContext(ctx).Where("tenant_id = ? AND id = ?", tenantID, userID).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) GetPlatformUserByEmail(ctx context.Context, email string) (*PlatformUser, error) {
	var u PlatformUser
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) CreateSession(ctx context.Context, s *Session) error {
	return r.db.WithContext(ctx).Create(s).Error
}

func (r *Repo) UpsertUserDevice(ctx context.Context, d *UserDevice) (uuid.UUID, error) {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}

	// Use SQL upsert with RETURNING id so callers can always link sessions to
	// the persisted device row regardless of insert/update path.
	query := `
		INSERT INTO user_devices (
			id,
			user_type,
			user_id,
			tenant_id,
			installation_id,
			provider,
			push_token,
			platform,
			app_version,
			locale,
			timezone,
			os_version,
			device_model,
			user_agent,
			is_active,
			last_seen_at,
			created_at,
			updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, now(), now(), now())
		ON CONFLICT (user_type, user_id, installation_id)
		DO UPDATE SET
			tenant_id = COALESCE(EXCLUDED.tenant_id, user_devices.tenant_id),
			provider = COALESCE(EXCLUDED.provider, user_devices.provider),
			push_token = COALESCE(EXCLUDED.push_token, user_devices.push_token),
			platform = EXCLUDED.platform,
			app_version = COALESCE(EXCLUDED.app_version, user_devices.app_version),
			locale = COALESCE(EXCLUDED.locale, user_devices.locale),
			timezone = COALESCE(EXCLUDED.timezone, user_devices.timezone),
			os_version = COALESCE(EXCLUDED.os_version, user_devices.os_version),
			device_model = COALESCE(EXCLUDED.device_model, user_devices.device_model),
			user_agent = COALESCE(EXCLUDED.user_agent, user_devices.user_agent),
			is_active = true,
			last_seen_at = now(),
			updated_at = now()
		RETURNING id
	`

	var id uuid.UUID
	if err := r.db.WithContext(ctx).Raw(
		query,
		d.ID,
		d.UserType,
		d.UserID,
		d.TenantID,
		d.InstallationID,
		d.Provider,
		d.PushToken,
		d.Platform,
		d.AppVersion,
		d.Locale,
		d.Timezone,
		d.OSVersion,
		d.DeviceModel,
		d.UserAgent,
	).Scan(&id).Error; err != nil {
		return uuid.Nil, err
	}

	return id, nil
}

func (r *Repo) GetSessionByTokenHash(ctx context.Context, hash string) (*Session, error) {
	var s Session
	err := r.db.WithContext(ctx).Where("refresh_token_hash = ?", hash).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *Repo) UpdateSessionLastUsed(ctx context.Context, id uuid.UUID) error {
	return r.UpdateSessionActivity(ctx, id, nil, nil)
}

func (r *Repo) UpdateSessionActivity(ctx context.Context, id uuid.UUID, ipAddress, userAgent *string) error {
	assignments := map[string]interface{}{
		"last_used_at": time.Now(),
	}
	if ipAddress != nil {
		assignments["ip_address"] = *ipAddress
	}
	if userAgent != nil {
		assignments["user_agent"] = *userAgent
	}
	return r.db.WithContext(ctx).Model(&Session{}).Where("id = ?", id).Updates(assignments).Error
}

func (r *Repo) UpdateSessionDeviceID(ctx context.Context, sessionID, deviceID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&Session{}).
		Where("id = ?", sessionID).
		Update("device_id", deviceID).Error
}

func (r *Repo) TouchUserDevice(ctx context.Context, deviceID uuid.UUID, appVersion, osVersion, deviceModel, userAgent *string) error {
	assignments := map[string]interface{}{
		"is_active":    true,
		"last_seen_at": time.Now(),
		"updated_at":   time.Now(),
	}
	if appVersion != nil {
		assignments["app_version"] = *appVersion
	}
	if osVersion != nil {
		assignments["os_version"] = *osVersion
	}
	if deviceModel != nil {
		assignments["device_model"] = *deviceModel
	}
	if userAgent != nil {
		assignments["user_agent"] = *userAgent
	}
	return r.db.WithContext(ctx).
		Model(&UserDevice{}).
		Where("id = ?", deviceID).
		Updates(assignments).Error
}

func (r *Repo) RevokeSession(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&Session{}).Where("id = ?", id).Update("revoked_at", now).Error
}

func (r *Repo) RevokeAllUserSessions(ctx context.Context, userType string, userID uuid.UUID) (int64, error) {
	now := time.Now()
	result := r.db.WithContext(ctx).Model(&Session{}).
		Where("user_type = ? AND user_id = ? AND revoked_at IS NULL", userType, userID).
		Update("revoked_at", now)
	return result.RowsAffected, result.Error
}

func (r *Repo) ListActiveSessions(ctx context.Context, userType string, userID uuid.UUID) ([]Session, error) {
	var sessions []Session
	err := r.db.WithContext(ctx).
		Table("sessions AS s").
		Select(`
			s.*,
			d.platform AS device_platform,
			d.device_model AS device_model,
			d.app_version AS device_app_version,
			d.os_version AS device_os_version
		`).
		Joins("LEFT JOIN user_devices AS d ON d.id = s.device_id").
		Where("s.user_type = ? AND s.user_id = ? AND s.revoked_at IS NULL AND s.expires_at > ?", userType, userID, time.Now()).
		Order("s.created_at DESC").
		Find(&sessions).Error
	return sessions, err
}
