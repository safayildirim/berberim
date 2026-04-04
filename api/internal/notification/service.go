package notification

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/berberim/api/internal/requestmeta"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

const (
	defaultReminderOffsetMinutes = int32(120)
	maxReminderAttempts          = int32(3)
)

type Service struct {
	log      *zap.Logger
	repo     *Repo
	provider PushProvider
}

func NewService(log *zap.Logger, repo *Repo, provider PushProvider) *Service {
	return &Service{
		log:      log,
		repo:     repo,
		provider: provider,
	}
}

type SettingsUpdateInput struct {
	AppointmentReminderEnabled bool
	ReminderOffsetMinutes      int32
	SendToCustomer             bool
	SendToStaff                bool
	IsActive                   bool
}

type RegisterPushDeviceInput struct {
	Platform       string
	Provider       string
	DeviceToken    string
	AppVersion     string
	Locale         string
	Timezone       string
	InstallationID string
}

type DispatchStats struct {
	Claimed int
	Sent    int
	Failed  int
	Skipped int
}

func (s *Service) GetSettings(ctx context.Context, tenantID uuid.UUID) (*NotificationSettings, error) {
	settings, err := s.repo.GetSettings(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get notification settings: %v", err)
	}
	return settings, nil
}

func (s *Service) UpdateSettings(ctx context.Context, tenantID uuid.UUID, in SettingsUpdateInput) (*NotificationSettings, error) {
	if in.ReminderOffsetMinutes < 5 || in.ReminderOffsetMinutes > 7*24*60 {
		return nil, status.Error(codes.InvalidArgument, "reminder_offset_minutes must be between 5 and 10080")
	}

	settings, err := s.repo.UpdateSettings(ctx, tenantID, map[string]interface{}{
		"appointment_reminder_enabled": in.AppointmentReminderEnabled,
		"reminder_offset_minutes":      in.ReminderOffsetMinutes,
		"send_to_customer":             in.SendToCustomer,
		"send_to_staff":                in.SendToStaff,
		"is_active":                    in.IsActive,
		"updated_at":                   time.Now(),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "update notification settings: %v", err)
	}
	return settings, nil
}

func (s *Service) RegisterPushDevice(ctx context.Context, userType string, userID uuid.UUID, tenantID *uuid.UUID, in RegisterPushDeviceInput) (uuid.UUID, error) {
	if userID == uuid.Nil {
		return uuid.Nil, status.Error(codes.InvalidArgument, "user_id required")
	}

	meta, _ := requestmeta.FromContext(ctx)

	installationID := strings.TrimSpace(in.InstallationID)
	if installationID == "" {
		installationID = strings.TrimSpace(meta.InstallationID)
	}
	if installationID == "" {
		installationID = uuid.New().String()
	}

	platform := strings.TrimSpace(in.Platform)
	if platform == "" {
		platform = strings.TrimSpace(meta.Platform)
	}
	if platform == "" {
		platform = "web"
	}

	provider := strings.TrimSpace(in.Provider)
	if provider == "" {
		provider = strings.TrimSpace(meta.Provider)
	}
	if provider == "" {
		provider = "expo"
	}

	var pushToken *string
	if tok := strings.TrimSpace(in.DeviceToken); tok != "" {
		pushToken = &tok
	} else if tok := strings.TrimSpace(meta.PushToken); tok != "" {
		pushToken = &tok
	}
	if pushToken == nil {
		return uuid.Nil, status.Error(codes.InvalidArgument, "device_token is required")
	}

	appVersion := pickStringPtr(in.AppVersion, meta.AppVersion)
	locale := pickStringPtr(in.Locale, meta.Locale)
	tz := pickStringPtr(in.Timezone, meta.Timezone)
	osVersion := pickStringPtr(meta.OSVersion, "")
	model := pickStringPtr(meta.DeviceModel, "")
	userAgent := pickStringPtr(meta.UserAgent, "")

	deviceID, err := s.repo.UpsertPushDevice(ctx, UpsertPushDeviceInput{
		UserType:       userType,
		UserID:         userID,
		TenantID:       tenantID,
		InstallationID: installationID,
		Provider:       provider,
		PushToken:      pushToken,
		Platform:       platform,
		AppVersion:     appVersion,
		Locale:         locale,
		Timezone:       tz,
		OSVersion:      osVersion,
		DeviceModel:    model,
		UserAgent:      userAgent,
	})
	if err != nil {
		return uuid.Nil, status.Errorf(codes.Internal, "register push device: %v", err)
	}
	return deviceID, nil
}

