package notification

import (
	"context"
	"fmt"
	"time"

	"github.com/pkg/errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/berberim/api/internal/txctx"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) dbForCtx(ctx context.Context) *gorm.DB {
	return txctx.DBForCtx(ctx, r.db)
}

func (r *Repo) GetSettings(ctx context.Context, tenantID uuid.UUID) (*NotificationSettings, error) {
	var settings NotificationSettings
	err := r.dbForCtx(ctx).WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		First(&settings).Error
	if err == nil {
		return &settings, nil
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	seed := &NotificationSettings{
		ID:                         uuid.New(),
		TenantID:                   tenantID,
		AppointmentReminderEnabled: true,
		ReminderOffsetMinutes:      120,
		SendToCustomer:             true,
		SendToStaff:                false,
		IsActive:                   true,
	}
	if err := r.dbForCtx(ctx).WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "tenant_id"}},
			DoNothing: true,
		}).
		Create(seed).Error; err != nil {
		return nil, err
	}
	if err := r.dbForCtx(ctx).WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		First(&settings).Error; err != nil {
		return nil, err
	}
	return &settings, nil
}

func (r *Repo) UpdateSettings(ctx context.Context, tenantID uuid.UUID, updates map[string]interface{}) (*NotificationSettings, error) {
	if _, err := r.GetSettings(ctx, tenantID); err != nil {
		return nil, err
	}
	if len(updates) > 0 {
		if err := r.dbForCtx(ctx).WithContext(ctx).
			Model(&NotificationSettings{}).
			Where("tenant_id = ?", tenantID).
			Updates(updates).Error; err != nil {
			return nil, err
		}
	}
	return r.GetSettings(ctx, tenantID)
}

type UpsertPushDeviceInput struct {
	UserType       string
	UserID         uuid.UUID
	TenantID       *uuid.UUID
	InstallationID string
	Provider       string
	PushToken      *string
	Platform       string
	AppVersion     *string
	Locale         *string
	Timezone       *string
	OSVersion      *string
	DeviceModel    *string
	UserAgent      *string
}

func (r *Repo) UpsertPushDevice(ctx context.Context, in UpsertPushDeviceInput) (uuid.UUID, error) {
	id := uuid.New()
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
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, now(), now(), now())
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
	var outStr string
	if err := r.dbForCtx(ctx).WithContext(ctx).Raw(
		query,
		id,
		in.UserType,
		in.UserID,
		in.TenantID,
		in.InstallationID,
		in.Provider,
		in.PushToken,
		in.Platform,
		in.AppVersion,
		in.Locale,
		in.Timezone,
		in.OSVersion,
		in.DeviceModel,
		in.UserAgent,
	).Scan(&outStr).Error; err != nil {
		return uuid.Nil, err
	}
	out, err := uuid.Parse(outStr)
	if err != nil {
		return uuid.Nil, fmt.Errorf("parse returned id: %w", err)
	}
	return out, nil
}

func (r *Repo) DeactivatePushDevice(ctx context.Context, userType string, userID, deviceID uuid.UUID) error {
	res := r.dbForCtx(ctx).WithContext(ctx).
		Model(&UserDevice{}).
		Where("id = ? AND user_type = ? AND user_id = ?", deviceID, userType, userID).
		Updates(map[string]interface{}{
			"is_active":  false,
			"push_token": nil,
			"updated_at": time.Now(),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repo) DeactivatePushToken(ctx context.Context, provider, pushToken string) error {
	return r.dbForCtx(ctx).WithContext(ctx).
		Model(&UserDevice{}).
		Where("provider = ? AND push_token = ?", provider, pushToken).
		Updates(map[string]interface{}{
			"is_active":  false,
			"updated_at": time.Now(),
		}).Error
}

func (r *Repo) ListActivePushDevices(ctx context.Context, userType string, userID uuid.UUID) ([]UserDevice, error) {
	var devices []UserDevice
	err := r.dbForCtx(ctx).WithContext(ctx).
		Where("user_type = ? AND user_id = ? AND is_active = true AND push_token IS NOT NULL", userType, userID).
		Find(&devices).Error
	return devices, err
}

func (r *Repo) CreateReminder(ctx context.Context, reminder *Reminder) error {
	return r.dbForCtx(ctx).WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "dedupe_key"}},
			DoNothing: true,
		}).
		Create(reminder).Error
}

