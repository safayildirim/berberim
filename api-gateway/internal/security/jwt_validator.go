package security

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/berberim/api-gateway/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/api/idtoken"
)

var (
	ErrTokenInvalid        = errors.New("token invalid")
	ErrTokenExpired        = errors.New("token expired")
	ErrTokenIssuerMismatch = errors.New("token issuer mismatch")
	ErrTokenAlgMismatch    = errors.New("token algorithm mismatch")
)

type JWTValidator interface {
	Validate(ctx context.Context, raw string) (map[string]any, error)
}

type jwksValidator struct {
	jwksURL    string
	issuer     string
	allowed    map[string]struct{}
	clockSkew  time.Duration
	ttl        time.Duration
	httpClient *http.Client

	mu        sync.RWMutex
	keys      map[string]crypto.PublicKey
	expiresAt time.Time

	refreshMu sync.Mutex
}

// NewJWTValidator constructs a validator that fetches JWKS from cfg.JWKSUrl.
// In non-dev environments the JWKS HTTP request carries a Cloud Run OIDC ID
// token so it can reach an IAM-protected api-http Cloud Run service.
func NewJWTValidator(env string, cfg config.AuthzConfig) (JWTValidator, error) {
	if cfg.JWKSUrl == "" {
		return nil, errors.New("authz.jwks_url (or AUTHZ_JWKS_URL) is required")
	}

	allowed := make(map[string]struct{}, len(cfg.AllowedAlgs))
	for _, alg := range cfg.AllowedAlgs {
		alg = strings.TrimSpace(alg)
		if alg == "" {
			continue
		}
		allowed[alg] = struct{}{}
	}

	if len(allowed) == 0 {
		allowed["RS256"] = struct{}{}
	}

	var httpClient *http.Client
	_, inCloudRun := os.LookupEnv("K_SERVICE")
	if inCloudRun {
		// Derive audience: strip path from JWKS URL to get the base service URL.
		// e.g. "https://svc.run.app/.well-known/jwks.json" → "https://svc.run.app"
		audience := cfg.JWKSUrl
		if idx := strings.Index(audience, "/.well-known"); idx != -1 {
			audience = audience[:idx]
		}
		var err error
		httpClient, err = idtoken.NewClient(context.Background(), audience)
		if err != nil {
			return nil, fmt.Errorf("jwt_validator: oidc http client for %s: %w", audience, err)
		}
		httpClient.Timeout = 5 * time.Second
	} else {
		httpClient = &http.Client{Timeout: 5 * time.Second}
	}

	v := &jwksValidator{
		jwksURL:    cfg.JWKSUrl,
		issuer:     cfg.Issuer,
		allowed:    allowed,
		clockSkew:  cfg.ClockSkew,
		ttl:        10 * time.Minute,
		httpClient: httpClient,
	}

	if err := v.refresh(context.Background(), true); err != nil {
		return nil, err
	}

	return v, nil
}

func (v *jwksValidator) Validate(ctx context.Context, raw string) (map[string]any, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, ErrTokenInvalid
	}
	parser := jwt.NewParser(
		jwt.WithValidMethods(v.allowedList()),
		jwt.WithIssuer(v.issuer),
		jwt.WithLeeway(v.clockSkew),
		jwt.WithExpirationRequired(),
	)
	claims := jwt.MapClaims{}
	keyFunc := func(token *jwt.Token) (any, error) {
		if !v.isAlgAllowed(token.Method.Alg()) {
			return nil, ErrTokenAlgMismatch
		}
		kid, _ := token.Header["kid"].(string)
		return v.getKey(ctx, kid)
	}
	tok, err := parser.ParseWithClaims(raw, claims, keyFunc)
	if err != nil {
		return nil, mapJWTError(err)
	}
	if tok == nil || !tok.Valid {
		return nil, ErrTokenInvalid
	}
	return claims, nil
}

func mapJWTError(err error) error {
	switch {
	case errors.Is(err, ErrTokenAlgMismatch):
		return ErrTokenAlgMismatch
	case errors.Is(err, jwt.ErrTokenExpired):
		return ErrTokenExpired
	case errors.Is(err, jwt.ErrTokenInvalidIssuer):
		return ErrTokenIssuerMismatch
	default:
		return ErrTokenInvalid
	}
}

