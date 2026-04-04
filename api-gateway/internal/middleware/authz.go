package middleware

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/berberim/api-gateway/internal/apierr"
	"github.com/berberim/api-gateway/internal/security"
	"github.com/labstack/echo/v5"
)

const authContextKey = "authz"

// AuthContext is the single authoritative source of caller identity inside the
// gateway. Populated by ValidateJWT; read by all downstream handlers.
type AuthContext struct {
	UserID    string // UUID string — JWT "sub" claim
	TenantID  string // empty for platform_user tokens; populated from JWT for customer and tenant_user
	TokenType string // "customer" | "tenant_user" | "platform_user"
	Role      string // "admin" | "staff" | "" (empty for customer/platform_user)
	SessionID string // JWT "jti" claim — identifies the session for targeted revoke
}

// ValidateJWT validates the Bearer JWT, extracts claims into AuthContext, and
// stores it on the echo context. Rejects with 401 on missing/invalid token.
func ValidateJWT(validator security.JWTValidator) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			rawToken, err := bearerToken(c.Request().Header.Get("Authorization"))
			if err != nil {
				return apierr.Write(c, http.StatusUnauthorized, apierr.New("unauthorized", "missing or invalid authorization header"))
			}
			claims, err := validator.Validate(c.Request().Context(), rawToken)
			if err != nil {
				return apierr.Write(c, http.StatusUnauthorized, apierr.New("unauthorized", "invalid token"))
			}
			c.Set(authContextKey, &AuthContext{
				UserID:    stringClaim(claims, "sub"),
				TenantID:  stringClaim(claims, "tenant_id"),
				TokenType: stringClaim(claims, "type"),
				Role:      stringClaim(claims, "role"),
				SessionID: stringClaim(claims, "jti"),
			})
			return next(c)
		}
	}
}

// RequireTokenType enforces the token type claim.
// Must be chained after ValidateJWT.
func RequireTokenType(tokenType string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			auth, ok := AuthContextFrom(c)
			if !ok || auth.TokenType != tokenType {
				return apierr.Write(c, http.StatusForbidden, apierr.New("forbidden", "token type not permitted"))
			}
			return next(c)
		}
	}
}

// RequireRole enforces a specific role within tenant_user tokens.
// Must be chained after ValidateJWT + RequireTokenType("tenant_user").
func RequireRole(role string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			auth, ok := AuthContextFrom(c)
			if !ok || auth.Role != role {
				return apierr.Write(c, http.StatusForbidden, apierr.New("forbidden", fmt.Sprintf("role '%s' required", role)))
			}
			return next(c)
		}
	}
}

// RequireTenantID enforces that the JWT carries a tenant_id claim.
// Must be chained after ValidateJWT.
func RequireTenantID() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			auth, ok := AuthContextFrom(c)
			if !ok || auth.TenantID == "" {
				return apierr.Write(c, http.StatusForbidden, apierr.New("forbidden", "token not scoped to a tenant"))
			}
			return next(c)
		}
	}
}

// AuthContextFrom returns the AuthContext stored by ValidateJWT.
func AuthContextFrom(c *echo.Context) (*AuthContext, bool) {
	val := c.Get(authContextKey)
	auth, ok := val.(*AuthContext)
	return auth, ok
}

func bearerToken(header string) (string, error) {
	if header == "" {
		return "", errors.New("missing authorization")
	}
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(header, "Bearer ")), nil
	}
	if strings.HasPrefix(strings.ToLower(header), "bearer ") {
		return strings.TrimSpace(header[7:]), nil
	}
	return "", errors.New("missing bearer token")
}

func stringClaim(claims map[string]any, key string) string {
	val, ok := claims[key]
	if !ok {
		return ""
	}
	str, _ := val.(string)
	return str
}

type validatorFunc func(ctx context.Context, raw string) (map[string]any, error)

func (v validatorFunc) Validate(ctx context.Context, raw string) (map[string]any, error) {
	return v(ctx, raw)
}
