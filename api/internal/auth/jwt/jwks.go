package jwt

import (
	"context"
	"encoding/json"
)

// JWKSBuilder builds JWKS JSON from the KeyProvider's public keys.
type JWKSBuilder struct {
	provider interface {
		PublicKeys() []*SigningKeyInfo
	}
}

func NewJWKSBuilder(provider interface {
	PublicKeys() []*SigningKeyInfo
}) *JWKSBuilder {
	return &JWKSBuilder{provider: provider}
}

func (b *JWKSBuilder) GetJWKS(_ context.Context) ([]byte, error) {
	keys := b.provider.PublicKeys()
	type jwkEntry struct {
		KID string `json:"kid"`
		Kty string `json:"kty"`
		Alg string `json:"alg"`
		N   string `json:"n"`
		E   string `json:"e"`
	}
	jwks := struct {
		Keys []jwkEntry `json:"keys"`
	}{}
	for _, k := range keys {
		if k.PublicKey == nil {
			continue
		}
		n, e := RSAPublicKeyToJWK(k.PublicKey)
		jwks.Keys = append(jwks.Keys, jwkEntry{KID: k.KID, Kty: "RSA", Alg: k.Algorithm, N: n, E: e})
	}
	return json.Marshal(jwks)
}
