package customer

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/config"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Handler is a thin gRPC bridge — parse → call service → marshal.
// No business logic lives here.
type Handler struct {
	avatarCfg *config.AvatarConfig
	svc       *Service
}

func NewHandler(avatarCfg *config.AvatarConfig, svc *Service) *Handler {
	return &Handler{avatarCfg: avatarCfg, svc: svc}
}

func (h *Handler) GetCustomerProfile(ctx context.Context, _ *berberimv1.GetCustomerProfileRequest) (*berberimv1.GetCustomerProfileResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	c, err := h.svc.GetProfile(ctx, rc.TenantID, rc.UserID)
	if err != nil {
		return nil, err
	}

	return &berberimv1.GetCustomerProfileResponse{Profile: h.customerToProto(c)}, nil
}

func (h *Handler) UpdateCustomerProfile(ctx context.Context, req *berberimv1.UpdateCustomerProfileRequest) (*berberimv1.UpdateCustomerProfileResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	c, err := h.svc.UpdateProfile(ctx, rc.TenantID, rc.UserID, UpdateProfileRequest{
		FirstName: req.FirstName,
		LastName:  req.LastName,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateCustomerProfileResponse{Profile: h.customerToProto(c)}, nil
}

func (h *Handler) ListCustomers(ctx context.Context, req *berberimv1.ListCustomersRequest) (*berberimv1.ListCustomersResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	pageSize := int(req.PageSize)
	if pageSize < 1 {
		pageSize = 20
	}
	page := int(req.Page)
	if page < 1 {
		page = 1
	}
	customers, total, err := h.svc.repo.List(ctx, rc.TenantID, req.Status, req.Search, page, pageSize)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list customers: %v", err)
	}
	out := make([]*berberimv1.Customer, 0, len(customers))
	for i := range customers {
		out = append(out, h.customerToProto(&customers[i]))
	}
	return &berberimv1.ListCustomersResponse{
		Customers: out,
		Total:     int32(total),
	}, nil
}

// ── Admin Customer RPCs ──────────────────────────────────────────────────────

func (h *Handler) GetAdminCustomer(ctx context.Context, req *berberimv1.GetAdminCustomerRequest) (*berberimv1.GetAdminCustomerResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	customerID, err := uuid.Parse(req.CustomerId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid customer_id: %v", err)
	}
	c, err := h.svc.GetProfile(ctx, rc.TenantID, customerID)
	if err != nil {
		return nil, err
	}
	return &berberimv1.GetAdminCustomerResponse{Customer: h.customerToProto(c)}, nil
}

func (h *Handler) UpdateCustomer(ctx context.Context, req *berberimv1.UpdateCustomerRequest) (*berberimv1.UpdateCustomerResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	customerID, err := uuid.Parse(req.CustomerId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid customer_id: %v", err)
	}
	c, err := h.svc.UpdateCustomer(ctx, rc.TenantID, customerID, UpdateProfileRequest{
		FirstName: req.FirstName,
		LastName:  req.LastName,
	})
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateCustomerResponse{Customer: h.customerToProto(c)}, nil
}

func (h *Handler) SetCustomerStatus(ctx context.Context, req *berberimv1.SetCustomerStatusRequest) (*berberimv1.SetCustomerStatusResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	customerID, err := uuid.Parse(req.CustomerId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid customer_id: %v", err)
	}
	if err := h.svc.SetCustomerStatus(ctx, rc.TenantID, customerID, req.Status); err != nil {
		return nil, err
	}
	return &berberimv1.SetCustomerStatusResponse{}, nil
}

func (h *Handler) customerToProto(c *Customer) *berberimv1.Customer {
	p := &berberimv1.Customer{
		Id:                         c.ID.String(),
		PhoneNumber:                c.PhoneNumber,
		Status:                     c.Status,
		TotalCompletedAppointments: int32(c.TotalCompletedAppointments),
		LoyaltyPoints:              int32(c.LoyaltyPoints),
		CreatedAt:                  c.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
	if c.FirstName != nil {
		p.FirstName = *c.FirstName
	}
	if c.LastName != nil {
		p.LastName = *c.LastName
	}
	if c.AvatarKey != nil {
		p.AvatarUrl = h.avatarCfg.PublicURL(*c.AvatarKey)
	}
	if c.LastAppointmentAt != nil {
		p.LastAppointmentAt = c.LastAppointmentAt.UTC().Format("2006-01-02T15:04:05Z")
	}
	return p
}
