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
	where := "m.tenant_id = ?"
	args := []interface{}{tenantID}
	if status != "" {
		where += " AND m.status = ?"
		args = append(args, status)
	} else {
		where += " AND m.status = 'active'"
	}
	if search != "" {
		like := "%" + search + "%"
		where += " AND (c.phone_number LIKE ? OR c.first_name ILIKE ? OR c.last_name ILIKE ?)"
		args = append(args, like, like, like)
	}

	var total int64
	if err := r.db.WithContext(ctx).Raw(
		`SELECT COUNT(*) FROM customers c
		 JOIN customer_tenant_memberships m ON m.customer_id = c.id
		 WHERE `+where, args...,
	).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	dataArgs := append(args, pageSize, (page-1)*pageSize)
	var customers []Customer
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			c.id, c.phone_number, c.first_name, c.last_name,
			c.avatar_key, c.status, c.created_at, c.updated_at,
			m.status AS membership_status,
			m.joined_at,
			p.notes_internal,
			COUNT(a.id) FILTER (WHERE a.status = 'completed') AS total_completed_appointments,
			MAX(a.starts_at)                                   AS last_appointment_at,
			COALESCE(lw.current_points, 0)                     AS loyalty_points
		FROM customers c
		JOIN customer_tenant_memberships m ON m.customer_id = c.id AND m.tenant_id = ?
		LEFT JOIN tenant_customer_profiles p ON p.membership_id = m.id
		LEFT JOIN appointments a  ON a.customer_id = c.id AND a.tenant_id = m.tenant_id
		LEFT JOIN loyalty_wallets lw ON lw.customer_id = c.id AND lw.tenant_id = m.tenant_id
		WHERE `+where+`
		GROUP BY c.id, m.id, p.membership_id, lw.current_points
		ORDER BY m.joined_at DESC
		LIMIT ? OFFSET ?
	`, append([]interface{}{tenantID}, dataArgs...)...).Scan(&customers).Error

	return customers, total, err
}

func (r *Repo) GetByID(ctx context.Context, tenantID, customerID uuid.UUID) (*Customer, error) {
	var c Customer
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			c.id, c.phone_number, c.first_name, c.last_name,
			c.avatar_key, c.status, c.created_at, c.updated_at,
			m.status AS membership_status,
			m.joined_at,
			p.notes_internal,
			COUNT(a.id) FILTER (WHERE a.status = 'completed') AS total_completed_appointments,
			MAX(a.starts_at)                                   AS last_appointment_at,
			COALESCE(lw.current_points, 0)                     AS loyalty_points
		FROM customers c
		JOIN customer_tenant_memberships m ON m.customer_id = c.id AND m.tenant_id = ?
		LEFT JOIN tenant_customer_profiles p ON p.membership_id = m.id
		LEFT JOIN appointments a  ON a.customer_id = c.id AND a.tenant_id = ?
		LEFT JOIN loyalty_wallets lw ON lw.customer_id = c.id AND lw.tenant_id = ?
		WHERE c.id = ?
		GROUP BY c.id, m.id, p.membership_id, lw.current_points
	`, tenantID, tenantID, tenantID, customerID).Scan(&c).Error
	if c.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &c, err
}

// GetGlobalByID fetches the global customer record without tenant-scoped data.
func (r *Repo) GetGlobalByID(ctx context.Context, customerID uuid.UUID) (*Customer, error) {
	var c Customer
	err := r.db.WithContext(ctx).Raw(`
		SELECT id, phone_number, first_name, last_name, avatar_key, status, created_at, updated_at
		FROM customers
		WHERE id = ?
	`, customerID).Scan(&c).Error
	if c.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &c, err
}

// GetAvatarKey satisfies the avatar.AvatarRepo interface.
// tenantID is ignored — customer avatars are global.
func (r *Repo) GetAvatarKey(ctx context.Context, _ /* tenantID */, customerID uuid.UUID) (string, error) {
	var avatarKey *string
	err := r.db.WithContext(ctx).Raw(`SELECT avatar_key FROM customers WHERE id = ?`, customerID).Scan(&avatarKey).Error
	if err != nil {
		return "", err
	}
	if avatarKey != nil {
		return *avatarKey, nil
	}
	return "", nil
}

// SetAvatarKey satisfies the avatar.AvatarRepo interface.
// tenantID is ignored — customer avatars are global.
func (r *Repo) SetAvatarKey(ctx context.Context, _ /* tenantID */, customerID uuid.UUID, avatarKey string) error {
	return r.db.WithContext(ctx).
		Table("customers").
		Where("id = ?", customerID).
		Update("avatar_key", avatarKey).Error
}

func (r *Repo) Update(ctx context.Context, customerID uuid.UUID, updates map[string]any) error {
	return r.db.WithContext(ctx).
		Table("customers").
		Where("id = ?", customerID).
		Updates(updates).Error
}
