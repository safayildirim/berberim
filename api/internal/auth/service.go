package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/berberim/api/internal/auth/jwt"
	"github.com/berberim/api/internal/requestmeta"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

const otpTTL = 5 * time.Minute

// SocialTokenVerifier verifies provider ID tokens and returns the provider's user ID.
type SocialTokenVerifier interface {
	Verify(ctx context.Context, provider, idToken string) (providerUserID string, err error)
}

// StubSocialTokenVerifier is used in development — returns the idToken itself as the providerUserID.
type StubSocialTokenVerifier struct{}

func (s *StubSocialTokenVerifier) Verify(_ context.Context, _, idToken string) (string, error) {
	return idToken, nil
}

type Service struct {
	log             *zap.Logger
	repo            *Repo
	jwt             *jwt.JWTManager
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
	socialVerifier  SocialTokenVerifier
}

func NewService(log *zap.Logger, repo *Repo, jwtMgr *jwt.JWTManager, accessTokenTTL, refreshTokenTTL time.Duration) *Service {
	return &Service{
		log:             log,
		repo:            repo,
		jwt:             jwtMgr,
		accessTokenTTL:  accessTokenTTL,
		refreshTokenTTL: refreshTokenTTL,
		socialVerifier:  &StubSocialTokenVerifier{},
	}
}

// ── Result types ──────────────────────────────────────────────────────────────

type AuthTokenResult struct {
	AccessToken  string
	RefreshToken string
	CustomerID   uuid.UUID
	IsNew        bool
}

type TenantUserLoginResult struct {
	AccessToken  string
	RefreshToken string
	UserID       uuid.UUID
	Role         string
}

type PlatformLoginResult struct {
	AccessToken  string
	RefreshToken string
	UserID       uuid.UUID
}

// ── Internal helpers ──────────────────────────────────────────────────────────

// generateOTPCode generates a cryptographically random 6-digit numeric string.
func generateOTPCode() string {
	max := big.NewInt(1_000_000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		panic(fmt.Sprintf("otp generation failed: %v", err))
	}
	return fmt.Sprintf("%06d", n.Int64())
}

// generateRefreshToken returns a cryptographically random 32-byte hex string.
func generateRefreshToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("refresh token generation failed: %v", err))
	}
	return hex.EncodeToString(b)
}

// hashRefreshToken returns SHA-256 hex of the raw token.
func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

type clientDeviceContext struct {
	IPAddress      *string
	UserAgent      *string
	InstallationID string
	Provider       string
	Platform       string
	AppVersion     *string
	Locale         *string
	Timezone       *string
	OSVersion      *string
	DeviceModel    *string
	PushToken      *string
}

func readClientDeviceContext(ctx context.Context, fallbackInstallationID string) clientDeviceContext {
	meta := clientDeviceContext{
		InstallationID: fallbackInstallationID,
		Provider:       "expo",
		Platform:       "web",
	}

	rm, ok := requestmeta.FromContext(ctx)
	if !ok {
		return meta
	}

	if rm.IPAddress != "" {
		meta.IPAddress = ptr(rm.IPAddress)
	}
	if rm.UserAgent != "" {
		meta.UserAgent = ptr(rm.UserAgent)
	}
	if rm.InstallationID != "" {
		meta.InstallationID = rm.InstallationID
	}
	if rm.Platform != "" {
		meta.Platform = rm.Platform
	}
	if rm.Provider != "" {
		meta.Provider = rm.Provider
	}
	if rm.AppVersion != "" {
		meta.AppVersion = ptr(rm.AppVersion)
	}
	if rm.Locale != "" {
		meta.Locale = ptr(rm.Locale)
	}
	if rm.Timezone != "" {
		meta.Timezone = ptr(rm.Timezone)
	}
	if rm.OSVersion != "" {
		meta.OSVersion = ptr(rm.OSVersion)
	}
	if rm.DeviceModel != "" {
		meta.DeviceModel = ptr(rm.DeviceModel)
	}
	if rm.PushToken != "" {
		meta.PushToken = ptr(rm.PushToken)
	}

	return meta
}

func ptr(s string) *string {
	return &s
}

