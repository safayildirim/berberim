# Auth & Tenant Implementation Design

**Date:** 2026-03-29
**Scope:** Implement auth and tenant gRPC RPC methods in `internal/auth` and `internal/tenant`, wire them through a composed top-level handler in `internal/api`.

---

## 1. Package Structure

```
internal/
├── api/
│   └── handler.go          ← composed gRPC root, embeds UnimplementedBerberimAPIServer,
│                              delegates each RPC to the correct domain handler
├── auth/
│   ├── handler.go          ← gRPC methods for auth RPCs
│   ├── service.go          ← business logic
│   ├── repo.go             ← DB queries
│   ├── model.go            ← Session, OTPCode, CustomerIdentity, Customer,
│                              TenantUser, PlatformUser GORM structs
│   └── jwt/                ← existing JWT package, strip SigningKeyRepo usage
├── tenant/
│   ├── handler.go          ← gRPC methods for tenant RPCs
│   ├── service.go          ← business logic
│   ├── repo.go             ← DB queries
│   └── model.go            ← Tenant, TenantUser GORM structs
```

---

## 2. Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Handler** | Proto ↔ domain translation. Unpack request → call service → map to response. No business logic. |
| **Service** | All business logic: OTP generation/validation, password hashing, JWT issuance, session lifecycle, tenant rules. |
| **Repo** | Raw DB queries only. No logic, no JWT, no hashing. |

---

## 3. Auth RPC Implementations

### 3.1 `SendCustomerOTP`

1. Look up tenant by `tenant_id`, verify status is `active`
2. Generate a random 6-digit numeric code
3. Invalidate any existing unexpired OTP codes for this phone+tenant (set `verified_at = now()` to expire them)
4. Insert into `customer_otp_codes` with `expires_at = now() + 5min`
5. Log the code (mock SMS delivery — real provider wired later behind an interface)
6. Return `expires_in_seconds: 300`

### 3.2 `VerifyCustomerOTP`

1. Find the most recent OTP code for `(tenant_id, phone_number)` where `verified_at IS NULL AND expires_at > now()`
2. If not found or code mismatch → return `INVALID_CODE`
3. If found but `expires_at < now()` → return `EXPIRED`
4. Mark `verified_at = now()`
5. Upsert customer record in `customers` (create if first login, `is_new_customer = true`)
6. Create session row in `sessions` (`user_type = customer`)
7. Issue JWT access token + opaque refresh token
8. Return tokens + `customer_id` + `is_new_customer`

### 3.3 `VerifyCustomerSocialLogin`

1. Verify `id_token` via provider's JWKS — behind a `SocialTokenVerifier` interface (stubbed for now, real Google/Apple verification wired later)
2. Extract `provider_user_id` (the `sub` claim) from verified token
3. Look up `customer_identities` by `(tenant_id, provider, provider_user_id)`
4. If not found: create customer + identity row, `is_new_customer = true`
5. If found: load existing customer
6. Create session, issue JWT
7. Return tokens + `customer_id` + `is_new_customer`

**`SocialTokenVerifier` interface:**
```go
type SocialTokenVerifier interface {
    Verify(ctx context.Context, provider, idToken string) (providerUserID string, err error)
}
```
Stub implementation returns a fixed `provider_user_id` derived from the token string (for dev/test only).

### 3.4 `LoginTenantUser`

1. Look up tenant by `tenant_id`, check status is `active`
2. Look up `tenant_users` by `(tenant_id, email)`
3. If not found → return `INVALID_CREDENTIALS`
4. `bcrypt.CompareHashAndPassword` — if mismatch → return `INVALID_CREDENTIALS`
5. If user `status = disabled` → return `USER_DISABLED`
6. Create session (`user_type = tenant_user`, `tenant_id` set)
7. Issue JWT with `role` claim
8. Return tokens + `user_id` + `role`

### 3.5 `LoginPlatformUser`

1. Look up `platform_users` by `email`
2. If not found → return `INVALID_CREDENTIALS`
3. `bcrypt.CompareHashAndPassword` — if mismatch → return `INVALID_CREDENTIALS`
4. If user `status = disabled` → return `USER_DISABLED`
5. Create session (`user_type = platform_user`, `tenant_id = NULL`)
6. Issue JWT
7. Return tokens + `user_id`

### 3.6 `RefreshToken`

1. SHA-256 hash the incoming refresh token
2. Look up session by `refresh_token_hash`
3. If not found → return `INVALID`
4. If `revoked_at IS NOT NULL` → return `INVALID`
5. If `expires_at < now()` → return `EXPIRED`
6. Update `last_used_at = now()`
7. Issue new JWT access token (refresh token is NOT rotated — same session row)
8. Return new access token + same refresh token

