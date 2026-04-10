package membership

import (
	"context"
	"crypto/rand"
	"math/big"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const linkCodeCharset = "ABCDEFGHJKMNPQRSTUVWXYZ2345679"

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

// ── Link codes ───────────────────────────────────────────────────────────────

func (r *Repo) GenerateLinkCode(ctx context.Context, lc *LinkCode) error {
	lc.Code = generateCode()
	return r.db.WithContext(ctx).Create(lc).Error
}

func (r *Repo) ListLinkCodes(ctx context.Context, tenantID uuid.UUID) ([]LinkCode, error) {
	var codes []LinkCode
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&codes).Error
	return codes, err
}

func (r *Repo) RevokeLinkCode(ctx context.Context, tenantID, linkCodeID, revokedByUserID uuid.UUID) error {
	now := time.Now()
	result := r.db.WithContext(ctx).
		Model(&LinkCode{}).
		Where("id = ? AND tenant_id = ? AND revoked_at IS NULL", linkCodeID, tenantID).
		Updates(map[string]any{
			"revoked_at":         now,
			"revoked_by_user_id": revokedByUserID,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ClaimLinkCode atomically consumes a use of the code and returns the code row.
// Returns gorm.ErrRecordNotFound if the code is invalid, expired, revoked, or exhausted.
func (r *Repo) ClaimLinkCode(ctx context.Context, code string) (*LinkCode, error) {
	var lc LinkCode
	err := r.db.WithContext(ctx).Raw(`
		UPDATE tenant_link_codes
		SET current_uses = current_uses + 1
		WHERE code = ?
		  AND revoked_at IS NULL
		  AND expires_at > now()
		  AND current_uses < max_uses
		RETURNING *
	`, code).Scan(&lc).Error
	if err != nil {
		return nil, err
	}
	if lc.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	return &lc, nil
}

// ── Memberships ──────────────────────────────────────────────────────────────

func (r *Repo) UpsertMembership(ctx context.Context, m *Membership) error {
	return r.db.WithContext(ctx).Exec(`
		INSERT INTO customer_tenant_memberships (id, customer_id, tenant_id, status, link_code_id, joined_at, created_at, updated_at)
		VALUES (?, ?, ?, 'active', ?, now(), now(), now())
		ON CONFLICT (customer_id, tenant_id) DO UPDATE SET
			status = 'active',
			link_code_id = COALESCE(EXCLUDED.link_code_id, customer_tenant_memberships.link_code_id),
			disabled_at = NULL,
			updated_at = now()
	`, m.ID, m.CustomerID, m.TenantID, m.LinkCodeID).Error
}

func (r *Repo) GetMembership(ctx context.Context, customerID, tenantID uuid.UUID) (*Membership, error) {
	var m Membership
	err := r.db.WithContext(ctx).
		Where("customer_id = ? AND tenant_id = ?", customerID, tenantID).
		First(&m).Error
	return &m, err
}

func (r *Repo) HasActiveMembership(ctx context.Context, customerID, tenantID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.WithContext(ctx).Raw(
		`SELECT EXISTS(SELECT 1 FROM customer_tenant_memberships WHERE customer_id = ? AND tenant_id = ? AND status = 'active')`,
		customerID, tenantID,
	).Scan(&exists).Error
	return exists, err
}

func (r *Repo) SetMembershipStatus(ctx context.Context, customerID, tenantID uuid.UUID, status string) error {
	updates := map[string]any{"status": status, "updated_at": time.Now()}
	if status == "disabled" {
		updates["disabled_at"] = time.Now()
	} else {
		updates["disabled_at"] = nil
	}
	result := r.db.WithContext(ctx).
		Model(&Membership{}).
		Where("customer_id = ? AND tenant_id = ?", customerID, tenantID).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ListCustomerTenants returns all tenants a customer is linked to.
func (r *Repo) ListCustomerTenants(ctx context.Context, customerID uuid.UUID) ([]MembershipWithTenant, error) {
	var results []MembershipWithTenant
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			m.tenant_id,
			t.name AS tenant_name,
			t.slug AS tenant_slug,
			tb.logo_url,
			m.status,
			m.joined_at
		FROM customer_tenant_memberships m
		JOIN tenants t ON t.id = m.tenant_id
		LEFT JOIN tenant_brandings tb ON tb.tenant_id = t.id
		WHERE m.customer_id = ?
		ORDER BY m.joined_at DESC
	`, customerID).Scan(&results).Error
	return results, err
}

// GetTenantStatus returns the status of the tenant.
func (r *Repo) GetTenantStatus(ctx context.Context, tenantID uuid.UUID) (string, error) {
	var status string
	err := r.db.WithContext(ctx).Raw(`SELECT status FROM tenants WHERE id = ?`, tenantID).Scan(&status).Error
	return status, err
}

// ── Profiles ─────────────────────────────────────────────────────────────────

func (r *Repo) UpsertProfile(ctx context.Context, membershipID uuid.UUID, notesInternal string) error {
	return r.db.WithContext(ctx).Exec(`
		INSERT INTO tenant_customer_profiles (membership_id, notes_internal, created_at, updated_at)
		VALUES (?, ?, now(), now())
		ON CONFLICT (membership_id) DO UPDATE SET
			notes_internal = EXCLUDED.notes_internal,
			updated_at = now()
	`, membershipID, notesInternal).Error
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func generateCode() string {
	b := make([]byte, 6)
	for i := range b {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(linkCodeCharset))))
		b[i] = linkCodeCharset[n.Int64()]
	}
	return string(b)
}