// issueTokenPair creates a new session row and issues a JWT access token + opaque refresh token.
func (s *Service) issueTokenPair(ctx context.Context, userType string, userID uuid.UUID, tenantID *uuid.UUID, role string) (string, string, uuid.UUID,
	error) {
	sessionID := uuid.New()
	now := time.Now()
	rawRefresh := generateRefreshToken()
	hash := hashRefreshToken(rawRefresh)
	clientMeta := readClientDeviceContext(ctx, sessionID.String())

	var sessionDeviceID *uuid.UUID
	deviceID, err := s.repo.UpsertUserDevice(ctx, &UserDevice{
		UserType:       userType,
		UserID:         userID,
		TenantID:       tenantID,
		InstallationID: clientMeta.InstallationID,
		Provider:       clientMeta.Provider,
		PushToken:      clientMeta.PushToken,
		Platform:       clientMeta.Platform,
		AppVersion:     clientMeta.AppVersion,
		Locale:         clientMeta.Locale,
		Timezone:       clientMeta.Timezone,
		OSVersion:      clientMeta.OSVersion,
		DeviceModel:    clientMeta.DeviceModel,
		UserAgent:      clientMeta.UserAgent,
	})
	if err != nil {
		s.log.Warn("upsert user device failed", zap.String("user_type", userType), zap.String("user_id", userID.String()), zap.Error(err))
	} else {
		sessionDeviceID = &deviceID
	}

	session := &Session{
		ID:               sessionID,
		UserType:         userType,
		UserID:           userID,
		TenantID:         tenantID,
		RefreshTokenHash: hash,
		DeviceID:         sessionDeviceID,
		IPAddress:        clientMeta.IPAddress,
		UserAgent:        clientMeta.UserAgent,
		LastUsedAt:       now,
		ExpiresAt:        now.Add(s.refreshTokenTTL),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		return "", "", uuid.Nil, status.Errorf(codes.Internal, "create session: %v", err)
	}

	var tenantIDStr string
	if tenantID != nil {
		tenantIDStr = tenantID.String()
	}

	accessToken, err := s.jwt.IssueToken(ctx, jwt.IssueOpts{
		Subject:  userID.String(),
		JTI:      sessionID.String(),
		Type:     userType,
		TenantID: tenantIDStr,
		Role:     role,
		TTL:      s.accessTokenTTL,
	})
	if err != nil {
		if rErr := s.repo.RevokeSession(ctx, sessionID); rErr != nil {
			s.log.Error("failed to revoke orphaned session", zap.String("session_id", sessionID.String()), zap.Error(rErr))
		}
		return "", "", uuid.Nil, status.Errorf(codes.Internal, "issue jwt: %v", err)
	}

	return accessToken, rawRefresh, sessionID, nil
}

// ── Auth methods ──────────────────────────────────────────────────────────────

func (s *Service) SendCustomerOTP(ctx context.Context, phoneNumber string) (expiresInSeconds int32, err error) {
	customer, err := s.repo.GetCustomerByPhone(ctx, phoneNumber)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, status.Errorf(codes.Internal, "lookup customer: %v", err)
		}
		customer = &Customer{
			ID:          uuid.New(),
			PhoneNumber: phoneNumber,
			Status:      "active",
		}
		if err := s.repo.UpsertCustomer(ctx, customer); err != nil {
			return 0, status.Errorf(codes.Internal, "create customer: %v", err)
		}
	}

	_ = s.repo.InvalidatePendingOTPs(ctx, customer.ID)

	code := generateOTPCode()
	otp := &OTPCode{
		ID:         uuid.New(),
		CustomerID: customer.ID,
		Code:       code,
		ExpiresAt:  time.Now().Add(otpTTL),
	}
	if err := s.repo.CreateOTPCode(ctx, otp); err != nil {
		return 0, status.Errorf(codes.Internal, "create otp: %v", err)
	}

	s.log.Info("OTP code (mock SMS)", zap.String("phone", phoneNumber), zap.String("code", code))

	return int32(otpTTL.Seconds()), nil
}

