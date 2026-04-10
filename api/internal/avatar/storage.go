package avatar

import (
	"context"
	"strconv"
	"time"

	"cloud.google.com/go/storage"
)

// Storage abstracts GCS operations needed for avatar management.
type Storage interface {
	GenerateSignedUploadURL(ctx context.Context, objectKey, contentType string, maxFileSize int64, expiry time.Duration) (string, error)
	ObjectAttrs(ctx context.Context, objectKey string) (*ObjectAttrs, error)
	Delete(ctx context.Context, objectKey string) error
}

// ObjectAttrs contains the subset of GCS object metadata we inspect on confirm.
type ObjectAttrs struct {
	Size        int64
	ContentType string
}

type gcsStorage struct {
	client *storage.Client
	bucket string
}

// NewGCSStorage creates a Storage backed by Google Cloud Storage.
func NewGCSStorage(client *storage.Client, bucket string) Storage {
	return &gcsStorage{client: client, bucket: bucket}
}

func (s *gcsStorage) GenerateSignedUploadURL(ctx context.Context, objectKey, contentType string, maxFileSize int64, expiry time.Duration) (string, error) {
	url, err := s.client.Bucket(s.bucket).SignedURL(objectKey, &storage.SignedURLOptions{
		Method:      "PUT",
		Expires:     time.Now().Add(expiry),
		ContentType: contentType,
		Headers: []string{
			"x-goog-content-length-range:0," + strconv.FormatInt(maxFileSize, 10),
		},
		Scheme: storage.SigningSchemeV4,
	})
	return url, err
}

func (s *gcsStorage) ObjectAttrs(ctx context.Context, objectKey string) (*ObjectAttrs, error) {
	attrs, err := s.client.Bucket(s.bucket).Object(objectKey).Attrs(ctx)
	if err != nil {
		return nil, err
	}
	return &ObjectAttrs{
		Size:        attrs.Size,
		ContentType: attrs.ContentType,
	}, nil
}

func (s *gcsStorage) Delete(ctx context.Context, objectKey string) error {
	return s.client.Bucket(s.bucket).Object(objectKey).Delete(ctx)
}
