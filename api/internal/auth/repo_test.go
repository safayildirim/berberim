package auth_test

import (
	"context"
	"testing"

	"github.com/berberim/api/internal/auth"
	"github.com/google/uuid"
)

// Compile-time check: Repo must implement all required methods.
func TestRepoInterface(t *testing.T) {
	var _ interface {
		GetTenantByID(context.Context, uuid.UUID) (*auth.Tenant, error)
		GetCustomerByPhone(context.Context, string) (*auth.Customer, error)
		UpsertCustomer(context.Context, *auth.Customer) error
		CreateOTPCode(context.Context, *auth.OTPCode) error
		InvalidatePendingOTPs(context.Context, uuid.UUID) error
		FindValidOTPCode(context.Context, uuid.UUID, string) (*auth.OTPCode, error)
		MarkOTPVerified(context.Context, uuid.UUID) error
		GetCustomerIdentity(context.Context, string, string) (*auth.CustomerIdentity, error)
		CreateCustomerIdentity(context.Context, *auth.CustomerIdentity) error
		GetCustomerByID(context.Context, uuid.UUID) (*auth.Customer, error)
		GetTenantUserByEmail(context.Context, uuid.UUID, string) (*auth.TenantUser, error)
		GetPlatformUserByEmail(context.Context, string) (*auth.PlatformUser, error)
		CreateSession(context.Context, *auth.Session) error
		GetSessionByTokenHash(context.Context, string) (*auth.Session, error)
		UpdateSessionLastUsed(context.Context, uuid.UUID) error
		RevokeSession(context.Context, uuid.UUID) error
		RevokeAllUserSessions(context.Context, string, uuid.UUID) (int64, error)
		ListActiveSessions(context.Context, string, uuid.UUID) ([]auth.Session, error)
	} = (*auth.Repo)(nil)
}
