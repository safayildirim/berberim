package jwt

import (
	"sync"
	"time"
)

// JWKSRateLimiter is a per-key (e.g. IP) rate limiter.
type JWKSRateLimiter struct {
	mu       sync.Mutex
	counts   map[string]*JWKSWindow
	limit    int
	interval time.Duration
}

type JWKSWindow struct {
	count int
	start time.Time
}

func NewJWKSRateLimiter(limit int, interval time.Duration) *JWKSRateLimiter {
	if limit <= 0 {
		limit = 120
	}

	return &JWKSRateLimiter{
		counts:   make(map[string]*JWKSWindow),
		limit:    limit,
		interval: interval,
	}
}

func (r *JWKSRateLimiter) Allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()

	w, ok := r.counts[key]
	if !ok || now.Sub(w.start) >= r.interval {
		r.counts[key] = &JWKSWindow{count: 1, start: now}
		return true
	}

	if w.count >= r.limit {
		return false
	}

	w.count++

	return true
}
