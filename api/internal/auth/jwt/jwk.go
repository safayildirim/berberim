package jwt

import (
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"math/big"
)

// ParseRSAPublicKeyPEM parses PEM-encoded RSA public key.
func ParseRSAPublicKeyPEM(pemBytes []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, nil
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	r, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, nil
	}
	return r, nil
}

// RSAPublicKeyToJWK returns JWK N and E as base64url (RFC 7517).
func RSAPublicKeyToJWK(pub *rsa.PublicKey) (n, e string) {
	nBytes := pub.N.Bytes()
	eBytes := big.NewInt(int64(pub.E)).Bytes()
	return base64.RawURLEncoding.EncodeToString(nBytes), base64.RawURLEncoding.EncodeToString(eBytes)
}

// RSAKeyID derives a stable KID from the public key material using the
// RFC 7638 JWK Thumbprint method (SHA-256 of the canonical key parameters).
// This ensures the KID is consistent across restarts as long as the key file
// doesn't change, preventing token invalidation on Cold Start.
func RSAKeyID(pub *rsa.PublicKey) string {
	n, e := RSAPublicKeyToJWK(pub)
	// Canonical form per RFC 7638 §3.3: sorted, no whitespace
	canonical := `{"e":"` + e + `","kty":"RSA","n":"` + n + `"}`
	sum := sha256.Sum256([]byte(canonical))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}
