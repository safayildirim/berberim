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

func (s *Service) UpdateCustomer(ctx context.Context, customerID uuid.UUID, req UpdateProfileRequest) error {
	updates := map[string]any{}
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if len(updates) == 0 {
		return nil
	}
	if err := s.repo.Update(ctx, customerID, updates); err != nil {
		return status.Errorf(codes.Internal, "update customer: %v", err)
	}
	return nil
}

func (s *Service) UpdateProfile(ctx context.Context, customerID uuid.UUID, req UpdateProfileRequest) (*Customer, error) {
	updates := map[string]any{}
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if len(updates) == 0 {
		return nil, status.Error(codes.InvalidArgument, "at least one field must be provided")
	}
	if err := s.repo.Update(ctx, customerID, updates); err != nil {
		return nil, status.Errorf(codes.Internal, "update customer: %v", err)
	}
	// Return a minimal customer for the global profile response (no tenant context)
	var c Customer
	c.ID = customerID
	return &c, nil
}