func (r *Repo) CancelOpenRemindersByAppointment(ctx context.Context, tenantID, appointmentID uuid.UUID, reason string) error {
	updates := map[string]interface{}{
		"status":       StatusCancelled,
		"cancelled_at": time.Now(),
		"updated_at":   time.Now(),
	}
	if reason != "" {
		updates["last_error"] = reason
	}
	return r.dbForCtx(ctx).WithContext(ctx).
		Model(&Reminder{}).
		Where("tenant_id = ? AND appointment_id = ? AND status IN ?", tenantID, appointmentID, []string{StatusPending, StatusFailed, StatusProcessing}).
		Updates(updates).Error
}

func (r *Repo) ClaimDueReminders(ctx context.Context, limit int, maxAttempts int32) ([]Reminder, error) {
	var reminders []Reminder
	if limit <= 0 {
		limit = 100
	}
	query := `
		WITH due AS (
			SELECT id
			FROM notification_reminders
			WHERE status IN ('pending', 'failed')
			  AND next_attempt_at <= now()
			  AND attempt_count < ?
			ORDER BY scheduled_at ASC
			FOR UPDATE SKIP LOCKED
			LIMIT ?
		)
		UPDATE notification_reminders r
		SET status = 'processing',
		    updated_at = now()
		FROM due
		WHERE r.id = due.id
		RETURNING r.*
	`
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return tx.Raw(query, maxAttempts, limit).Scan(&reminders).Error
	})
	if err != nil {
		return nil, err
	}
	return reminders, nil
}

func (r *Repo) MarkReminderSent(ctx context.Context, reminderID uuid.UUID) error {
	now := time.Now()
	return r.dbForCtx(ctx).WithContext(ctx).
		Model(&Reminder{}).
		Where("id = ?", reminderID).
		Updates(map[string]interface{}{
			"status":     StatusSent,
			"sent_at":    now,
			"updated_at": now,
			"last_error": nil,
		}).Error
}

func (r *Repo) MarkReminderSkipped(ctx context.Context, reminderID uuid.UUID, reason string) error {
	return r.dbForCtx(ctx).WithContext(ctx).
		Model(&Reminder{}).
		Where("id = ?", reminderID).
		Updates(map[string]interface{}{
			"status":     StatusSkipped,
			"updated_at": time.Now(),
			"last_error": reason,
		}).Error
}

func (r *Repo) MarkReminderFailure(ctx context.Context, reminderID uuid.UUID, nextAttemptCount int32, terminal bool, nextAttemptAt time.Time, reason string) error {
	status := StatusPending
	if terminal {
		status = StatusFailed
	}
	return r.dbForCtx(ctx).WithContext(ctx).
		Model(&Reminder{}).
		Where("id = ?", reminderID).
		Updates(map[string]interface{}{
			"status":          status,
			"attempt_count":   nextAttemptCount,
			"next_attempt_at": nextAttemptAt,
			"updated_at":      time.Now(),
			"last_error":      reason,
		}).Error
}

func (r *Repo) GetAppointmentSnapshot(ctx context.Context, tenantID, appointmentID uuid.UUID) (*AppointmentSnapshot, error) {
	var snap AppointmentSnapshot
	err := r.dbForCtx(ctx).WithContext(ctx).
		Table("appointments").
		Select("id, tenant_id, customer_id, status, starts_at").
		Where("tenant_id = ? AND id = ?", tenantID, appointmentID).
		Scan(&snap).Error
	if err != nil {
		return nil, err
	}
	if snap.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &snap, nil
}

func (r *Repo) GetTenantTimezone(ctx context.Context, tenantID uuid.UUID) (string, error) {
	var tz string
	if err := r.dbForCtx(ctx).WithContext(ctx).
		Table("tenants").
		Where("id = ?", tenantID).
		Pluck("timezone", &tz).Error; err != nil {
		return "", err
	}
	return tz, nil
}

func buildReminderDedupeKey(appointmentID uuid.UUID, recipientType string, recipientID uuid.UUID, offsetMinutes int32) string {
	return fmt.Sprintf("appointment:%s:recipient:%s:%s:offset:%d", appointmentID.String(), recipientType, recipientID.String(), offsetMinutes)
}
