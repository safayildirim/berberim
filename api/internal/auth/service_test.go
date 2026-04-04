package auth

import (
	"testing"
)

func TestGenerateOTPCode(t *testing.T) {
	code := generateOTPCode()
	if len(code) != 6 {
		t.Fatalf("expected 6-digit code, got %q (len %d)", code, len(code))
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			t.Fatalf("expected numeric code, got char %q", c)
		}
	}
}

func TestGenerateOTPCode_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		code := generateOTPCode()
		seen[code] = true
	}
	if len(seen) < 2 {
		t.Fatal("expected variation in generated codes")
	}
}

func TestGenerateRefreshToken(t *testing.T) {
	tok := generateRefreshToken()
	if len(tok) != 64 {
		t.Fatalf("expected 64 char hex, got len %d", len(tok))
	}
}

func TestHashRefreshToken(t *testing.T) {
	tok := generateRefreshToken()
	h1 := hashRefreshToken(tok)
	h2 := hashRefreshToken(tok)
	if h1 != h2 {
		t.Fatal("same token should produce same hash")
	}
	if h1 == tok {
		t.Fatal("hash should not equal raw token")
	}
}