func (s *Service) DeletePushDevice(ctx context.Context, userType string, userID, deviceID uuid.UUID) error {
	if deviceID == uuid.Nil {
		return status.Error(codes.InvalidArgument, "device_id is required")
	}
	if err := s.repo.DeactivatePushDevice(ctx, userType, userID, deviceID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "push device not found")
		}
		return status.Errorf(codes.Internal, "delete push device: %v", err)
	}
	return nil
}

// ScheduleAppointmentReminders implements appointment reminder scheduling hook.
func (s *Service) ScheduleAppointmentReminders(ctx context.Context, tenantID, appointmentID, customerID uuid.UUID, startsAt time.Time) error {
	settings, err := s.repo.GetSettings(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("load notification settings: %w", err)
	}
	if !settings.IsActive || !settings.AppointmentReminderEnabled || !settings.SendToCustomer {
		return nil
	}

	offset := settings.ReminderOffsetMinutes
	if offset <= 0 {
		offset = defaultReminderOffsetMinutes
	}
	scheduledAt := startsAt.UTC().Add(-time.Duration(offset) * time.Minute)
	if !scheduledAt.After(time.Now().UTC()) {
		return nil
	}

	payload := map[string]interface{}{
		"type":           "appointment_reminder",
		"tenant_id":      tenantID.String(),
		"appointment_id": appointmentID.String(),
		"deep_link":      fmt.Sprintf("berberim://appointments/%s", appointmentID.String()),
	}
	payloadJSON, _ := json.Marshal(payload)

	reminder := &Reminder{
		ID:            uuid.New(),
		TenantID:      tenantID,
		AppointmentID: appointmentID,
		RecipientType: RecipientTypeCustomer,
		RecipientID:   customerID,
		Channel:       "push",
		Type:          "appointment_reminder",
		ScheduledAt:   scheduledAt,
		NextAttemptAt: scheduledAt,
		Status:        StatusPending,
		DedupeKey:     buildReminderDedupeKey(appointmentID, RecipientTypeCustomer, customerID, offset),
		PayloadJSON:   payloadJSON,
	}
	if err := s.repo.CreateReminder(ctx, reminder); err != nil {
		return fmt.Errorf("create reminder: %w", err)
	}
	return nil
}

// CancelAppointmentReminders implements appointment lifecycle cancellation hook.
func (s *Service) CancelAppointmentReminders(ctx context.Context, tenantID, appointmentID uuid.UUID, reason string) error {
	return s.repo.CancelOpenRemindersByAppointment(ctx, tenantID, appointmentID, reason)
}

func (s *Service) DispatchDueReminders(ctx context.Context, limit int) (DispatchStats, error) {
	stats := DispatchStats{}
	reminders, err := s.repo.ClaimDueReminders(ctx, limit, maxReminderAttempts)
	if err != nil {
		return stats, fmt.Errorf("claim due reminders: %w", err)
	}
	stats.Claimed = len(reminders)

	for _, rm := range reminders {
		switch err := s.dispatchReminder(ctx, rm); {
		case err == nil:
			stats.Sent++
		case errors.Is(err, errReminderSkipped):
			stats.Skipped++
		default:
			stats.Failed++
		}
	}

	return stats, nil
}

var errReminderSkipped = errors.New("reminder skipped")

