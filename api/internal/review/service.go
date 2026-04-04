package review

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Service struct {
	repo *Repo
	log  *zap.Logger
}

func NewService(repo *Repo, log *zap.Logger) *Service {
	return &Service{repo: repo, log: log}
}

func (s *Service) CreateReview(ctx context.Context, tenantID, customerID, appointmentID uuid.UUID, rating int, comment *string, isAnonymous bool) (*Review, error) {
	if rating < 1 || rating > 5 {
		return nil, status.Error(codes.InvalidArgument, "rating must be between 1 and 5")
	}

	var rev *Review
	err := s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		appt, err := s.repo.GetAppointmentForReview(txCtx, tenantID, appointmentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return status.Error(codes.NotFound, "appointment not found")
			}
			return fmt.Errorf("get appointment: %w", err)
		}
		if appt.CustomerID != customerID {
			return status.Error(codes.PermissionDenied, "appointment does not belong to this customer")
		}
		if appt.Status != "completed" {
			return status.Error(codes.FailedPrecondition, "can only review completed appointments")
		}

		now := time.Now()
		rev = &Review{
			ID:            uuid.New(),
			TenantID:      tenantID,
			AppointmentID: appointmentID,
			CustomerID:    customerID,
			StaffUserID:   appt.StaffUserID,
			Rating:        rating,
			Comment:       comment,
			IsAnonymous:   isAnonymous,
			CreatedAt:     now,
			UpdatedAt:     now,
		}

		if err := s.repo.Create(txCtx, rev); err != nil {
			if errors.Is(err, ErrDuplicateReview) {
				return status.Error(codes.AlreadyExists, "review already exists for this appointment")
			}
			return fmt.Errorf("create review: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return rev, nil
}

func (s *Service) UpdateReview(ctx context.Context, tenantID, customerID, reviewID uuid.UUID, rating *int, comment *string, isAnonymous *bool) (*Review, error) {
	updates := map[string]any{}
	if rating != nil {
		if *rating < 1 || *rating > 5 {
			return nil, status.Error(codes.InvalidArgument, "rating must be between 1 and 5")
		}
		updates["rating"] = *rating
	}
	if comment != nil {
		updates["comment"] = *comment
	}
	if isAnonymous != nil {
		updates["is_anonymous"] = *isAnonymous
	}
	if len(updates) == 0 {
		return nil, status.Error(codes.InvalidArgument, "at least one field must be provided")
	}

	var updated *Review
	err := s.repo.RunInTx(ctx, func(txCtx context.Context) error {
		rev, err := s.repo.GetByID(txCtx, tenantID, reviewID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return status.Error(codes.NotFound, "review not found")
			}
			return fmt.Errorf("get review: %w", err)
		}
		if rev.CustomerID != customerID {
			return status.Error(codes.PermissionDenied, "not your review")
		}

		updated, err = s.repo.Update(txCtx, tenantID, reviewID, updates)
		return err
	})
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (s *Service) DeleteReview(ctx context.Context, tenantID, customerID, reviewID uuid.UUID) error {
	if err := s.repo.Delete(ctx, tenantID, reviewID, customerID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "review not found")
		}
		return fmt.Errorf("delete review: %w", err)
	}
	return nil
}

func (s *Service) ListStaffReviews(ctx context.Context, tenantID, staffUserID uuid.UUID, page, pageSize int) ([]Review, int64, error) {
	return s.repo.ListByStaff(ctx, tenantID, staffUserID, page, pageSize)
}

func (s *Service) GetReviewByAppointment(ctx context.Context, tenantID, appointmentID, customerID uuid.UUID) (*Review, error) {
	return s.repo.GetByAppointmentAndCustomer(ctx, tenantID, appointmentID, customerID)
}