func (v *jwksValidator) getKey(ctx context.Context, kid string) (crypto.PublicKey, error) {
	if kid == "" {
		return nil, ErrTokenInvalid
	}
	if v.isExpired() {
		if err := v.refresh(ctx, true); err != nil {
			return nil, err
		}
	}
	if key := v.lookupKey(kid); key != nil {
		return key, nil
	}
	go v.refresh(context.Background(), true)
	if err := v.refresh(ctx, true); err != nil {
		return nil, err
	}
	if key := v.lookupKey(kid); key != nil {
		return key, nil
	}
	return nil, ErrTokenInvalid
}

func (v *jwksValidator) isExpired() bool {
	v.mu.RLock()
	defer v.mu.RUnlock()
	if v.keys == nil {
		return true
	}
	return time.Now().After(v.expiresAt)
}

func (v *jwksValidator) lookupKey(kid string) crypto.PublicKey {
	v.mu.RLock()
	defer v.mu.RUnlock()
	if v.keys == nil {
		return nil
	}
	return v.keys[kid]
}

func (v *jwksValidator) refresh(ctx context.Context, force bool) error {
	v.refreshMu.Lock()
	defer v.refreshMu.Unlock()
	if !force && !v.isExpired() {
		return nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, v.jwksURL, nil)
	if err != nil {
		return err
	}
	resp, err := v.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		_, _ = io.Copy(io.Discard, resp.Body)
		return errors.New("jwks fetch failed")
	}
	var payload jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return err
	}
	keys := make(map[string]crypto.PublicKey, len(payload.Keys))
	for _, key := range payload.Keys {
		pub, err := key.toPublicKey()
		if err != nil {
			continue
		}
		if key.Kid != "" {
			keys[key.Kid] = pub
		}
	}
	if len(keys) == 0 {
		return errors.New("jwks contains no keys")
	}
	v.mu.Lock()
	v.keys = keys
	v.expiresAt = time.Now().Add(v.ttl)
	v.mu.Unlock()
	return nil
}

func (v *jwksValidator) allowedList() []string {
	out := make([]string, 0, len(v.allowed))
	for alg := range v.allowed {
		out = append(out, alg)
	}
	return out
}

func (v *jwksValidator) isAlgAllowed(alg string) bool {
	_, ok := v.allowed[alg]
	return ok
}

type jwksResponse struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	Crv string `json:"crv"`
	N   string `json:"n"`
	E   string `json:"e"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

func (k jwkKey) toPublicKey() (crypto.PublicKey, error) {
	switch k.Kty {
	case "RSA":
		return rsaPublicKey(k.N, k.E)
	case "EC":
		return ecdsaPublicKey(k.Crv, k.X, k.Y)
	default:
		return nil, errors.New("unsupported jwk kty")
	}
}

func rsaPublicKey(n string, e string) (*rsa.PublicKey, error) {
	nb, err := base64.RawURLEncoding.DecodeString(n)
	if err != nil {
		return nil, err
	}
	eb, err := base64.RawURLEncoding.DecodeString(e)
	if err != nil {
		return nil, err
	}
	nInt := new(big.Int).SetBytes(nb)
	eInt := new(big.Int).SetBytes(eb)
	if !eInt.IsInt64() {
		return nil, errors.New("invalid rsa exponent")
	}
	return &rsa.PublicKey{
		N: nInt,
		E: int(eInt.Int64()),
	}, nil
}

func ecdsaPublicKey(crv string, x string, y string) (*ecdsa.PublicKey, error) {
	if crv != "P-256" {
		return nil, errors.New("unsupported ec curve")
	}
	xb, err := base64.RawURLEncoding.DecodeString(x)
	if err != nil {
		return nil, err
	}
	yb, err := base64.RawURLEncoding.DecodeString(y)
	if err != nil {
		return nil, err
	}
	curve := elliptic.P256()
	return &ecdsa.PublicKey{
		Curve: curve,
		X:     new(big.Int).SetBytes(xb),
		Y:     new(big.Int).SetBytes(yb),
	}, nil
}