func (s *Service) VerifyCustomerOTP(ctx context.Context, phoneNumber, code string) (AuthTokenResult, error) {
	customer, err := s.repo.GetCustomerByPhone(ctx, phoneNumber)
	if err != nil {
		return AuthTokenResult{}, status.Error(codes.Unauthenticated, "invalid or expired OTP code")
	}

	otp, err := s.repo.FindValidOTPCode(ctx, customer.ID, code)
	if err != nil {
		return AuthTokenResult{}, status.Error(codes.Unauthenticated, "invalid or expired OTP code")
	}

	if err := s.repo.MarkOTPVerified(ctx, otp.ID); err != nil {
		return AuthTokenResult{}, status.Errorf(codes.Internal, "mark otp verified: %v", err)
	}

	// Customer JWT has no tenant_id — tenant context comes from X-Tenant-ID header.
	accessToken, rawRefresh, _, err := s.issueTokenPair(ctx, "customer", customer.ID, nil, "")
	if err != nil {
		return AuthTokenResult{}, err
	}

	// A customer is "new" if they were just created (no name set yet).
	isNew := customer.FirstName == nil && customer.LastName == nil

	return AuthTokenResult{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		CustomerID:   customer.ID,
		IsNew:        isNew,
	}, nil
}

func (s *Service) VerifyCustomerSocialLogin(ctx context.Context, provider, idToken string) (AuthTokenResult, error) {
	providerUserID, err := s.socialVerifier.Verify(ctx, provider, idToken)
	if err != nil {
		return AuthTokenResult{}, status.Error(codes.Unauthenticated, "invalid social token")
	}

	ident, err := s.repo.GetCustomerIdentity(ctx, provider, providerUserID)

	var customer *Customer
	isNew := false

	if errors.Is(err, gorm.ErrRecordNotFound) {
		isNew = true
		customer = &Customer{
			ID:     uuid.New(),
			Status: "active",
		}
		if err := s.repo.UpsertCustomer(ctx, customer); err != nil {
			return AuthTokenResult{}, status.Errorf(codes.Internal, "create customer: %v", err)
		}
		ci := &CustomerIdentity{
			ID:             uuid.New(),
			CustomerID:     customer.ID,
			Provider:       provider,
			ProviderUserID: providerUserID,
		}
		if err := s.repo.CreateCustomerIdentity(ctx, ci); err != nil {
			return AuthTokenResult{}, status.Errorf(codes.Internal, "create identity: %v", err)
		}
	} else if err != nil {
		return AuthTokenResult{}, status.Errorf(codes.Internal, "lookup identity: %v", err)
	} else {
		customer, err = s.repo.GetCustomerByID(ctx, ident.CustomerID)
		if err != nil {
			return AuthTokenResult{}, status.Errorf(codes.Internal, "lookup customer: %v", err)
		}
	}

	// Customer JWT has no tenant_id.
	accessToken, rawRefresh, _, err := s.issueTokenPair(ctx, "customer", customer.ID, nil, "")
	if err != nil {
		return AuthTokenResult{}, err
	}

	return AuthTokenResult{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		CustomerID:   customer.ID,
		IsNew:        isNew,
	}, nil
}

