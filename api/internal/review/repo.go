package review

import (
	"context"
	"errors"

	"github.com/berberim/api/internal/txctx"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
)

var ErrDuplicateReview = errors.New("review already exists for this appointment")

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) dbForCtx(ctx context.Context) *gorm.DB {
	return txctx.DBForCtx(ctx, r.db)
}

func (r *Repo) RunInTx(ctx context.Context, fn func(ctx context.Context) error) error {
	return txctx.RunInTx(ctx, r.db, fn)
}

func (r *Repo) Create(ctx context.Context, rev *Review) error {
	if err := r.dbForCtx(ctx).Create(rev).Error; err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDuplicateReview
		}
		return err
	}
	return nil
}

func (r *Repo) GetByID(ctx context.Context, tenantID, reviewID uuid.UUID) (*Review, error) {
	var rev Review
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, reviewID).
		First(&rev).Error
	return &rev, err
}

func (r *Repo) GetByAppointmentAndCustomer(ctx context.Context, tenantID, appointmentID, customerID uuid.UUID) (*Review, error) {
	var rev Review
	err := r.dbForCtx(ctx).
		Where("tenant_id = ? AND appointment_id = ? AND customer_id = ?", tenantID, appointmentID, customerID).
		First(&rev).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &rev, err
}

func (r *Repo) Update(ctx context.Context, tenantID, reviewID uuid.UUID, updates map[string]any) (*Review, error) {
	if err := r.dbForCtx(ctx).Model(&Review{}).
		Where("tenant_id = ? AND id = ?", tenantID, reviewID).
		Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.GetByID(ctx, tenantID, reviewID)
}

func (r *Repo) Delete(ctx context.Context, tenantID, reviewID, customerID uuid.UUID) error {
	result := r.dbForCtx(ctx).
		Where("tenant_id = ? AND id = ? AND customer_id = ?", tenantID, reviewID, customerID).
		Delete(&Review{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repo) ListByStaff(ctx context.Context, tenantID, staffUserID uuid.UUID, page, pageSize int) ([]Review, int64, error) {
	if pageSize < 1 {
		pageSize = 20
	}
	if page < 1 {
		page = 1
	}

	var total int64
	if err := r.dbForCtx(ctx).Model(&Review{}).
		Where("tenant_id = ? AND staff_user_id = ?", tenantID, staffUserID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var reviews []Review
	err := r.dbForCtx(ctx).
		Table("staff_reviews sr").
		Select(`sr.*,
			CASE WHEN sr.is_anonymous THEN ''
			     ELSE TRIM(CONCAT(c.first_name, ' ', c.last_name))
			END AS customer_name`).
		Joins("LEFT JOIN customers c ON c.id = sr.customer_id").
		Where("sr.tenant_id = ? AND sr.staff_user_id = ?", tenantID, staffUserID).
		Order("sr.created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&reviews).Error
	return reviews, total, err
}

func (r *Repo) GetAppointmentForReview(ctx context.Context, tenantID, appointmentID uuid.UUID) (*ReviewAppointment, error) {
	var a ReviewAppointment
	err := r.dbForCtx(ctx).
		Table("appointments").
		Select("id, customer_id, staff_user_id, status").
		Where("tenant_id = ? AND id = ?", tenantID, appointmentID).
		First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}
