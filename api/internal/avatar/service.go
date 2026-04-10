package avatar

import (
	"context"
	"fmt"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/berberim/api/internal/config"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// UserType distinguishes customer avatars from staff avatars.
type UserType string

const (
	UserTypeCustomer UserType = "customer"
	UserTypeStaff    UserType = "staff"
)

// AvatarRepo is a narrow interface for reading and updating avatar keys on a user.
// Both customer.Repo and tenant.Repo satisfy this through adapter methods.
type AvatarRepo interface {
	GetAvatarKey(ctx context.Context, tenantID, userID uuid.UUID) (string, error)
	SetAvatarKey(ctx context.Context, tenantID, userID uuid.UUID, avatarKey string) error
}

// objectKeyRegex validates the expected format: avatars/{uuid}.{ext}
var objectKeyRegex = regexp.MustCompile(`^avatars/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$`)

// extForContentType maps allowed content types to file extensions.
var extForContentType = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
}

type Service struct {
	cfg          *config.AvatarConfig
	logger       *zap.Logger
	storage      Storage
	allowedTypes map[string]bool // derived from cfg.AllowedTypes for fast lookup
	customerRepo AvatarRepo
	staffRepo    AvatarRepo
}

func NewService(
	cfg *config.AvatarConfig,
	logger *zap.Logger,
	storage Storage,
	customerRepo AvatarRepo,
	staffRepo AvatarRepo,
) *Service {
	allowed := make(map[string]bool, len(cfg.AllowedTypes))
	for _, t := range cfg.AllowedTypes {
		allowed[t] = true
	}
	return &Service{
		cfg:          cfg,
		logger:       logger,
		storage:      storage,
		allowedTypes: allowed,
		customerRepo: customerRepo,
		staffRepo:    staffRepo,
	}
}

// GenerateUploadURL validates the request and returns a signed PUT URL for direct GCS upload.
func (s *Service) GenerateUploadURL(ctx context.Context, contentType string, fileSize int64) (uploadURL, objectKey string, err error) {
	if !s.allowedTypes[contentType] {
		return "", "", status.Errorf(codes.InvalidArgument, "unsupported content type %q", contentType)
	}
	if fileSize <= 0 || fileSize > s.cfg.MaxFileSize {
		return "", "", status.Errorf(codes.InvalidArgument, "file_size must be between 1 and %d bytes", s.cfg.MaxFileSize)
	}

	ext := extForContentType[contentType]
	objectKey = fmt.Sprintf("avatars/%s.%s", uuid.New().String(), ext)

	uploadURL, err = s.storage.GenerateSignedUploadURL(ctx, objectKey, contentType, s.cfg.MaxFileSize, s.cfg.UploadURLExpiry)
	if err != nil {
		return "", "", status.Errorf(codes.Internal, "generate signed URL: %v", err)
	}

	return uploadURL, objectKey, nil
}

// ConfirmUpload verifies the uploaded object and persists the new avatar key.
func (s *Service) ConfirmUpload(ctx context.Context, userType UserType, tenantID, userID uuid.UUID, objectKey string) (string, error) {
	// 1. Validate object key format.
	if !objectKeyRegex.MatchString(objectKey) {
		return "", status.Error(codes.InvalidArgument, "invalid object_key format")
	}

	// 2. Fetch object metadata from GCS — existence check + metadata source.
	attrs, err := s.storage.ObjectAttrs(ctx, objectKey)
	if err != nil {
		return "", status.Errorf(codes.NotFound, "object not found in storage: %v", err)
	}

	// 3. Revalidate object size.
	if attrs.Size <= 0 || attrs.Size > s.cfg.MaxFileSize {
		s.deleteObjectBestEffort(objectKey)
		return "", status.Errorf(codes.InvalidArgument, "uploaded object size %d exceeds limit", attrs.Size)
	}

	// 4. Revalidate content type.
	if !s.allowedTypes[attrs.ContentType] {
		s.deleteObjectBestEffort(objectKey)
		return "", status.Errorf(codes.InvalidArgument, "uploaded object has disallowed content type %q", attrs.ContentType)
	}

	// 5. Get current avatar key for old-object cleanup.
	repo := s.repoFor(userType)
	oldKey, _ := repo.GetAvatarKey(ctx, tenantID, userID) // ignore error — missing key just means no old avatar

	// 6. Persist new avatar key in DB.
	if err := repo.SetAvatarKey(ctx, tenantID, userID, objectKey); err != nil {
		return "", status.Errorf(codes.Internal, "update avatar: %v", err)
	}

	// 7. Best-effort delete of old avatar object.
	if oldKey != "" && oldKey != objectKey {
		s.deleteObjectBestEffort(oldKey)
	}

	// 8. Return full public URL.
	avatarURL := s.cfg.BaseURL + "/" + objectKey
	return avatarURL, nil
}

func (s *Service) repoFor(userType UserType) AvatarRepo {
	if userType == UserTypeStaff {
		return s.staffRepo
	}
	return s.customerRepo
}

// deleteObjectBestEffort tries to delete an object asynchronously, logging on failure.
func (s *Service) deleteObjectBestEffort(objectKey string) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := s.storage.Delete(ctx, objectKey); err != nil {
			s.logger.Warn("failed to delete avatar object",
				zap.String("key", objectKey),
				zap.Error(err),
			)
		}
	}()
}

// ContentTypeForExt returns the content type for a file extension found in an object key.
// Used by external code if needed; returns empty string for unknown extensions.
func ContentTypeForExt(objectKey string) string {
	ext := strings.TrimPrefix(path.Ext(objectKey), ".")
	for ct, e := range extForContentType {
		if e == ext {
			return ct
		}
	}
	return ""
}
