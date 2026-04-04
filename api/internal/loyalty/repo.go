package loyalty

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/berberim/api/internal/txctx"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

// RunInTx begins a transaction, stores it in ctx, calls fn, and commits or rolls back.
func (r *Repo) RunInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return txctx.RunInTx(ctx, r.db, fn)
}

// dbForCtx returns the transaction stored in ctx, or the base db if none.
func (r *Repo) dbForCtx(ctx context.Context) *gorm.DB {
	return txctx.DBForCtx(ctx, r.db)
}

// GetWallet returns the wallet for a customer, or gorm.ErrRecordNotFound if none.
func (r *Repo) GetWallet(ctx context.Context, tenantID, customerID uuid.UUID) (*Wallet, error) {
	var w Wallet
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND customer_id = ?", tenantID, customerID).
		First(&w).Error
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// UpsertWalletPoints atomically adds delta points to the wallet, creating it if necessary.
// Returns the updated wallet. Participates in the transaction stored in ctx, if any.
func (r *Repo) UpsertWalletPoints(ctx context.Context, tenantID, customerID uuid.UUID, delta int) (*Wallet, error) {
	wallet := &Wallet{
		ID:                   uuid.New(),
		TenantID:             tenantID,
		CustomerID:           customerID,
		CurrentPoints:        delta,
		LifetimeEarnedPoints: max(delta, 0),
		LifetimeSpentPoints:  max(-delta, 0),
	}
	err := r.dbForCtx(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "tenant_id"}, {Name: "customer_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"current_points":         gorm.Expr("loyalty_wallets.current_points + ?", delta),
				"lifetime_earned_points": gorm.Expr("loyalty_wallets.lifetime_earned_points + ?", max(delta, 0)),
				"lifetime_spent_points":  gorm.Expr("loyalty_wallets.lifetime_spent_points + ?", max(-delta, 0)),
				"updated_at":             gorm.Expr("now()"),
			}),
		}).Create(wallet).Error
	if err != nil {
		return nil, err
	}
	// Re-fetch to get the actual current values after upsert.
	return r.GetWallet(ctx, tenantID, customerID)
}

// CreateTransaction records a loyalty transaction. Participates in the transaction stored in ctx, if any.
func (r *Repo) CreateTransaction(ctx context.Context, t *Transaction) error {
	return r.dbForCtx(ctx).Create(t).Error
}