func (s *Service) dispatchReminder(ctx context.Context, rm Reminder) error {
	snap, err := s.repo.GetAppointmentSnapshot(ctx, rm.TenantID, rm.AppointmentID)
	if err != nil {
		_ = s.repo.MarkReminderSkipped(ctx, rm.ID, "appointment_not_found")
		return errReminderSkipped
	}
	if snap.Status != "confirmed" {
		_ = s.repo.MarkReminderSkipped(ctx, rm.ID, "appointment_not_confirmed")
		return errReminderSkipped
	}
	if snap.StartsAt.Before(time.Now().UTC().Add(-5 * time.Minute)) {
		_ = s.repo.MarkReminderSkipped(ctx, rm.ID, "appointment_already_started")
		return errReminderSkipped
	}

	devices, err := s.repo.ListActivePushDevices(ctx, rm.RecipientType, rm.RecipientID)
	if err != nil {
		return s.failWithRetry(ctx, rm, fmt.Sprintf("list devices: %v", err))
	}
	if len(devices) == 0 {
		_ = s.repo.MarkReminderSkipped(ctx, rm.ID, "no_active_push_device")
		return errReminderSkipped
	}

	loc := time.UTC
	if tz, tzErr := s.repo.GetTenantTimezone(ctx, rm.TenantID); tzErr == nil && tz != "" {
		if tzLoc, loadErr := time.LoadLocation(tz); loadErr == nil {
			loc = tzLoc
		}
	}
	localStart := snap.StartsAt.In(loc)

	msg := PushMessage{
		Title: "Appointment Reminder",
		Body:  fmt.Sprintf("Your appointment starts at %s.", localStart.Format("02 Jan 15:04")),
		Data: map[string]interface{}{
			"type":           "appointment_reminder",
			"tenant_id":      rm.TenantID.String(),
			"appointment_id": rm.AppointmentID.String(),
			"deep_link":      fmt.Sprintf("berberim://appointments/%s", rm.AppointmentID.String()),
		},
	}

	var sendErrors []string
	sent := false
	for _, d := range devices {
		if d.PushToken == nil || *d.PushToken == "" {
			s.log.Warn("skipping reminder due to missing push token", zap.String("reminder_id", rm.ID.String()))
			continue
		}
		if d.Provider != s.provider.ProviderName() {
			sendErrors = append(sendErrors, fmt.Sprintf("unsupported provider: %s", d.Provider))
			continue
		}

		if err := s.provider.Send(ctx, *d.PushToken, msg); err != nil {
			sendErrors = append(sendErrors, err.Error())
			if errors.Is(err, ErrInvalidPushToken) {
				_ = s.repo.DeactivatePushToken(ctx, d.Provider, *d.PushToken)
			}
			continue
		}
		sent = true
	}

	if sent {
		if err := s.repo.MarkReminderSent(ctx, rm.ID); err != nil {
			return err
		}
		return nil
	}
	reason := "push_delivery_failed"
	if len(sendErrors) > 0 {
		reason = strings.Join(sendErrors, "; ")
	}
	return s.failWithRetry(ctx, rm, reason)
}

func (s *Service) failWithRetry(ctx context.Context, rm Reminder, reason string) error {
	nextAttemptCount := rm.AttemptCount + 1
	terminal := nextAttemptCount >= maxReminderAttempts
	nextAttemptAt := time.Now().UTC().Add(time.Duration(nextAttemptCount*2) * time.Minute)
	if terminal {
		nextAttemptAt = time.Now().UTC()
	}
	if err := s.repo.MarkReminderFailure(ctx, rm.ID, nextAttemptCount, terminal, nextAttemptAt, reason); err != nil {
		return err
	}
	return fmt.Errorf("dispatch failed: %s", reason)
}

func pickStringPtr(primary, fallback string) *string {
	v := strings.TrimSpace(primary)
	if v == "" {
		v = strings.TrimSpace(fallback)
	}
	if v == "" {
		return nil
	}
	return &v
}
