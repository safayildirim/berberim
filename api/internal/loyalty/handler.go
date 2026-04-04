package loyalty

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Handler is a thin gRPC bridge — parse → call service → marshal.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetLoyaltyBalance(ctx context.Context, req *berberimv1.GetLoyaltyBalanceRequest) (*berberimv1.GetLoyaltyBalanceResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	// Customer ID: from JWT for customer surface; from request body for staff/admin.
	customerID := rc.UserID
	if rc.TokenType != "customer" && req.CustomerId != "" {
		customerID, err = uuid.Parse(req.CustomerId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid customer_id")
		}
	}

	wallet, err := h.svc.GetBalance(ctx, rc.TenantID, customerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get balance: %v", err)
	}

	return &berberimv1.GetLoyaltyBalanceResponse{
		CurrentPoints:        int32(wallet.CurrentPoints),
		LifetimeEarnedPoints: int32(wallet.LifetimeEarnedPoints),
		LifetimeSpentPoints:  int32(wallet.LifetimeSpentPoints),
	}, nil
}
