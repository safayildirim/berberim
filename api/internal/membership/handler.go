package membership

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

// ── Customer-facing RPCs ─────────────────────────────────────────────────────

func (h *Handler) ListCustomerTenants(ctx context.Context, _ *berberimv1.ListCustomerTenantsRequest) (*berberimv1.ListCustomerTenantsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	tenants, err := h.svc.ListCustomerTenants(ctx, rc.UserID)
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.CustomerTenantMembership, 0, len(tenants))
	for _, t := range tenants {
		out = append(out, membershipWithTenantToProto(&t))
	}
	return &berberimv1.ListCustomerTenantsResponse{Tenants: out}, nil
}

func (h *Handler) ClaimLinkCode(ctx context.Context, req *berberimv1.ClaimLinkCodeRequest) (*berberimv1.ClaimLinkCodeResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if req.Code == "" {
		return nil, status.Error(codes.InvalidArgument, "code is required")
	}
	m, err := h.svc.ClaimLinkCode(ctx, rc.UserID, req.Code)
	if err != nil {
		return nil, err
	}
	return &berberimv1.ClaimLinkCodeResponse{Membership: membershipWithTenantToProto(m)}, nil
}

// ── Tenant admin-facing RPCs ─────────────────────────────────────────────────

func (h *Handler) GenerateLinkCode(ctx context.Context, req *berberimv1.GenerateLinkCodeRequest) (*berberimv1.GenerateLinkCodeResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	lc, err := h.svc.GenerateLinkCode(ctx, rc.TenantID, rc.UserID, int(req.MaxUses), int(req.ExpiresInHours))
	if err != nil {
		return nil, err
	}
	return &berberimv1.GenerateLinkCodeResponse{
		Id:        lc.ID.String(),
		Code:      lc.Code,
		ExpiresAt: lc.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"),
		MaxUses:   int32(lc.MaxUses),
	}, nil
}

func (h *Handler) ListLinkCodes(ctx context.Context, _ *berberimv1.ListLinkCodesRequest) (*berberimv1.ListLinkCodesResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	linkCodes, err := h.svc.ListLinkCodes(ctx, rc.TenantID)
	if err != nil {
		return nil, err
	}
	out := make([]*berberimv1.LinkCode, 0, len(linkCodes))
	for _, lc := range linkCodes {
		p := &berberimv1.LinkCode{
			Id:              lc.ID.String(),
			Code:            lc.Code,
			MaxUses:         int32(lc.MaxUses),
			CurrentUses:     int32(lc.CurrentUses),
			ExpiresAt:       lc.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z"),
			CreatedAt:       lc.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
			CreatedByUserId: lc.CreatedByUserID.String(),
		}
		if lc.RevokedAt != nil {
			p.RevokedAt = lc.RevokedAt.UTC().Format("2006-01-02T15:04:05Z")
		}
		out = append(out, p)
	}
	return &berberimv1.ListLinkCodesResponse{Codes: out}, nil
}

func (h *Handler) RevokeLinkCode(ctx context.Context, req *berberimv1.RevokeLinkCodeRequest) (*berberimv1.RevokeLinkCodeResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	linkCodeID, err := uuid.Parse(req.LinkCodeId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid link_code_id: %v", err)
	}
	if err := h.svc.RevokeLinkCode(ctx, rc.TenantID, linkCodeID, rc.UserID); err != nil {
		return nil, err
	}
	return &berberimv1.RevokeLinkCodeResponse{}, nil
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func membershipWithTenantToProto(m *MembershipWithTenant) *berberimv1.CustomerTenantMembership {
	p := &berberimv1.CustomerTenantMembership{
		TenantId: m.TenantID.String(),
		Name:     m.TenantName,
		Slug:     m.TenantSlug,
		Status:   m.Status,
		JoinedAt: m.JoinedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
	if m.LogoURL != nil {
		p.LogoUrl = *m.LogoURL
	}
	return p
}
