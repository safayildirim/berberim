package security

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/berberim/api-gateway/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewJWTValidator_EmptyJWKSURL(t *testing.T) {
	cfg := config.AuthzConfig{
		JWKSUrl: "",
		Issuer:  "https://test",
	}
	_, err := NewJWTValidator("dev", cfg)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "jwks_url")
}

func TestValidate_EmptyToken(t *testing.T) {
	// Serve minimal JWKS so NewJWTValidator succeeds, then Validate("") returns ErrTokenInvalid.
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	n := base64.RawURLEncoding.EncodeToString(key.PublicKey.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(bigIntToBytes(big.NewInt(int64(key.PublicKey.E))))
	jwks := map[string]any{
		"keys": []map[string]string{
			{"kty": "RSA", "kid": "test-1", "n": n, "e": e},
		},
	}
	body, _ := json.Marshal(jwks)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(body)
	}))
	defer srv.Close()

	cfg := config.AuthzConfig{
		JWKSUrl:     srv.URL,
		Issuer:      "https://test",
		AllowedAlgs: []string{"RS256"},
		ClockSkew:   30 * time.Second,
	}
	v, err := NewJWTValidator("dev", cfg)
	require.NoError(t, err)

	_, err = v.Validate(context.Background(), "")
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrTokenInvalid)
}

func bigIntToBytes(n *big.Int) []byte {
	if n == nil {
		return nil
	}
	b := n.Bytes()
	if len(b) > 0 && b[0]&0x80 != 0 {
		b = append([]byte{0}, b...)
	}
	return b
}

func TestValidate_MalformedToken(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	n := base64.RawURLEncoding.EncodeToString(key.PublicKey.N.Bytes())
	e := base64.RawURLEncoding.EncodeToString(bigIntToBytes(big.NewInt(int64(key.PublicKey.E))))
	jwks := map[string]any{
		"keys": []map[string]string{
			{"kty": "RSA", "kid": "test-1", "n": n, "e": e},
		},
	}
	body, _ := json.Marshal(jwks)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(body)
	}))
	defer srv.Close()

	cfg := config.AuthzConfig{
		JWKSUrl:     srv.URL,
		Issuer:      "https://test",
		AllowedAlgs: []string{"RS256"},
		ClockSkew:   30 * time.Second,
	}
	v, err := NewJWTValidator("dev", cfg)
	require.NoError(t, err)

	_, err = v.Validate(context.Background(), "not.valid.jwt")
	require.Error(t, err)
	assert.ErrorIs(t, err, ErrTokenInvalid)
}

func TestErrorSentinels(t *testing.T) {
	assert.NotEmpty(t, ErrTokenInvalid.Error())
	assert.NotEmpty(t, ErrTokenExpired.Error())
	assert.NotEmpty(t, ErrTokenIssuerMismatch.Error())
	assert.NotEmpty(t, ErrTokenAlgMismatch.Error())
}
