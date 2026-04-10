package membership

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Service struct {
	log  *zap.Logger
	repo *Repo
}

func NewService(log *zap.Logger, repo *Repo) *Service {
	return &Service{log: log, repo: repo}
}

// ── Customer-facing ──────────────────────────────────────────────────────────

func (s *Service) ListCustomerTenants(ctx context.Context, customerID uuid.UUID) ([]MembershipWithTenant, error) {
	results, err := s.repo.ListCustomerTenants(ctx, customerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list tenants: %v", err)
	}
	return results, nil
}

func (s *Service) ClaimLinkCode(ctx context.Context, customerID uuid.UUID, code string) (*MembershipWithTenant, error) {
	// Step 1: Consume the code atomically.
	lc, err := s.repo.ClaimLinkCode(ctx, code)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "invalid, expired, or already used code")
		}
		return nil, status.Errorf(codes.Internal, "claim code: %v", err)
	}

	// Step 2: Validate tenant is active.
	tenantStatus, err := s.repo.GetTenantStatus(ctx, lc.TenantID)
	if err != nil || tenantStatus != "active" {
		return nil, status.Error(codes.FailedPrecondition, "this shop is currently unavailable")
	}

	// Step 3: Create or reactivate membership.
	m := &Membership{
		ID:         uuid.New(),
		CustomerID: customerID,
		TenantID:   lc.TenantID,
		LinkCodeID: &lc.ID,
	}
	if err := s.repo.UpsertMembership(ctx, m); err != nil {
		return nil, status.Errorf(codes.Internal, "create membership: %v", err)
	}

	// Return the membership with tenant info.
	tenants, err := s.repo.ListCustomerTenants(ctx, customerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "fetch tenant: %v", err)
	}
	for i := range tenants {
		if tenants[i].TenantID == lc.TenantID {
			return &tenants[i], nil
		}
	}

	return nil, status.Error(codes.Internal, "membership created but tenant not found")
}

// ── Tenant admin-facing ──────────────────────────────────────────────────────

func (s *Service) GenerateLinkCode(ctx context.Context, tenantID, createdByUserID uuid.UUID, maxUses int, expiresInHours int) (*LinkCode, error) {
	if maxUses < 1 {
		maxUses = 1
	}
	if expiresInHours < 1 {
		expiresInHours = 24
	}
	if expiresInHours > 168 {
		expiresInHours = 168
	}

	lc := &LinkCode{
		ID:              uuid.New(),
		TenantID:        tenantID,
		CreatedByUserID: createdByUserID,
		MaxUses:         maxUses,
		ExpiresAt:       time.Now().Add(time.Duration(expiresInHours) * time.Hour),
	}

	if err := s.repo.GenerateLinkCode(ctx, lc); err != nil {
		return nil, status.Errorf(codes.Internal, "generate link code: %v", err)
	}
	return lc, nil
}

func (s *Service) ListLinkCodes(ctx context.Context, tenantID uuid.UUID) ([]LinkCode, error) {
	result, err := s.repo.ListLinkCodes(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list link codes: %v", err)
	}
	return result, nil
}

func (s *Service) RevokeLinkCode(ctx context.Context, tenantID, linkCodeID, revokedByUserID uuid.UUID) error {
	if err := s.repo.RevokeLinkCode(ctx, tenantID, linkCodeID, revokedByUserID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "link code not found or already revoked")
		}
		return status.Errorf(codes.Internal, "revoke link code: %v", err)
	}
	return nil
}

// SetMembershipStatus changes a customer's membership status at a tenant.
func (s *Service) SetMembershipStatus(ctx context.Context, customerID, tenantID uuid.UUID, membershipStatus string) error {
	valid := map[string]bool{"active": true, "disabled": true}
	if !valid[membershipStatus] {
		return status.Errorf(codes.InvalidArgument, "invalid status %q", membershipStatus)
	}
	if err := s.repo.SetMembershipStatus(ctx, customerID, tenantID, membershipStatus); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "customer membership not found")
		}
		return status.Errorf(codes.Internal, "set membership status: %v", err)
	}
	return nil
}

// UpsertProfile creates or updates a tenant-specific customer profile.
func (s *Service) UpsertProfile(ctx context.Context, customerID, tenantID uuid.UUID, notesInternal string) error {
	m, err := s.repo.GetMembership(ctx, customerID, tenantID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "customer membership not found")
		}
		return status.Errorf(codes.Internal, "get membership: %v", err)
	}
	if err := s.repo.UpsertProfile(ctx, m.ID, notesInternal); err != nil {
		return status.Errorf(codes.Internal, "upsert profile: %v", err)
	}
	return nil
}
