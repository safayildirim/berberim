package config

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Env         string      `mapstructure:"env"`
	Port        string      `mapstructure:"port"`
	APIGRPCAddr string      `mapstructure:"api_grpc_addr"`
	Authz       AuthzConfig `mapstructure:"authz"`
}

type AuthzConfig struct {
	JWKSUrl     string        `mapstructure:"jwks_url"`
	Issuer      string        `mapstructure:"issuer"`
	AllowedAlgs []string      `mapstructure:"allowed_algs"`
	ClockSkew   time.Duration `mapstructure:"clock_skew"`
}

func LoadConfig() *Config {
	env := os.Getenv("ENV")
	if env == "" {
		env = "dev"
	}

	v := viper.New()
	v.SetConfigType("yml")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()
	v.AddConfigPath("config")
	v.AddConfigPath("./config")

	v.SetConfigName("base")
	if err := v.ReadInConfig(); err != nil {
		log.Printf("Base config not found, using env/defaults: %v", err)
	}

	v.SetConfigName(env)
	if err := v.MergeInConfig(); err != nil {
		log.Printf("Env config not found (%s), using base/env/defaults: %v", env, err)
	}

	cfg := &Config{}
	if err := v.Unmarshal(cfg); err != nil {
		log.Printf("Config unmarshal error: %v", err)
	}

	cfg.Env = env

	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	if s := os.Getenv("API_GRPC_ADDR"); s != "" {
		cfg.APIGRPCAddr = s
	}

	if s := os.Getenv("AUTHZ_ISSUER"); s != "" {
		cfg.Authz.Issuer = s
	}

	if s := os.Getenv("AUTHZ_JWKS_URL"); s != "" {
		cfg.Authz.JWKSUrl = s
	}

	if s := os.Getenv("AUTHZ_ALLOWED_ALGS"); s != "" {
		cfg.Authz.AllowedAlgs = strings.Split(s, ",")
	}

	if s := os.Getenv("AUTHZ_CLOCK_SKEW"); s != "" {
		d, err := time.ParseDuration(s)
		if err != nil {
			log.Fatalf("AUTHZ_CLOCK_SKEW invalid: %v", err)
		}
		cfg.Authz.ClockSkew = d
	}

	if len(cfg.Authz.AllowedAlgs) == 0 {
		cfg.Authz.AllowedAlgs = []string{"RS256"}
	}

	if cfg.Authz.ClockSkew == 0 {
		cfg.Authz.ClockSkew = 30 * time.Second
	}

	return cfg
}
