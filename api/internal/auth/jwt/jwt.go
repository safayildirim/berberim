package jwt

import (
	"context"
	"fmt"
	"time"

	jwtpkg "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// BerberimClaims are the JWT claims for berberim tokens.
type BerberimClaims struct {
	jwtpkg.RegisteredClaims
	Type     string `json:"type"`                // "customer" | "tenant_user" | "platform_user"
	TenantID string `json:"tenant_id,omitempty"` // omitted for platform_user
	Role     string `json:"role,omitempty"`      // "admin" | "staff" — omitted for customer/platform_user
}

// JWTManager signs and verifies JWTs using KeyProvider.
type JWTManager struct {
	keyProvider KeyProvider
	issuer      string
}

func NewJWTManager(kp KeyProvider, issuer string) *JWTManager {
	return &JWTManager{keyProvider: kp, issuer: issuer}
}

type IssueOpts struct {
	Subject  string // user UUID
	JTI      string // session UUID used as jti
	Type     string // "customer" | "tenant_user" | "platform_user"
	TenantID string // empty for platform_user
	Role     string // empty for customer and platform_user
	TTL      time.Duration
}

// IssueToken creates a signed JWT. Returns (tokenString, error).
func (m *JWTManager) IssueToken(ctx context.Context, opts IssueOpts) (string, error) {
	key, err := m.keyProvider.CurrentSigningKey(ctx)
	if err != nil {
		return "", err
	}
	if opts.JTI == "" {
		opts.JTI = uuid.New().String()
	}
	now := time.Now()
	claims := &BerberimClaims{
		RegisteredClaims: jwtpkg.RegisteredClaims{
			ID:        opts.JTI,
			Issuer:    m.issuer,
			Subject:   opts.Subject,
			ExpiresAt: jwtpkg.NewNumericDate(now.Add(opts.TTL)),
			IssuedAt:  jwtpkg.NewNumericDate(now),
			NotBefore: jwtpkg.NewNumericDate(now),
		},
		Type:     opts.Type,
		TenantID: opts.TenantID,
		Role:     opts.Role,
	}

	t := jwtpkg.NewWithClaims(jwtpkg.SigningMethodRS256, claims)
	t.Header["kid"] = key.KID
	return t.SignedString(key.PrivateKey)
}

// VerifyToken verifies the token signature and returns its claims.
func (m *JWTManager) VerifyToken(ctx context.Context, rawToken string) (*BerberimClaims, error) {
	tok, err := jwtpkg.ParseWithClaims(rawToken, &BerberimClaims{}, func(t *jwtpkg.Token) (interface{}, error) {
		kid, ok := t.Header["kid"].(string)
		if !ok || kid == "" {
			return nil, fmt.Errorf("missing kid")
		}
		key, err := m.keyProvider.GetKeyByKID(ctx, kid)
		if err != nil {
			return nil, err
		}
		return key.PublicKey, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*BerberimClaims)
	if !ok || !tok.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	if claims.Issuer != m.issuer {
		return nil, fmt.Errorf("invalid issuer")
	}
	return claims, nil
}
