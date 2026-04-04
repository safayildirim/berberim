package review

import (
	"context"
	"math"
	"time"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ── CreateStaffReview ────────────────────────────────────────────────────────

func (h *Handler) CreateStaffReview(ctx context.Context, req *berberimv1.CreateStaffReviewRequest) (*berberimv1.CreateStaffReviewResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	appointmentID, err := uuid.Parse(req.AppointmentId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid appointment_id")
	}

	var comment *string
	if req.Comment != "" {
		comment = &req.Comment
	}

	rev, err := h.svc.CreateReview(ctx, rc.TenantID, rc.UserID, appointmentID, int(req.Rating), comment, req.IsAnonymous)
	if err != nil {
		return nil, err
	}
	return &berberimv1.CreateStaffReviewResponse{Review: reviewToProto(rev, false)}, nil
}

// ── UpdateStaffReview ────────────────────────────────────────────────────────

func (h *Handler) UpdateStaffReview(ctx context.Context, req *berberimv1.UpdateStaffReviewRequest) (*berberimv1.UpdateStaffReviewResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	reviewID, err := uuid.Parse(req.ReviewId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid review_id")
	}

	var rating *int
	if req.Rating != nil {
		r := int(*req.Rating)
		rating = &r
	}
	var comment *string
	if req.Comment != nil {
		comment = req.Comment
	}
	var isAnonymous *bool
	if req.IsAnonymous != nil {
		isAnonymous = req.IsAnonymous
	}

	rev, err := h.svc.UpdateReview(ctx, rc.TenantID, rc.UserID, reviewID, rating, comment, isAnonymous)
	if err != nil {
		return nil, err
	}
	return &berberimv1.UpdateStaffReviewResponse{Review: reviewToProto(rev, false)}, nil
}

// ── DeleteStaffReview ────────────────────────────────────────────────────────

func (h *Handler) DeleteStaffReview(ctx context.Context, req *berberimv1.DeleteStaffReviewRequest) (*berberimv1.DeleteStaffReviewResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	reviewID, err := uuid.Parse(req.ReviewId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid review_id")
	}

	if err := h.svc.DeleteReview(ctx, rc.TenantID, rc.UserID, reviewID); err != nil {
		return nil, err
	}
	return &berberimv1.DeleteStaffReviewResponse{}, nil
}

// ── ListStaffReviews ─────────────────────────────────────────────────────────

func (h *Handler) ListStaffReviews(ctx context.Context, req *berberimv1.ListStaffReviewsRequest) (*berberimv1.ListStaffReviewsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	staffUserID, err := uuid.Parse(req.StaffUserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid staff_user_id")
	}

	reviews, total, err := h.svc.ListStaffReviews(ctx, rc.TenantID, staffUserID, int(req.Page), int(req.PageSize))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "list reviews: %v", err)
	}

	out := make([]*berberimv1.StaffReview, 0, len(reviews))
	for i := range reviews {
		out = append(out, reviewToProto(&reviews[i], true))
	}

	pageSize := int(req.PageSize)
	if pageSize < 1 {
		pageSize = 20
	}
	totalPages := int32(math.Ceil(float64(total) / float64(pageSize)))

	return &berberimv1.ListStaffReviewsResponse{
		Reviews:    out,
		Total:      int32(total),
		TotalPages: totalPages,
	}, nil
}

// ── GetMyReviewForAppointment ────────────────────────────────────────────────

func (h *Handler) GetMyReviewForAppointment(ctx context.Context, req *berberimv1.GetMyReviewForAppointmentRequest) (*berberimv1.GetMyReviewForAppointmentResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	appointmentID, err := uuid.Parse(req.AppointmentId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid appointment_id")
	}

	rev, err := h.svc.GetReviewByAppointment(ctx, rc.TenantID, appointmentID, rc.UserID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get review: %v", err)
	}

	resp := &berberimv1.GetMyReviewForAppointmentResponse{}
	if rev != nil {
		resp.Review = reviewToProto(rev, false)
	}
	return resp, nil
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// reviewToProto converts a Review to proto. When stripAnonymous is true and the
// review is anonymous, customer_id is omitted from the response.
func reviewToProto(r *Review, stripAnonymous bool) *berberimv1.StaffReview {
	p := &berberimv1.StaffReview{
		Id:            r.ID.String(),
		AppointmentId: r.AppointmentID.String(),
		StaffUserId:   r.StaffUserID.String(),
		Rating:        int32(r.Rating),
		IsAnonymous:   r.IsAnonymous,
		CreatedAt:     r.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:     r.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if r.Comment != nil {
		p.Comment = *r.Comment
	}
	if !r.IsAnonymous || !stripAnonymous {
		p.CustomerId = r.CustomerID.String()
		p.CustomerName = r.CustomerName
	}
	return p
}
