// Package requestmeta carries non-identity request metadata (network + device)
// extracted from incoming gRPC metadata.
package requestmeta

import (
	"context"
	"net"
	"strings"

	"google.golang.org/grpc/metadata"
)

type contextKey struct{}

// ClientMeta is request-scoped client context forwarded by the API gateway.
// Fields are optional; empty values mean "not provided".
type ClientMeta struct {
	IPAddress      string
	UserAgent      string
	InstallationID string
	Provider       string
	Platform       string
	AppVersion     string
	Locale         string
	Timezone       string
	OSVersion      string
	DeviceModel    string
	PushToken      string
}

// WithContext stores meta on ctx.
func WithContext(ctx context.Context, meta ClientMeta) context.Context {
	return context.WithValue(ctx, contextKey{}, meta)
}

// FromContext reads ClientMeta from ctx.
func FromContext(ctx context.Context) (ClientMeta, bool) {
	meta, ok := ctx.Value(contextKey{}).(ClientMeta)
	return meta, ok
}

// FromGRPCMeta parses client metadata from incoming gRPC metadata.
// Values are sanitized and clipped to DB-safe lengths.
func FromGRPCMeta(ctx context.Context) ClientMeta {
	meta := ClientMeta{
		Provider: "expo",
		Platform: "web",
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return meta
	}

	if rawIP := strings.TrimSpace(first(md, "x-client-ip")); rawIP != "" {
		if ip := net.ParseIP(rawIP); ip != nil {
			meta.IPAddress = ip.String()
		}
	}

	meta.UserAgent = clip(first(md, "x-user-agent"), 512)
	meta.InstallationID = clip(first(md, "x-device-installation-id"), 128)
	meta.Provider = normalizeProvider(first(md, "x-device-provider"))
	meta.Platform = normalizePlatform(first(md, "x-device-platform"))
	meta.AppVersion = clip(first(md, "x-app-version"), 32)
	meta.Locale = clip(first(md, "x-device-locale"), 16)
	meta.Timezone = clip(first(md, "x-device-timezone"), 100)
	meta.OSVersion = clip(first(md, "x-os-version"), 64)
	meta.DeviceModel = clip(first(md, "x-device-model"), 120)
	meta.PushToken = strings.TrimSpace(first(md, "x-device-push-token"))

	return meta
}

func first(md metadata.MD, key string) string {
	vals := md.Get(key)
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}

func clip(raw string, maxLen int) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if len(raw) > maxLen {
		return raw[:maxLen]
	}
	return raw
}

func normalizePlatform(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "ios", "android", "web":
		return strings.ToLower(strings.TrimSpace(raw))
	default:
		return "web"
	}
}

func normalizeProvider(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "expo", "fcm":
		return strings.ToLower(strings.TrimSpace(raw))
	default:
		return "expo"
	}
}
