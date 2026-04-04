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

// ── Ensure Service satisfies the appointment.LoyaltyService interface at compile time.
var _ interface {
	AwardPoints(ctx context.Context, tenantID, customerID, appointmentID uuid.UUID, pointsReward int) error
} = (*Service)(nil)
