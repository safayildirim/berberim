package jwt

import (
	"context"
	"testing"
	"time"
)

func TestParseUnverifiedInvalidToken(t *testing.T) {
	// BerberimClaims should fail to parse garbage
	_, err := (&JWTManager{}).VerifyToken(context.Background(), "invalid")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestBerberimClaimsFields(t *testing.T) {
	c := &BerberimClaims{}
	c.Subject = "sub"
	c.TenantID = "tid"
	c.Type = "customer"
	if c.Subject != "sub" || c.TenantID != "tid" || c.Type != "customer" {
		t.Fail()
	}
}

func TestIssueOpts(t *testing.T) {
	opts := IssueOpts{
		Subject:  "user-1",
		Type:     "customer",
		TenantID: "tenant-1",
		TTL:      time.Minute,
	}
	_ = opts
}
