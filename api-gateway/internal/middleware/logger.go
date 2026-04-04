package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/labstack/echo/v5"
)

const maxBodyLogBytes = 4 * 1024 // 4 KB

// responseCapture wraps http.ResponseWriter to capture the written body and status code.
type responseCapture struct {
	http.ResponseWriter
	status int
	buf    bytes.Buffer
}

func (rc *responseCapture) WriteHeader(code int) {
	rc.status = code
	rc.ResponseWriter.WriteHeader(code)
}

func (rc *responseCapture) Write(b []byte) (int, error) {
	rc.buf.Write(b)
	return rc.ResponseWriter.Write(b)
}

// RequestBodyLogger replaces Echo's default RequestLogger with one that also
// logs request and response bodies (truncated to 4 KB, emitted as JSON values).
func RequestBodyLogger() echo.MiddlewareFunc {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			start := time.Now()

			// ── capture request body ──────────────────────────────────────────
			var reqBody json.RawMessage
			if c.Request().Body != nil && c.Request().Body != http.NoBody {
				raw, _ := io.ReadAll(io.LimitReader(c.Request().Body, maxBodyLogBytes))
				c.Request().Body = io.NopCloser(bytes.NewReader(raw))
				if len(raw) > 0 && json.Valid(raw) {
					reqBody = raw
				}
			}

			// ── wrap response writer ──────────────────────────────────────────
			rc := &responseCapture{ResponseWriter: c.Response(), status: http.StatusOK}
			c.SetResponse(rc)

			err := next(c)

			// ── parse response body ───────────────────────────────────────────
			var respBody json.RawMessage
			if rb := rc.buf.Bytes(); len(rb) > 0 && json.Valid(rb) {
				respBody = rb
			}

			attrs := []slog.Attr{
				slog.String("method", c.Request().Method),
				slog.String("uri", c.Request().RequestURI),
				slog.Int("status", rc.status),
				slog.Duration("latency", time.Since(start)),
				slog.String("remote_ip", c.RealIP()),
				slog.String("request_id", rc.Header().Get("X-Request-Id")),
			}
			if reqBody != nil {
				attrs = append(attrs, slog.Any("req_body", reqBody))
			}
			if respBody != nil {
				attrs = append(attrs, slog.Any("resp_body", respBody))
			}
			if err != nil {
				attrs = append(attrs, slog.String("error", err.Error()))
			}

			level := slog.LevelInfo
			if rc.status >= 500 {
				level = slog.LevelError
			} else if rc.status >= 400 {
				level = slog.LevelWarn
			}

			logger.LogAttrs(c.Request().Context(), level, "REQUEST", attrs...)
			return err
		}
	}
}
