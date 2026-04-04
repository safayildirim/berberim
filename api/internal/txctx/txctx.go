package txctx

import (
	"context"

	"gorm.io/gorm"
)

type key struct{}

// WithTx returns a new context carrying the given GORM transaction.
func WithTx(ctx context.Context, tx *gorm.DB) context.Context {
	return context.WithValue(ctx, key{}, tx)
}

// FromContext retrieves the GORM transaction stored in ctx, if any.
func FromContext(ctx context.Context) (*gorm.DB, bool) {
	tx, ok := ctx.Value(key{}).(*gorm.DB)
	return tx, ok
}

// DBForCtx returns the transaction stored in ctx, or the base db if none.
func DBForCtx(ctx context.Context, db *gorm.DB) *gorm.DB {
	if tx, ok := FromContext(ctx); ok {
		return tx.WithContext(ctx)
	}
	return db.WithContext(ctx)
}

// RunInTx begins a transaction, stores it in ctx, calls fn, and commits or rolls back.
func RunInTx(ctx context.Context, db *gorm.DB, fn func(ctx context.Context) error) error {
	tx := db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()
	if err := fn(WithTx(ctx, tx)); err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit().Error
}
