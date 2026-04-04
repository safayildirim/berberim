package jwt

import (
	"context"
	"crypto/rsa"
	"time"
)

// KeyProvider abstracts signing key access. Implementations can load from env/files
// or later from AWS KMS (signing would be done via KMS API).
type KeyProvider interface {
	// CurrentSigningKey returns the active key used for new tokens.
	CurrentSigningKey(ctx context.Context) (*SigningKeyInfo, error)
	// GetKeyByKID returns a key by kid for token verification (including rotated keys).
	GetKeyByKID(ctx context.Context, kid string) (*SigningKeyInfo, error)
	// RotateKey creates a new active key and marks the previous one for retirement.
	RotateKey(ctx context.Context) error
	// PublicKeys returns all public keys for JWKS exposure.
	PublicKeys() []*SigningKeyInfo
}

type SigningKeyInfo struct {
	KID        string
	Algorithm  string
	PrivateKey *rsa.PrivateKey
	PublicKey  *rsa.PublicKey
	NotBefore  time.Time
	NotAfter   time.Time
}
