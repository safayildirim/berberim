package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/berberim/api-gateway/internal/security"
	"github.com/labstack/echo/v5"
)

type fakeValidator struct {
	claims map[string]any
	err    error
}

func (f fakeValidator) Validate(_ context.Context, _ string) (map[string]any, error) {
	if f.err != nil {
		return nil, f.err
	}
	return f.claims, nil
}

func TestValidateJWT(t *testing.T) {
	tests := []struct {
		name       string
		authHeader string
		validator  fakeValidator
		wantCode   int
		wantError  string
		// expected AuthContext fields when wantCode == 200
		wantUserID    string
		wantTenantID  string
		wantTokenType string
		wantRole      string
	}{
		{
			name:      "missing auth header returns 401",
			wantCode:  http.StatusUnauthorized,
			wantError: "unauthorized",
		},
		{
			name:       "malformed header returns 401",
			authHeader: "Token abc",
			wantCode:   http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "invalid token returns 401",
			authHeader: "Bearer bad",
			validator:  fakeValidator{err: security.ErrTokenInvalid},
			wantCode:   http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "expired token returns 401",
			authHeader: "Bearer expired",
			validator:  fakeValidator{err: security.ErrTokenExpired},
			wantCode:   http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "valid token populates auth context",
			authHeader: "Bearer ok",
			validator: fakeValidator{claims: map[string]any{
				"sub":       "user-123",
				"tenant_id": "tenant-456",
				"type":      "tenant_user",
				"role":      "admin",
			}},
			wantCode:      http.StatusOK,
			wantUserID:    "user-123",
			wantTenantID:  "tenant-456",
			wantTokenType: "tenant_user",
			wantRole:      "admin",
		},
		{
			name:       "customer token without tenant_id or role",
			authHeader: "Bearer ok",
			validator: fakeValidator{claims: map[string]any{
				"sub":  "cust-789",
				"type": "customer",
			}},
			wantCode:      http.StatusOK,
			wantUserID:    "cust-789",
			wantTokenType: "customer",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			e := echo.New()
			var capturedAuth *AuthContext
			e.GET("/test", func(c *echo.Context) error {
				capturedAuth, _ = AuthContextFrom(c)
				return c.NoContent(http.StatusOK)
			}, ValidateJWT(tc.validator))

			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)

			if rec.Code != tc.wantCode {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantCode)
			}
			if tc.wantError != "" {
				var body map[string]any
				if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
					t.Fatalf("decode error: %v", err)
				}
				if body["error"] != tc.wantError {
					t.Fatalf("error = %v, want %s", body["error"], tc.wantError)
				}
				return
			}

			if capturedAuth == nil {
				t.Fatal("AuthContext not set in handler")
			}
			if capturedAuth.UserID != tc.wantUserID {
				t.Errorf("UserID = %q, want %q", capturedAuth.UserID, tc.wantUserID)
			}
			if capturedAuth.TenantID != tc.wantTenantID {
				t.Errorf("TenantID = %q, want %q", capturedAuth.TenantID, tc.wantTenantID)
			}
			if capturedAuth.TokenType != tc.wantTokenType {
				t.Errorf("TokenType = %q, want %q", capturedAuth.TokenType, tc.wantTokenType)
			}
			if capturedAuth.Role != tc.wantRole {
				t.Errorf("Role = %q, want %q", capturedAuth.Role, tc.wantRole)
			}
		})
	}
}

func TestRequireTokenType(t *testing.T) {
	validClaims := map[string]any{
		"sub":       "user-1",
		"type":      "platform_user",
		"tenant_id": "t-1",
	}
	validValidator := fakeValidator{claims: validClaims}

	tests := []struct {
		name         string
		authHeader   string
		validator    fakeValidator
		requiredType string
		wantCode     int
		wantError    string
	}{
		{
			name:         "no auth context (ValidateJWT not in chain) returns 403",
			requiredType: "platform_user",
			wantCode:     http.StatusForbidden,
			wantError:    "forbidden",
		},
		{
			name:         "wrong token type returns 403",
			authHeader:   "Bearer ok",
			validator:    validValidator,
			requiredType: "tenant_user",
			wantCode:     http.StatusForbidden,
			wantError:    "forbidden",
		},
		{
			name:         "correct token type passes",
			authHeader:   "Bearer ok",
			validator:    validValidator,
			requiredType: "platform_user",
			wantCode:     http.StatusOK,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			e := echo.New()

			var mws []echo.MiddlewareFunc
			if tc.authHeader != "" {
				mws = append(mws, ValidateJWT(tc.validator))
			}
			mws = append(mws, RequireTokenType(tc.requiredType))

			e.GET("/test", func(c *echo.Context) error {
				return c.NoContent(http.StatusOK)
			}, mws...)

			req := httptest.NewRequest(http.MethodGet, "/test", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)

			if rec.Code != tc.wantCode {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantCode)
			}
			if tc.wantError != "" {
				var body map[string]any
				if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
					t.Fatalf("decode error: %v", err)
				}
				if body["error"] != tc.wantError {
					t.Fatalf("error = %v, want %s", body["error"], tc.wantError)
				}
			}
		})
	}
}
