package jwt

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
)

// StaticKeyProvider loads a single RSA private key from a file at startup.
// All tokens are signed with this key. Key rotation is not supported in v1.
type StaticKeyProvider struct {
	info *SigningKeyInfo
}

func NewStaticKeyProvider(keyPath, algorithm string) (*StaticKeyProvider, error) {
	if keyPath == "" {
		return nil, fmt.Errorf("JWT_PRIVATE_KEY_PATH is required")
	}
	data, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("read private key: %w", err)
	}
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("no PEM block found in key file")
	}
	var priv *rsa.PrivateKey
	priv, err = x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		raw, err2 := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err2 != nil {
			return nil, fmt.Errorf("parse private key: %w", err)
		}
		var ok bool
		priv, ok = raw.(*rsa.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("key is not RSA")
		}
	}
	return &StaticKeyProvider{
		info: &SigningKeyInfo{
			KID:        uuid.New().String(),
			Algorithm:  algorithm,
			PrivateKey: priv,
			PublicKey:  &priv.PublicKey,
			NotBefore:  time.Now(),
			NotAfter:   time.Now().Add(100 * 365 * 24 * time.Hour),
		},
	}, nil
}

func (p *StaticKeyProvider) CurrentSigningKey(_ context.Context) (*SigningKeyInfo, error) {
	return p.info, nil
}

func (p *StaticKeyProvider) GetKeyByKID(_ context.Context, kid string) (*SigningKeyInfo, error) {
	if kid != p.info.KID {
		return nil, fmt.Errorf("unknown kid: %s", kid)
	}
	return p.info, nil
}

func (p *StaticKeyProvider) RotateKey(_ context.Context) error {
	return fmt.Errorf("key rotation not supported in v1")
}

func (p *StaticKeyProvider) PublicKeys() []*SigningKeyInfo {
	return []*SigningKeyInfo{p.info}
}
