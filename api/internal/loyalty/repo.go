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

// ── Rewards ──────────────────────────────────────────────────────────────────

func (r *Repo) ListRewards(ctx context.Context, tenantID uuid.UUID, activeOnly bool) ([]Reward, error) {
	q := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("created_at DESC")
	if activeOnly {
		q = q.Where("is_active = true")
	}
	var rewards []Reward
	err := q.Find(&rewards).Error
	return rewards, err
}

func (r *Repo) GetReward(ctx context.Context, tenantID uuid.UUID, rewardID uuid.UUID) (*Reward, error) {
	var rw Reward
	err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", rewardID, tenantID).First(&rw).Error
	return &rw, err
}

func (r *Repo) CreateReward(ctx context.Context, rw *Reward) error {
	return r.db.WithContext(ctx).Create(rw).Error
}

func (r *Repo) UpdateReward(ctx context.Context, tenantID, rewardID uuid.UUID, updates map[string]any) (*Reward, error) {
	if err := r.db.WithContext(ctx).Model(&Reward{}).
		Where("id = ? AND tenant_id = ?", rewardID, tenantID).
		Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.GetReward(ctx, tenantID, rewardID)
}

func (r *Repo) DeleteReward(ctx context.Context, tenantID, rewardID uuid.UUID) error {
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", rewardID, tenantID).Delete(&Reward{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ListTransactions returns paginated loyalty transactions for a customer at a tenant.
func (r *Repo) ListTransactions(ctx context.Context, tenantID, customerID uuid.UUID, page, pageSize int) ([]Transaction, int64, error) {
	if pageSize < 1 {
		pageSize = 20
	}
	if page < 1 {
		page = 1
	}

	var total int64
	if err := r.db.WithContext(ctx).
		Model(&Transaction{}).
		Where("tenant_id = ? AND customer_id = ?", tenantID, customerID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var txns []Transaction
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND customer_id = ?", tenantID, customerID).
		Order("created_at DESC").
		Limit(pageSize).
		Offset((page - 1) * pageSize).
		Find(&txns).Error

	return txns, total, err
}
