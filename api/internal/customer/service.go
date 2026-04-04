package customer

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Service struct {
	repo *Repo
}

func NewService(repo *Repo) *Service {
	return &Service{repo: repo}
}

type UpdateProfileRequest struct {
	FirstName string
	LastName  string
	AvatarURL string
}

func (s *Service) GetProfile(ctx context.Context, tenantID, customerID uuid.UUID) (*Customer, error) {
	c, err := s.repo.GetByID(ctx, tenantID, customerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "customer not found")
		}
		return nil, status.Errorf(codes.Internal, "get customer: %v", err)
	}
	return c, nil
}

func (s *Service) UpdateCustomer(ctx context.Context, tenantID, customerID uuid.UUID, req UpdateProfileRequest) (*Customer, error) {
	updates := map[string]any{}
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if len(updates) == 0 {
		return s.GetProfile(ctx, tenantID, customerID)
	}
	c, err := s.repo.Update(ctx, tenantID, customerID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "customer not found")
		}
		return nil, status.Errorf(codes.Internal, "update customer: %v", err)
	}
	return c, nil
}

func (s *Service) SetCustomerStatus(ctx context.Context, tenantID, customerID uuid.UUID, customerStatus string) error {
	valid := map[string]bool{"active": true, "disabled": true}
	if !valid[customerStatus] {
		return status.Errorf(codes.InvalidArgument, "invalid status %q", customerStatus)
	}
	if err := s.repo.UpdateStatus(ctx, tenantID, customerID, customerStatus); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return status.Error(codes.NotFound, "customer not found")
		}
		return status.Errorf(codes.Internal, "set customer status: %v", err)
	}
	return nil
}

func (s *Service) UpdateProfile(ctx context.Context, tenantID, customerID uuid.UUID, req UpdateProfileRequest) (*Customer, error) {
	updates := map[string]any{}
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}
	if len(updates) == 0 {
		return nil, status.Error(codes.InvalidArgument, "at least one field must be provided")
	}
	c, err := s.repo.Update(ctx, tenantID, customerID, updates)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, status.Error(codes.NotFound, "customer not found")
		}
		return nil, status.Errorf(codes.Internal, "update customer: %v", err)
	}
	return c, nil
}
