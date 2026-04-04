package customer

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) List(ctx context.Context, tenantID uuid.UUID, status, search string, page, pageSize int) ([]Customer, int64, error) {
	if pageSize < 1 {
		pageSize = 20
	}
	if page < 1 {
		page = 1
	}

	// Build WHERE conditions for the count and data queries.
	where := "c.tenant_id = ?"
	args := []interface{}{tenantID}
	if status != "" {
		where += " AND c.status = ?"
		args = append(args, status)
	}
	if search != "" {
		like := "%" + search + "%"
		where += " AND (c.phone_number LIKE ? OR c.first_name ILIKE ? OR c.last_name ILIKE ?)"
		args = append(args, like, like, like)
	}

	var total int64
	if err := r.db.WithContext(ctx).Raw(
		"SELECT COUNT(*) FROM customers c WHERE "+where, args...,
	).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	dataArgs := append(args, pageSize, (page-1)*pageSize)
	var customers []Customer
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			c.id, c.tenant_id, c.phone_number, c.first_name, c.last_name,
			c.avatar_url, c.status, c.created_at, c.updated_at,
			COUNT(a.id) FILTER (WHERE a.status = 'completed') AS total_completed_appointments,
			MAX(a.starts_at)                                   AS last_appointment_at,
			COALESCE(lw.current_points, 0)                     AS loyalty_points
		FROM customers c
		LEFT JOIN appointments a  ON a.customer_id = c.id AND a.tenant_id = c.tenant_id
		LEFT JOIN loyalty_wallets lw ON lw.customer_id = c.id AND lw.tenant_id = c.tenant_id
		WHERE `+where+`
		GROUP BY c.id, lw.current_points
		ORDER BY c.created_at DESC
		LIMIT ? OFFSET ?
	`, dataArgs...).Scan(&customers).Error

	return customers, total, err
}

func (r *Repo) GetByID(ctx context.Context, tenantID, customerID uuid.UUID) (*Customer, error) {
	var c Customer
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			c.id, c.tenant_id, c.phone_number, c.first_name, c.last_name,
			c.avatar_url, c.status, c.created_at, c.updated_at,
			COUNT(a.id) FILTER (WHERE a.status = 'completed') AS total_completed_appointments,
			MAX(a.starts_at)                                   AS last_appointment_at,
			COALESCE(lw.current_points, 0)                     AS loyalty_points
		FROM customers c
		LEFT JOIN appointments a  ON a.customer_id = c.id AND a.tenant_id = c.tenant_id
		LEFT JOIN loyalty_wallets lw ON lw.customer_id = c.id AND lw.tenant_id = c.tenant_id
		WHERE c.id = ? AND c.tenant_id = ?
		GROUP BY c.id, lw.current_points
	`, customerID, tenantID).Scan(&c).Error
	if c.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &c, err
}

func (r *Repo) UpdateStatus(ctx context.Context, tenantID, customerID uuid.UUID, status string) error {
	result := r.db.WithContext(ctx).Model(&Customer{}).
		Where("id = ? AND tenant_id = ?", customerID, tenantID).
		Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repo) Update(ctx context.Context, tenantID, customerID uuid.UUID, updates map[string]any) (*Customer, error) {
	if err := r.db.WithContext(ctx).Model(&Customer{}).
		Where("id = ? AND tenant_id = ?", customerID, tenantID).
		Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.GetByID(ctx, tenantID, customerID)
}
