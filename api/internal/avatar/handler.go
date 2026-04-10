package avatar

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
)

// Handler is a thin gRPC bridge for avatar upload operations.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GenerateCustomerAvatarUploadURL(ctx context.Context, req *berberimv1.GenerateAvatarUploadURLRequest) (*berberimv1.GenerateAvatarUploadURLResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	uploadURL, objectKey, err := h.svc.GenerateUploadURL(ctx, req.ContentType, req.FileSize)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GenerateAvatarUploadURLResponse{
		UploadUrl: uploadURL,
		ObjectKey: objectKey,
	}, nil
}

func (h *Handler) ConfirmCustomerAvatarUpload(ctx context.Context, req *berberimv1.ConfirmAvatarUploadRequest) (*berberimv1.ConfirmAvatarUploadResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	avatarURL, err := h.svc.ConfirmUpload(ctx, UserTypeCustomer, rc.TenantID, rc.UserID, req.ObjectKey)
	if err != nil {
		return nil, err
	}
	return &berberimv1.ConfirmAvatarUploadResponse{AvatarUrl: avatarURL}, nil
}

func (h *Handler) GenerateStaffAvatarUploadURL(ctx context.Context, req *berberimv1.GenerateAvatarUploadURLRequest) (*berberimv1.GenerateAvatarUploadURLResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	uploadURL, objectKey, err := h.svc.GenerateUploadURL(ctx, req.ContentType, req.FileSize)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GenerateAvatarUploadURLResponse{
		UploadUrl: uploadURL,
		ObjectKey: objectKey,
	}, nil
}

func (h *Handler) ConfirmStaffAvatarUpload(ctx context.Context, req *berberimv1.ConfirmAvatarUploadRequest) (*berberimv1.ConfirmAvatarUploadResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	avatarURL, err := h.svc.ConfirmUpload(ctx, UserTypeStaff, rc.TenantID, rc.UserID, req.ObjectKey)
	if err != nil {
		return nil, err
	}
	return &berberimv1.ConfirmAvatarUploadResponse{AvatarUrl: avatarURL}, nil
}