func (s *Service) LoginTenantUser(ctx context.Context, tenantID uuid.UUID, email, password string) (TenantUserLoginResult, error) {
	tenant, err := s.repo.GetTenantByID(ctx, tenantID)
	if err != nil || tenant.Status != "active" {
		return TenantUserLoginResult{}, status.Error(codes.FailedPrecondition, "tenant is inactive")
	}

	user, err := s.repo.GetTenantUserByEmail(ctx, tenantID, email)
	if err != nil {
		return TenantUserLoginResult{}, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return TenantUserLoginResult{}, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if user.Status != "active" {
		return TenantUserLoginResult{}, status.Error(codes.PermissionDenied, "user is disabled")
	}

	tid := tenantID
	accessToken, rawRefresh, _, err := s.issueTokenPair(ctx, "tenant_user", user.ID, &tid, user.Role)
	if err != nil {
		return TenantUserLoginResult{}, err
	}

	return TenantUserLoginResult{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		UserID:       user.ID,
		Role:         user.Role,
	}, nil
}

func (s *Service) LoginPlatformUser(ctx context.Context, email, password string) (PlatformLoginResult, error) {
	user, err := s.repo.GetPlatformUserByEmail(ctx, email)
	if err != nil {
		return PlatformLoginResult{}, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return PlatformLoginResult{}, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if user.Status != "active" {
		return PlatformLoginResult{}, status.Error(codes.PermissionDenied, "user is disabled")
	}

	accessToken, rawRefresh, _, err := s.issueTokenPair(ctx, "platform_user", user.ID, nil, "")
	if err != nil {
		return PlatformLoginResult{}, err
	}

	return PlatformLoginResult{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		UserID:       user.ID,
	}, nil
}

func (s *Service) RefreshToken(ctx context.Context, refreshToken string) (accessToken string, err error) {
	hash := hashRefreshToken(refreshToken)

	session, err := s.repo.GetSessionByTokenHash(ctx, hash)
	if err != nil {
		return "", status.Error(codes.Unauthenticated, "invalid refresh token")
	}
	if session.RevokedAt != nil {
		return "", status.Error(codes.Unauthenticated, "invalid refresh token")
	}
	if time.Now().After(session.ExpiresAt) {
		return "", status.Error(codes.Unauthenticated, "refresh token expired")
	}

	clientMeta := readClientDeviceContext(ctx, "")
	_ = s.repo.UpdateSessionActivity(ctx, session.ID, clientMeta.IPAddress, clientMeta.UserAgent)

	if session.DeviceID != nil {
		_ = s.repo.TouchUserDevice(ctx, *session.DeviceID, clientMeta.AppVersion, clientMeta.OSVersion, clientMeta.DeviceModel, clientMeta.UserAgent)
	} else if clientMeta.InstallationID != "" {
		deviceID, dErr := s.repo.UpsertUserDevice(ctx, &UserDevice{
			UserType:       session.UserType,
			UserID:         session.UserID,
			TenantID:       session.TenantID,
			InstallationID: clientMeta.InstallationID,
			Provider:       clientMeta.Provider,
			PushToken:      clientMeta.PushToken,
			Platform:       clientMeta.Platform,
			AppVersion:     clientMeta.AppVersion,
			Locale:         clientMeta.Locale,
			Timezone:       clientMeta.Timezone,
			OSVersion:      clientMeta.OSVersion,
			DeviceModel:    clientMeta.DeviceModel,
			UserAgent:      clientMeta.UserAgent,
		})
		if dErr == nil {
			_ = s.repo.UpdateSessionDeviceID(ctx, session.ID, deviceID)
		}
	}

	var tenantIDStr string
	if session.TenantID != nil {
		tenantIDStr = session.TenantID.String()
	}

	// Re-fetch role for tenant_user tokens so role changes take effect on refresh.
	role := ""
	if session.UserType == "tenant_user" && session.TenantID != nil {
		if u, err := s.repo.GetTenantUserByID(ctx, *session.TenantID, session.UserID); err == nil {
			role = u.Role
		}
	}

	accessToken, err = s.jwt.IssueToken(ctx, jwt.IssueOpts{
		Subject:  session.UserID.String(),
		JTI:      session.ID.String(),
		Type:     session.UserType,
		TenantID: tenantIDStr,
		Role:     role,
		TTL:      s.accessTokenTTL,
	})
	if err != nil {
		return "", status.Errorf(codes.Internal, "issue token: %v", err)
	}

	return accessToken, nil
}

func (s *Service) Logout(ctx context.Context, refreshToken string) {
	hash := hashRefreshToken(refreshToken)
	session, err := s.repo.GetSessionByTokenHash(ctx, hash)
	if err != nil {
		return
	}
	_ = s.repo.RevokeSession(ctx, session.ID)
}

func (s *Service) LogoutAll(ctx context.Context, tokenType string, userID uuid.UUID) (int32, error) {
	count, err := s.repo.RevokeAllUserSessions(ctx, tokenType, userID)
	if err != nil {
		return 0, status.Errorf(codes.Internal, "revoke sessions: %v", err)
	}
	return int32(count), nil
}

func (s *Service) ListSessions(ctx context.Context, tokenType string, userID uuid.UUID) ([]*Session, error) {
	sessions, err := s.repo.ListActiveSessions(ctx, tokenType, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list sessions: %v", err)
	}
	out := make([]*Session, len(sessions))
	for i := range sessions {
		out[i] = &sessions[i]
	}
	return out, nil
}

func (s *Service) RevokeSession(ctx context.Context, sessionID uuid.UUID) error {
	if err := s.repo.RevokeSession(ctx, sessionID); err != nil {
		return status.Errorf(codes.Internal, "revoke session: %v", err)
	}
	return nil
}

func strOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
