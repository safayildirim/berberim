package notification

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterPushDevice(ctx context.Context, req *berberimv1.RegisterPushDeviceRequest) (*berberimv1.RegisterPushDeviceResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if rc.TokenType != "customer" && rc.TokenType != "tenant_user" {
		return nil, status.Error(codes.PermissionDenied, "push device registration is only allowed for customer or tenant_user")
	}

	var tenantID *uuid.UUID
	if rc.TenantID != uuid.Nil {
		tid := rc.TenantID
		tenantID = &tid
	}

	deviceID, err := h.svc.RegisterPushDevice(ctx, rc.TokenType, rc.UserID, tenantID, RegisterPushDeviceInput{
		Platform:       req.Platform,
		Provider:       req.Provider,
		DeviceToken:    req.DeviceToken,
		AppVersion:     req.AppVersion,
		Locale:         req.Locale,
		Timezone:       req.Timezone,
		InstallationID: req.InstallationId,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.RegisterPushDeviceResponse{DeviceId: deviceID.String()}, nil
}

func (h *Handler) DeletePushDevice(ctx context.Context, req *berberimv1.DeletePushDeviceRequest) (*berberimv1.DeletePushDeviceResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if rc.TokenType != "customer" && rc.TokenType != "tenant_user" {
		return nil, status.Error(codes.PermissionDenied, "push device delete is only allowed for customer or tenant_user")
	}
	deviceID, err := uuid.Parse(req.DeviceId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid device_id")
	}
	if err := h.svc.DeletePushDevice(ctx, rc.TokenType, rc.UserID, deviceID); err != nil {
		return nil, err
	}
	return &berberimv1.DeletePushDeviceResponse{}, nil
}

func (h *Handler) GetNotificationSettings(ctx context.Context, _ *berberimv1.GetNotificationSettingsRequest) (*berberimv1.GetNotificationSettingsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if rc.TokenType != "tenant_user" || rc.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "tenant admin role required")
	}

	settings, err := h.svc.GetSettings(ctx, rc.TenantID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetNotificationSettingsResponse{Settings: settingsToProto(settings)}, nil
}

func (h *Handler) UpdateNotificationSettings(ctx context.Context, req *berberimv1.UpdateNotificationSettingsRequest) (*berberimv1.UpdateNotificationSettingsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if rc.TokenType != "tenant_user" || rc.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "tenant admin role required")
	}
	if req.Settings == nil {
		return nil, status.Error(codes.InvalidArgument, "settings is required")
	}

	settings, err := h.svc.UpdateSettings(ctx, rc.TenantID, SettingsUpdateInput{
		AppointmentReminderEnabled: req.Settings.AppointmentReminderEnabled,
		ReminderOffsetMinutes:      req.Settings.ReminderOffsetMinutes,
		SendToCustomer:             req.Settings.SendToCustomer,
		SendToStaff:                req.Settings.SendToStaff,
		IsActive:                   req.Settings.IsActive,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateNotificationSettingsResponse{Settings: settingsToProto(settings)}, nil
}

func settingsToProto(s *NotificationSettings) *berberimv1.NotificationSettingsData {
	return &berberimv1.NotificationSettingsData{
		AppointmentReminderEnabled: s.AppointmentReminderEnabled,
		ReminderOffsetMinutes:      s.ReminderOffsetMinutes,
		SendToCustomer:             s.SendToCustomer,
		SendToStaff:                s.SendToStaff,
		IsActive:                   s.IsActive,
	}
}
