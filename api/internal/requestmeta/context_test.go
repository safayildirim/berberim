package requestmeta

import (
	"context"
	"strings"
	"testing"

	"google.golang.org/grpc/metadata"
)

func TestFromGRPCMeta_Defaults(t *testing.T) {
	meta := FromGRPCMeta(context.Background())
	if meta.Platform != "web" {
		t.Fatalf("expected default platform web, got %q", meta.Platform)
	}
	if meta.InstallationID != "" {
		t.Fatalf("expected empty installation id, got %q", meta.InstallationID)
	}
}

func TestFromGRPCMeta_ParsesAndSanitizes(t *testing.T) {
	longAppVersion := strings.Repeat("a", 40)
	longInstallation := strings.Repeat("x", 140)
	md := metadata.Pairs(
		"x-client-ip", "203.0.113.9",
		"x-user-agent", "test-agent",
		"x-device-installation-id", longInstallation,
		"x-device-platform", "ANDROID",
		"x-app-version", longAppVersion,
		"x-os-version", "14",
		"x-device-model", "Pixel 8",
		"x-device-push-token", "push-token",
	)
	ctx := metadata.NewIncomingContext(context.Background(), md)
	meta := FromGRPCMeta(ctx)

	if meta.IPAddress != "203.0.113.9" {
		t.Fatalf("expected parsed ip, got %q", meta.IPAddress)
	}
	if meta.Platform != "android" {
		t.Fatalf("expected normalized platform android, got %q", meta.Platform)
	}
	if len(meta.InstallationID) != 128 {
		t.Fatalf("expected installation id length 128 after clipping, got %d", len(meta.InstallationID))
	}
	if len(meta.AppVersion) != 32 {
		t.Fatalf("expected app version length 32 after clipping, got %d", len(meta.AppVersion))
	}
	if meta.DeviceModel != "Pixel 8" {
		t.Fatalf("expected device model, got %q", meta.DeviceModel)
	}
}

func TestContextHelpers(t *testing.T) {
	base := context.Background()
	want := ClientMeta{Platform: "ios", InstallationID: "abc"}
	ctx := WithContext(base, want)
	got, ok := FromContext(ctx)
	if !ok {
		t.Fatal("expected context meta to be present")
	}
	if got.Platform != want.Platform || got.InstallationID != want.InstallationID {
		t.Fatalf("unexpected context meta: %+v", got)
	}
}
