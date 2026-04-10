package loyalty

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Service struct {
	repo *Repo
	log  *zap.Logger
}

func NewService(repo *Repo, log *zap.Logger) *Service {
	return &Service{repo: repo, log: log}
}

// AwardPoints adds points to a customer's wallet and records the transaction.
func (s *Service) AwardPoints(ctx context.Context, tenantID, customerID, appointmentID uuid.UUID, pointsReward int) error {
	if pointsReward <= 0 {
		return nil
	}

	return s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		wallet, err := s.repo.UpsertWalletPoints(txCtx, tenantID, customerID, pointsReward)
		if err != nil {
			return fmt.Errorf("upsert wallet: %w", err)
		}

		apptIDPtr := &appointmentID
		t := &Transaction{
			ID:            uuid.New(),
			TenantID:      tenantID,
			CustomerID:    customerID,
			AppointmentID: apptIDPtr,
			Type:          "earn",
			Points:        pointsReward,
			BalanceAfter:  wallet.CurrentPoints,
			Reason:        "appointment completed and payment received",
			CreatedByType: "system",
		}
		if err := s.repo.CreateTransaction(txCtx, t); err != nil {
			return fmt.Errorf("create transaction: %w", err)
		}
		return nil
	})
}

// GetBalance returns the loyalty wallet for a customer.
// Returns a zero-value Wallet (not an error) when no wallet exists yet.
func (s *Service) GetBalance(ctx context.Context, tenantID, customerID uuid.UUID) (*Wallet, error) {
	wallet, err := s.repo.GetWallet(ctx, tenantID, customerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &Wallet{}, nil
		}
		return nil, fmt.Errorf("get wallet: %w", err)
	}
	return wallet, nil
}

// ListTransactions returns paginated loyalty transactions for a customer at a tenant.
func (s *Service) ListTransactions(ctx context.Context, tenantID, customerID uuid.UUID, page, pageSize int) ([]Transaction, int64, error) {
	return s.repo.ListTransactions(ctx, tenantID, customerID, page, pageSize)
}

// ── Rewards ──────────────────────────────────────────────────────────────────

func (s *Service) ListRewards(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]Reward, error) {
	return s.repo.ListRewards(ctx, tenantID, activeOnly)
}

func (s *Service) GetReward(ctx context.Context, tenantID, rewardID uuid.UUID) (*Reward, error) {
	return s.repo.GetReward(ctx, tenantID, rewardID)
}

func (s *Service) CreateReward(ctx context.Context, rw *Reward) error {
	rw.ID = uuid.New()
	return s.repo.CreateReward(ctx, rw)
}

func (s *Service) UpdateReward(ctx context.Context, tenantID, rewardID uuid.UUID, updates map[string]any) (*Reward, error) {
	return s.repo.UpdateReward(ctx, tenantID, rewardID, updates)
}

func (s *Service) DeleteReward(ctx context.Context, tenantID, rewardID uuid.UUID) error {
	return s.repo.DeleteReward(ctx, tenantID, rewardID)
}

func (s *Service) SetRewardStatus(ctx context.Context, tenantID, rewardID uuid.UUID, isActive bool) (*Reward, error) {
	return s.repo.UpdateReward(ctx, tenantID, rewardID, map[string]any{"is_active": isActive})
}

// ── Ensure Service satisfies the appointment.LoyaltyService interface at compile time.
var _ interface {
	AwardPoints(ctx context.Context, tenantID, customerID, appointmentID uuid.UUID, pointsReward int) error
} = (*Service)(nil)
