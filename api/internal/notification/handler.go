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

// ── Customer Notifications ───────────────────────────────────────────────────

func (h *Handler) ListCustomerNotifications(ctx context.Context, req *berberimv1.ListCustomerNotificationsRequest) (*berberimv1.ListCustomerNotificationsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if rc.TokenType != "customer" {
		return nil, status.Error(codes.PermissionDenied, "customer token required")
	}

	notifications, total, err := h.svc.ListCustomerNotifications(ctx, rc.TenantID, rc.UserID, req.Page, req.PageSize)
	if err != nil {
		return nil, err
	}

	unreadCount, err := h.svc.GetUnreadNotificationCount(ctx, rc.TenantID, rc.UserID)
	if err != nil {
		return nil, err
	}

	pageSize := int32(20)
	if req.PageSize > 0 && req.PageSize <= 50 {
		pageSize = req.PageSize
	}
	totalPages := int32(total) / pageSize
	if int32(total)%pageSize > 0 {
		totalPages++
	}

	out := make([]*berberimv1.CustomerNotification, 0, len(notifications))
	for i := range notifications {
		out = append(out, notificationToProto(&notifications[i]))
	}

	return &berberimv1.ListCustomerNotificationsResponse{
		Notifications: out,
		Total:         int32(total),
		TotalPages:    totalPages,
		UnreadCount:   unreadCount,
	}, nil
}

func (h *Handler) MarkNotificationRead(ctx context.Context, req *berberimv1.MarkNotificationReadRequest) (*berberimv1.MarkNotificationReadResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if rc.TokenType != "customer" {
		return nil, status.Error(codes.PermissionDenied, "customer token required")
	}

	notifID, err := uuid.Parse(req.NotificationId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid notification_id")
	}

	if err := h.svc.MarkNotificationRead(ctx, rc.TenantID, rc.UserID, notifID); err != nil {
		return nil, err
	}
	return &berberimv1.MarkNotificationReadResponse{}, nil
}

func (h *Handler) MarkAllNotificationsRead(ctx context.Context, _ *berberimv1.MarkAllNotificationsReadRequest) (*berberimv1.MarkAllNotificationsReadResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if rc.TokenType != "customer" {
		return nil, status.Error(codes.PermissionDenied, "customer token required")
	}

	count, err := h.svc.MarkAllNotificationsRead(ctx, rc.TenantID, rc.UserID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.MarkAllNotificationsReadResponse{UpdatedCount: count}, nil
}

func (h *Handler) GetUnreadNotificationCount(ctx context.Context, _ *berberimv1.GetUnreadNotificationCountRequest) (*berberimv1.GetUnreadNotificationCountResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	if rc.TokenType != "customer" {
		return nil, status.Error(codes.PermissionDenied, "customer token required")
	}

	count, err := h.svc.GetUnreadNotificationCount(ctx, rc.TenantID, rc.UserID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetUnreadNotificationCountResponse{Count: count}, nil
}

func notificationToProto(n *CustomerNotification) *berberimv1.CustomerNotification {
	out := &berberimv1.CustomerNotification{
		Id:        n.ID.String(),
		Type:      n.Type,
		Title:     n.Title,
		Body:      n.Body,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if n.ReadAt != nil {
		out.ReadAt = n.ReadAt.Format("2006-01-02T15:04:05Z07:00")
	}
	if n.DeepLink != nil {
		out.DeepLink = *n.DeepLink
	}
	if n.ReferenceID != nil {
		out.ReferenceId = n.ReferenceID.String()
	}
	return out
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
