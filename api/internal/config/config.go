package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Env               string
	Port              string       `mapstructure:"port"`
	GrpcPort          string       `mapstructure:"grpc_port"`
	HttpListenAddress string       `mapstructure:"http_listen_address"`
	DB                DBConfig     `mapstructure:"db"`
	JWT               JWTConfig    `mapstructure:"jwt"`
	Avatar            AvatarConfig `mapstructure:"avatar"`
	SMS               SMSConfig    `mapstructure:"sms"`
}

type SMSConfig struct {
	AccountSID string `mapstructure:"account_sid"`
	AuthToken  string `mapstructure:"auth_token"`
	FromNumber string `mapstructure:"from_number"`
}

type AvatarConfig struct {
	Bucket          string        `mapstructure:"bucket"`
	BaseURL         string        `mapstructure:"base_url"`
	MaxFileSize     int64         `mapstructure:"max_file_size"`
	UploadURLExpiry time.Duration `mapstructure:"upload_url_expiry"`
	AllowedTypes    []string      `mapstructure:"allowed_types"`
}

// PublicURL constructs the full avatar URL from an object key.
// Returns empty string if objectKey is empty.
func (c *AvatarConfig) PublicURL(objectKey string) string {
	if objectKey == "" {
		return ""
	}
	return c.BaseURL + "/" + objectKey
}

type DBConfig struct {
	URL  string       `mapstructure:"url"`
	Pool DBPoolConfig `mapstructure:"pool"`
}

// DBPoolConfig controls the sql.DB connection pool.
// Safe defaults are set in Load(); Cloud Run environments override via env vars.
type DBPoolConfig struct {
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `mapstructure:"conn_max_idle_time"`
}

type JWTConfig struct {
	Issuer          string        `mapstructure:"issuer"`
	Algorithm       string        `mapstructure:"algorithm"`
	AccessTokenTTL  time.Duration `mapstructure:"access_token_ttl"`
	RefreshTokenTTL time.Duration `mapstructure:"refresh_token_ttl"`
	PrivateKeyPath  string        `mapstructure:"private_key_path"`
}

func Load() *Config {
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
		log.Printf("base config not found: %v", err)
	}

	v.SetConfigName(env)
	if err := v.MergeInConfig(); err != nil {
		log.Printf("env config (%s) not found: %v", env, err)
	}

	cfg := &Config{}
	if err := v.Unmarshal(cfg); err != nil {
		log.Printf("config unmarshal error: %v", err)
	}
	cfg.Env = env

	if p := os.Getenv("PORT"); p != "" {
		cfg.Port = p
	}
	if gp := os.Getenv("GRPC_PORT"); gp != "" {
		cfg.GrpcPort = gp
	}
	if addr := os.Getenv("HTTP_LISTEN_ADDRESS"); addr != "" {
		cfg.HttpListenAddress = addr
	}
	if u := os.Getenv("DB_URL"); u != "" {
		cfg.DB.URL = u
	}
	if iss := os.Getenv("JWT_ISSUER"); iss != "" {
		cfg.JWT.Issuer = iss
	}
	if path := os.Getenv("JWT_PRIVATE_KEY_PATH"); path != "" {
		cfg.JWT.PrivateKeyPath = path
	}
	if ttls := os.Getenv("JWT_ACCESS_TOKEN_TTL"); ttls != "" {
		if d, err := time.ParseDuration(ttls); err == nil {
			cfg.JWT.AccessTokenTTL = d
		}
	}
	if ttls := os.Getenv("JWT_REFRESH_TOKEN_TTL"); ttls != "" {
		if d, err := time.ParseDuration(ttls); err == nil {
			cfg.JWT.RefreshTokenTTL = d
		}
	}

	// Avatar env var overrides
	if b := os.Getenv("AVATAR_BUCKET"); b != "" {
		cfg.Avatar.Bucket = b
	}
	if u := os.Getenv("AVATAR_BASE_URL"); u != "" {
		cfg.Avatar.BaseURL = u
	}

	// SMS (Twilio) env var overrides
	if v := os.Getenv("TWILIO_ACCOUNT_SID"); v != "" {
		cfg.SMS.AccountSID = v
	}
	if v := os.Getenv("TWILIO_AUTH_TOKEN"); v != "" {
		cfg.SMS.AuthToken = v
	}
	if v := os.Getenv("TWILIO_FROM_NUMBER"); v != "" {
		cfg.SMS.FromNumber = v
	}

	// DB pool env var overrides (used in Cloud Run to tune for Neon)
	if v := os.Getenv("DB_MAX_OPEN_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			cfg.DB.Pool.MaxOpenConns = n
		}
	}
	if v := os.Getenv("DB_MAX_IDLE_CONNS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			cfg.DB.Pool.MaxIdleConns = n
		}
	}
	if v := os.Getenv("DB_CONN_MAX_LIFETIME"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			cfg.DB.Pool.ConnMaxLifetime = d
		}
	}
	if v := os.Getenv("DB_CONN_MAX_IDLE_TIME"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			cfg.DB.Pool.ConnMaxIdleTime = d
		}
	}

	// DB pool defaults (local dev / unset)
	if cfg.DB.Pool.MaxOpenConns == 0 {
		cfg.DB.Pool.MaxOpenConns = 25
	}
	if cfg.DB.Pool.MaxIdleConns == 0 {
		cfg.DB.Pool.MaxIdleConns = 10
	}
	if cfg.DB.Pool.ConnMaxLifetime == 0 {
		cfg.DB.Pool.ConnMaxLifetime = time.Hour
	}
	if cfg.DB.Pool.ConnMaxIdleTime == 0 {
		cfg.DB.Pool.ConnMaxIdleTime = 10 * time.Minute
	}

	// JWT defaults
	if cfg.JWT.AccessTokenTTL == 0 {
		cfg.JWT.AccessTokenTTL = 15 * time.Minute
	}
	if cfg.JWT.RefreshTokenTTL == 0 {
		cfg.JWT.RefreshTokenTTL = 30 * 24 * time.Hour
	}
	if cfg.JWT.Algorithm == "" {
		cfg.JWT.Algorithm = "RS256"
	}

	// Avatar defaults
	if cfg.Avatar.MaxFileSize == 0 {
		cfg.Avatar.MaxFileSize = 5 * 1024 * 1024 // 5MB
	}
	if cfg.Avatar.UploadURLExpiry == 0 {
		cfg.Avatar.UploadURLExpiry = 15 * time.Minute
	}
	if len(cfg.Avatar.AllowedTypes) == 0 {
		cfg.Avatar.AllowedTypes = []string{"image/jpeg", "image/png", "image/webp"}
	}

	return cfg
}
