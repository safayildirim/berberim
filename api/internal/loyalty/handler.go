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

// ── Rewards ──────────────────────────────────────────────────────────────────

func (h *Handler) ListRewards(ctx context.Context, req *berberimv1.ListRewardsRequest) (*berberimv1.ListRewardsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	rewards, err := h.svc.ListRewards(ctx, rc.TenantID, req.ActiveOnly)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list rewards: %v", err)
	}
	out := make([]*berberimv1.Reward, 0, len(rewards))
	for _, r := range rewards {
		out = append(out, rewardToProto(&r))
	}
	return &berberimv1.ListRewardsResponse{Rewards: out}, nil
}

func (h *Handler) CreateReward(ctx context.Context, req *berberimv1.CreateRewardRequest) (*berberimv1.CreateRewardResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	rw := &Reward{
		TenantID:   rc.TenantID,
		Title:      req.Title,
		PointsCost: int(req.PointsCost),
		IsActive:   true,
	}
	if req.Description != "" {
		rw.Description = &req.Description
	}
	if err := h.svc.CreateReward(ctx, rw); err != nil {
		return nil, status.Errorf(codes.Internal, "create reward: %v", err)
	}
	return &berberimv1.CreateRewardResponse{Reward: rewardToProto(rw)}, nil
}

func (h *Handler) GetReward(ctx context.Context, req *berberimv1.GetRewardRequest) (*berberimv1.GetRewardResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	rewardID, err := uuid.Parse(req.RewardId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid reward_id")
	}
	rw, err := h.svc.GetReward(ctx, rc.TenantID, rewardID)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "reward not found")
	}
	return &berberimv1.GetRewardResponse{Reward: rewardToProto(rw)}, nil
}

func (h *Handler) UpdateReward(ctx context.Context, req *berberimv1.UpdateRewardRequest) (*berberimv1.UpdateRewardResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	rewardID, err := uuid.Parse(req.RewardId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid reward_id")
	}
	updates := map[string]any{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.PointsCost > 0 {
		updates["points_cost"] = int(req.PointsCost)
	}
	rw, err := h.svc.UpdateReward(ctx, rc.TenantID, rewardID, updates)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "update reward: %v", err)
	}
	return &berberimv1.UpdateRewardResponse{Reward: rewardToProto(rw)}, nil
}

func (h *Handler) DeleteReward(ctx context.Context, req *berberimv1.DeleteRewardRequest) (*berberimv1.DeleteRewardResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	rewardID, err := uuid.Parse(req.RewardId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid reward_id")
	}
	if err := h.svc.DeleteReward(ctx, rc.TenantID, rewardID); err != nil {
		return nil, status.Errorf(codes.Internal, "delete reward: %v", err)
	}
	return &berberimv1.DeleteRewardResponse{}, nil
}

func (h *Handler) SetRewardStatus(ctx context.Context, req *berberimv1.SetRewardStatusRequest) (*berberimv1.SetRewardStatusResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}
	rewardID, err := uuid.Parse(req.RewardId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid reward_id")
	}
	_, err = h.svc.SetRewardStatus(ctx, rc.TenantID, rewardID, req.IsActive)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "set reward status: %v", err)
	}
	return &berberimv1.SetRewardStatusResponse{}, nil
}

func rewardToProto(r *Reward) *berberimv1.Reward {
	p := &berberimv1.Reward{
		Id:         r.ID.String(),
		Title:      r.Title,
		PointsCost: int32(r.PointsCost),
		IsActive:   r.IsActive,
		CreatedAt:  r.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  r.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	}
	if r.Description != nil {
		p.Description = *r.Description
	}
	return p
}

// ── Transactions ─────────────────────────────────────────────────────────────

func (h *Handler) GetLoyaltyTransactions(ctx context.Context, req *berberimv1.GetLoyaltyTransactionsRequest) (*berberimv1.GetLoyaltyTransactionsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	txns, total, err := h.svc.ListTransactions(ctx, rc.TenantID, rc.UserID, int(req.Page), int(req.PageSize))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list transactions: %v", err)
	}

	out := make([]*berberimv1.LoyaltyTransaction, 0, len(txns))
	for _, t := range txns {
		lt := &berberimv1.LoyaltyTransaction{
			Id:           t.ID.String(),
			Type:         t.Type,
			Points:       int32(t.Points),
			BalanceAfter: int32(t.BalanceAfter),
			Reason:       t.Reason,
			CreatedAt:    t.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		}
		if t.AppointmentID != nil {
			lt.AppointmentId = t.AppointmentID.String()
		}
		out = append(out, lt)
	}

	return &berberimv1.GetLoyaltyTransactionsResponse{
		Transactions: out,
		Total:        int32(total),
	}, nil
}