### 3.7 `Logout`

1. Hash the refresh token
2. Set `sessions.revoked_at = now()` where `refresh_token_hash = <hash>`

### 3.8 `LogoutAll`

1. Caller identity comes from JWT claims in context (set by gRPC middleware)
2. Set `revoked_at = now()` on all active sessions for `(user_type, user_id)`
3. Return `revoked_count`

### 3.9 `ListSessions`

1. Query active sessions for caller: `WHERE user_type = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > now()`
2. Mark `is_current = true` for the session matching the caller's current session ID (from JWT `jti` claim)
3. Return session list (no tokens, no hashes)

### 3.10 `RevokeSession`

1. Look up session by `session_id`, verify it belongs to the caller
2. Set `revoked_at = now()`
3. Return empty response

---

## 4. Tenant RPC Implementations

### 4.1 `CreateTenant`

1. Validate slug is unique
2. Insert `tenants` row
3. Insert `tenant_settings` row with defaults
4. Hash password with bcrypt
5. Insert `tenant_users` row with `role = admin`
6. Return `tenant_id` + `admin_user_id`

### 4.2 `ListTenants`

1. Paginated query on `tenants`, ordered by `created_at DESC`
2. Return tenant list + total + total_pages

### 4.3 `GetTenant`

1. Look up tenant by `id`
2. Return tenant

### 4.4 `SetTenantStatus`

1. Validate status value is one of `active`, `frozen`, `disabled`
2. Update `tenants.status`

### 4.5 `CreateTenantUser`

1. Check `(tenant_id, email)` uniqueness
2. Hash password with bcrypt
3. Insert `tenant_users`
4. Return `user_id`

### 4.6 `ListTenantUsers`

1. Query `tenant_users` filtered by `tenant_id`, optional `role` and `status`
2. Paginated, ordered by `created_at DESC`

### 4.7 `DisableTenantUser` / `EnableTenantUser`

1. Look up user by `(tenant_id, user_id)`
2. Set `status = disabled` / `status = active`

---

## 5. JWT Structure

**Access token claims:**
```json
{
  "sub": "<user_id>",
  "jti": "<session_id>",
  "type": "customer | tenant_user | platform_user",
  "tenant_id": "<uuid>",
  "role": "admin | staff",
  "iss": "<config.jwt.issuer>",
  "exp": "<now + access_token_ttl>"
}
```
- `tenant_id` omitted for `platform_user`
- `role` omitted for `customer` and `platform_user`
- `jti` = session UUID (used for `ListSessions` current-session detection)

**Refresh token:** random 32-byte hex string, stored as SHA-256 hash in `sessions.refresh_token_hash`

**Signing:** RS256, private key loaded from file path at startup (`config.jwt.private_key_path`)

---

## 6. Top-Level Composed Handler (`internal/api/handler.go`)

```go
type Handler struct {
    berberimv1.UnimplementedBerberimAPIServer
    auth   *auth.Handler
    tenant *tenant.Handler
}
```

Each RPC method delegates to the appropriate domain handler:
```go
func (h *Handler) SendCustomerOTP(ctx context.Context, req *berberimv1.SendCustomerOTPRequest) (*berberimv1.SendCustomerOTPResponse, error) {
    return h.auth.SendCustomerOTP(ctx, req)
}
```

`server.go` registers this composed handler with gRPC instead of `auth.Handler` directly.

---

## 7. Config Cleanup

Remove from `config/base.yml` and `internal/config/config.go`:
- `platform_tenant_id`
- `token_ttl_system`, `token_ttl_platform`, `token_ttl_ops`
- `auth.secret_rotation_grace_period`
- `ops.*` block
- `rate.*` block (add back when rate limiting is implemented)

Keep:
- `jwt.issuer`
- `jwt.algorithm`
- `jwt.access_token_ttl`
- `jwt.private_key_path`

---

## 8. File Deletions

- `internal/auth/signing_key.go` — remove `SigningKey` model and `SigningKeyRepo`
- JWKS endpoint and `jwt/` package — **keep** (JWKS is used for token verification by clients)
- `server.go` — remove `signingRepo` wiring, switch gRPC registration to `internal/api.Handler`

---

## 9. Auth Middleware (out of scope for this plan)

JWT verification middleware (extracting claims into context for `LogoutAll`, `ListSessions`, `RevokeSession`) is needed but will be a follow-up. For this implementation, those three RPCs can accept a `user_id` in the request as a temporary stand-in until middleware is wired.
