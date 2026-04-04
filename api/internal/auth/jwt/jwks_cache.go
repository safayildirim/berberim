package jwt

import (
	"context"
	"sync"
	"time"
)

// JWKSCache caches JWKS JSON and refreshes after TTL (same logic as customer-bff).
type JWKSCache struct {
	mu      sync.RWMutex
	data    []byte
	expires time.Time
	ttl     time.Duration
	fetch   func(ctx context.Context) ([]byte, error)
}

func NewJWKSCache(ttl time.Duration, fetch func(context.Context) ([]byte, error)) *JWKSCache {
	return &JWKSCache{ttl: ttl, fetch: fetch}
}

func (c *JWKSCache) Get(ctx context.Context) ([]byte, error) {
	c.mu.RLock()
	if len(c.data) > 0 && time.Now().Before(c.expires) {
		out := make([]byte, len(c.data))
		copy(out, c.data)
		c.mu.RUnlock()
		return out, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()
	if len(c.data) > 0 && time.Now().Before(c.expires) {
		out := make([]byte, len(c.data))
		copy(out, c.data)
		return out, nil
	}

	data, err := c.fetch(ctx)
	if err != nil {
		return nil, err
	}

	c.data = data
	c.expires = time.Now().Add(c.ttl)
	out := make([]byte, len(data))
	copy(out, data)

	return out, nil
}
