package jwt

import (
	"crypto/rsa"
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
