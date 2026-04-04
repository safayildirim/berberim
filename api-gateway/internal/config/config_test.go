package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadConfig_BaseAndEnvOverride(t *testing.T) {
	workDir := t.TempDir()
	configDir := filepath.Join(workDir, "config")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}

	base := []byte(
		"port: \"8081\"\n" +
			"api_grpc_addr: \"base:9091\"\n" +
			"authz:\n" +
			"  issuer: \"https://issuer.base\"\n" +
			"  jwks_url: \"https://jwks.base\"\n" +
			"  allowed_algs:\n" +
			"    - RS256\n" +
			"  clock_skew: 45s\n",
	)
	if err := os.WriteFile(filepath.Join(configDir, "base.yml"), base, 0644); err != nil {
		t.Fatalf("write base config: %v", err)
	}

	envCfg := []byte(
		"port: \"9090\"\n" +
			"authz:\n" +
			"  issuer: \"https://issuer.dev\"\n" +
			"  jwks_url: \"https://jwks.dev\"\n",
	)
	if err := os.WriteFile(filepath.Join(configDir, "dev.yml"), envCfg, 0644); err != nil {
		t.Fatalf("write env config: %v", err)
	}

	origDir, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(origDir)
	})
	if err := os.Chdir(workDir); err != nil {
		t.Fatalf("chdir: %v", err)
	}

	t.Setenv("ENV", "dev")

	cfg := LoadConfig()
	if cfg.Port != "9090" {
		t.Fatalf("port override: got %s want 9090", cfg.Port)
	}
	if cfg.APIGRPCAddr != "base:9091" {
		t.Fatalf("api_grpc_addr base: got %v want base:9091", cfg.APIGRPCAddr)
	}
	if cfg.Authz.Issuer != "https://issuer.dev" {
		t.Fatalf("issuer override: got %s want https://issuer.dev", cfg.Authz.Issuer)
	}
	if cfg.Authz.ClockSkew.String() != "45s" {
		t.Fatalf("clock_skew base: got %s want 45s", cfg.Authz.ClockSkew)
	}
	if len(cfg.Authz.AllowedAlgs) == 0 || cfg.Authz.AllowedAlgs[0] != "RS256" {
		t.Fatalf("allowed_algs base: got %v want []string{\"RS256\"}", cfg.Authz.AllowedAlgs)
	}
}

func TestLoadConfig_EnvMissingUsesBase(t *testing.T) {
	workDir := t.TempDir()
	configDir := filepath.Join(workDir, "config")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		t.Fatalf("mkdir config dir: %v", err)
	}

	base := []byte(
		"port: \"8082\"\n" +
			"api_grpc_addr: \"base:9091\"\n" +
			"authz:\n" +
			"  issuer: \"https://issuer.base\"\n" +
			"  jwks_url: \"https://jwks.base\"\n",
	)
	if err := os.WriteFile(filepath.Join(configDir, "base.yml"), base, 0644); err != nil {
		t.Fatalf("write base config: %v", err)
	}

	origDir, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Chdir(origDir)
	})
	if err := os.Chdir(workDir); err != nil {
		t.Fatalf("chdir: %v", err)
	}

	t.Setenv("ENV", "staging")

	cfg := LoadConfig()
	if cfg.Port != "8082" {
		t.Fatalf("port base: got %s want 8082", cfg.Port)
	}
	if cfg.APIGRPCAddr != "base:9091" {
		t.Fatalf("api_grpc_addr base: got %v want base:9091", cfg.APIGRPCAddr)
	}
	if cfg.Authz.Issuer != "https://issuer.base" {
		t.Fatalf("issuer base: got %s want https://issuer.base", cfg.Authz.Issuer)
	}
}
