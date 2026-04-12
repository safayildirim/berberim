package appointment

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/config"
	"github.com/berberim/api/internal/identity"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Handler struct {
	svc       *Service
	log       *zap.Logger
	avatarCfg *config.AvatarConfig
}

func NewHandler(svc *Service, log *zap.Logger, avatarCfg *config.AvatarConfig) *Handler {
	return &Handler{svc: svc, log: log, avatarCfg: avatarCfg}
}

// ── SearchAvailability ────────────────────────────────────────────────────────

func (h *Handler) SearchAvailability(ctx context.Context, req *berberimv1.SearchAvailabilityRequest) (*berberimv1.SearchAvailabilityResponse, error) {
	// tenant_id can come from metadata (authenticated) or request body (public).
	tenantID, err := resolveTenantID(ctx, req.TenantId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid or missing tenant_id")
	}
	if len(req.ServiceIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "service_ids must not be empty")
	}
	serviceIDs := make([]uuid.UUID, 0, len(req.ServiceIds))
	for _, raw := range req.ServiceIds {
		id, err := uuid.Parse(raw)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid service_id %q", raw)
		}
		serviceIDs = append(serviceIDs, id)
	}

	var staffUserID uuid.UUID
	if req.StaffUserId != "" {
		staffUserID, err = uuid.Parse(req.StaffUserId)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid staff_user_id %q", req.StaffUserId)
		}
	}

	slots, filled, err := h.svc.SearchAvailability(ctx, SearchAvailabilityRequest{
		TenantID:    tenantID,
		ServiceIDs:  serviceIDs,
		Date:        req.Date,
		StaffUserID: staffUserID,
	})
	if err != nil {
		return nil, mapErr(err)
	}

	out := make([]*berberimv1.AvailableSlot, 0, len(slots))
	for _, sl := range slots {
		staffOptions := make([]*berberimv1.StaffOption, 0, len(sl.AvailableStaff))
		for _, s := range sl.AvailableStaff {
			opt := &berberimv1.StaffOption{
				StaffUserId: s.ID.String(),
				FirstName:   s.FirstName,
				LastName:    s.LastName,
				AvgRating:   s.AvgRating,
				ReviewCount: int32(s.ReviewCount),
			}
			if s.AvatarKey != nil {
				url := h.avatarCfg.PublicURL(*s.AvatarKey)
				opt.AvatarUrl = &url
			}
			opt.Specialty = s.Specialty
			opt.Bio = s.Bio
			staffOptions = append(staffOptions, opt)
		}
		out = append(out, &berberimv1.AvailableSlot{
			StartsAt:       sl.StartsAt.UTC().Format(time.RFC3339),
			EndsAt:         sl.EndsAt.UTC().Format(time.RFC3339),
			AvailableStaff: staffOptions,
		})
	}

	outFilled := make([]*berberimv1.FilledSlot, 0, len(filled))
	for _, fl := range filled {
		outFilled = append(outFilled, &berberimv1.FilledSlot{
			StartsAt: fl.StartsAt.UTC().Format(time.RFC3339),
			EndsAt:   fl.EndsAt.UTC().Format(time.RFC3339),
		})
	}

	return &berberimv1.SearchAvailabilityResponse{Slots: out, FilledSlots: outFilled}, nil
}

// ── SearchMultiDayAvailability ───────────────────────────────────────────────

func (h *Handler) SearchMultiDayAvailability(ctx context.Context, req *berberimv1.SearchMultiDayAvailabilityRequest) (*berberimv1.SearchMultiDayAvailabilityResponse, error) {
	tenantID, err := resolveTenantID(ctx, req.TenantId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid or missing tenant_id")
	}
	if len(req.ServiceIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "service_ids must not be empty")
	}
	serviceIDs := make([]uuid.UUID, 0, len(req.ServiceIds))
	for _, raw := range req.ServiceIds {
		id, err := uuid.Parse(raw)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid service_id %q", raw)
		}
		serviceIDs = append(serviceIDs, id)
	}
	var staffUserID uuid.UUID
	if req.StaffUserId != "" {
		staffUserID, err = uuid.Parse(req.StaffUserId)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid staff_user_id %q", req.StaffUserId)
		}
	}
	// customer_id: prefer JWT identity (customer surface) for personalized recommendations.
	var customerID uuid.UUID
	if rc, ok := identity.FromContext(ctx); ok && rc.TokenType == "customer" {
		customerID = rc.UserID
	}

	result, err := h.svc.SearchMultiDayAvailability(ctx, SearchMultiDayAvailabilityRequest{
		TenantID:    tenantID,
		ServiceIDs:  serviceIDs,
		StaffUserID: staffUserID,
		FromDate:    req.FromDate,
		ToDate:      req.ToDate,
		CustomerID:  customerID,
	})
	if err != nil {
		return nil, mapErr(err)
	}

	days := make([]*berberimv1.DayAvailability, 0, len(result.Days))
	for _, d := range result.Days {
		days = append(days, &berberimv1.DayAvailability{
			Date:        d.Date,
			Slots:       h.slotsToProto(d.Slots),
			FilledSlots: filledSlotsToProto(d.FilledSlots),
		})
	}
	recs := make([]*berberimv1.RecommendedSlot, 0, len(result.Recommendations))
	for _, rec := range result.Recommendations {
		recs = append(recs, &berberimv1.RecommendedSlot{
			StartsAt:       rec.StartsAt.UTC().Format(time.RFC3339),
			EndsAt:         rec.EndsAt.UTC().Format(time.RFC3339),
			AvailableStaff: h.staffOptionsToProto(rec.AvailableStaff),
			Label:          rec.Label,
		})
	}
	return &berberimv1.SearchMultiDayAvailabilityResponse{Days: days, Recommendations: recs}, nil
}

// ── SearchStaffAvailability ──────────────────────────────────────────────────

func (h *Handler) SearchStaffAvailability(ctx context.Context, req *berberimv1.SearchStaffAvailabilityRequest) (*berberimv1.SearchStaffAvailabilityResponse, error) {
	tenantID, err := resolveTenantID(ctx, req.TenantId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid or missing tenant_id")
	}
	if req.StaffUserId == "" {
		return nil, status.Error(codes.InvalidArgument, "staff_user_id is required")
	}
	staffUserID, err := uuid.Parse(req.StaffUserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid staff_user_id %q", req.StaffUserId)
	}
	serviceIDs := make([]uuid.UUID, 0, len(req.ServiceIds))
	for _, raw := range req.ServiceIds {
		id, err := uuid.Parse(raw)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid service_id %q", raw)
		}
		serviceIDs = append(serviceIDs, id)
	}

	result, err := h.svc.SearchStaffAvailability(ctx, SearchStaffAvailabilityRequest{
		TenantID:    tenantID,
		StaffUserID: staffUserID,
		ServiceIDs:  serviceIDs,
		FromDate:    req.FromDate,
		ToDate:      req.ToDate,
	})
	if err != nil {
		return nil, mapErr(err)
	}

	days := make([]*berberimv1.StaffAvailabilityDay, 0, len(result.Days))
	for _, d := range result.Days {
		days = append(days, &berberimv1.StaffAvailabilityDay{
			Date:        d.Date,
			Slots:       h.slotsToProto(d.Slots),
			FilledSlots: filledSlotsToProto(d.FilledSlots),
		})
	}
	svcs := make([]*berberimv1.Service, 0, len(result.CompatibleServices))
	for _, svc := range result.CompatibleServices {
		svcs = append(svcs, serviceRecordToProto(&svc))
	}
	return &berberimv1.SearchStaffAvailabilityResponse{Days: days, CompatibleServices: svcs}, nil
}

// ── GetBookingLimitStatus ────────────────────────────────────────────────────

func (h *Handler) GetBookingLimitStatus(ctx context.Context, _ *berberimv1.GetBookingLimitStatusRequest) (*berberimv1.GetBookingLimitStatusResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	maxBookings, count, err := h.svc.GetBookingLimitStatus(ctx, rc.TenantID, rc.UserID)
	if err != nil {
		return nil, mapErr(err)
	}

	canBook := maxBookings == 0 || count < int64(maxBookings)
	return &berberimv1.GetBookingLimitStatusResponse{
		BookingsThisWeek:  int32(count),
		MaxWeeklyBookings: int32(maxBookings),
		CanBook:           canBook,
	}, nil
}

// ── CreateAppointment ─────────────────────────────────────────────────────────

func (h *Handler) CreateAppointment(ctx context.Context, req *berberimv1.CreateAppointmentRequest) (*berberimv1.CreateAppointmentResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	if len(req.ServiceIds) == 0 {
		return nil, status.Error(codes.InvalidArgument, "service_ids must not be empty")
	}
	serviceIDs := make([]uuid.UUID, 0, len(req.ServiceIds))
	for _, raw := range req.ServiceIds {
		id, err := uuid.Parse(raw)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid service_id %q", raw)
		}
		serviceIDs = append(serviceIDs, id)
	}
	var staffID uuid.UUID
	if req.StaffUserId != "" && req.StaffUserId != "any" {
		var err error
		staffID, err = uuid.Parse(req.StaffUserId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid staff_user_id")
		}
	}
	startsAt, err := time.Parse(time.RFC3339, req.StartsAt)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid starts_at — expected RFC3339")
	}

	// Customer ID: from JWT for customer surface; from request body for staff/admin.
	customerID := rc.UserID
	if rc.TokenType != "customer" {
		if req.CustomerId == "" {
			return nil, status.Error(codes.InvalidArgument, "customer_id required for staff/admin booking")
		}
		customerID, err = uuid.Parse(req.CustomerId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid customer_id")
		}
	}

	createdVia := req.CreatedVia
	if createdVia == "" {
		if rc.TokenType == "customer" {
			createdVia = CreatedViaCustomerApp
		} else {
			createdVia = CreatedViaAdminPanel
		}
	}

	appt, staff, err := h.svc.CreateAppointment(ctx, CreateAppointmentRequest{
		TenantID:       rc.TenantID,
		CustomerID:     customerID,
		StaffUserID:    staffID,
		ServiceIDs:     serviceIDs,
		StartsAt:       startsAt,
		NotesCustomer:  req.NotesCustomer,
		CreatedVia:     createdVia,
		IdempotencyKey: req.IdempotencyKey,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	svcs, err := h.svc.repo.ListAppointmentServices(ctx, appt.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to load appointment services")
	}
	return &berberimv1.CreateAppointmentResponse{Appointment: h.apptToProto(appt, svcs, staff, nil)}, nil
}

// ── GetAppointment ────────────────────────────────────────────────────────────

func (h *Handler) GetAppointment(ctx context.Context, req *berberimv1.GetAppointmentRequest) (*berberimv1.GetAppointmentResponse, error) {
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

	var res *GetResult
	if rc.TokenType == "customer" {
		res, err = h.svc.GetCustomerAppointment(ctx, rc.TenantID, rc.UserID, appointmentID)
	} else {
		res, err = h.svc.GetAppointment(ctx, rc.TenantID, appointmentID)
	}
	if err != nil {
		return nil, mapErr(err)
	}

	return &berberimv1.GetAppointmentResponse{Appointment: h.apptToProto(res.Appointment, res.Services, res.Staff, res.Customer)}, nil
}

// ── ListAppointments ──────────────────────────────────────────────────────────

func (h *Handler) ListAppointments(ctx context.Context, req *berberimv1.ListAppointmentsRequest) (*berberimv1.ListAppointmentsResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	q := ListQuery{
		TenantID: rc.TenantID,
		Status:   req.Status,
		Page:     int(req.Page),
		PageSize: int(req.PageSize),
	}

	if rc.TokenType == "customer" {
		q.CustomerID = rc.UserID
	} else if req.CustomerId != "" {
		if id, err := uuid.Parse(req.CustomerId); err == nil {
			q.CustomerID = id
		}
	}

	if req.StaffUserId != "" {
		if id, err := uuid.Parse(req.StaffUserId); err == nil {
			q.StaffUserID = id
		}
	}

	loc := h.svc.loadTenantLocation(ctx, rc.TenantID)

	if req.DateFrom != "" {
		if t, err := time.Parse("2006-01-02", req.DateFrom); err == nil {
			start := time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc)
			q.DateFrom = &start
		}
	}

	if req.DateTo != "" {
		if t, err := time.Parse("2006-01-02", req.DateTo); err == nil {
			end := time.Date(t.Year(), t.Month(), t.Day()+1, 0, 0, 0, 0, loc)
			q.DateTo = &end
		}
	}

	res, err := h.svc.ListAppointments(ctx, q)
	if err != nil {
		return nil, mapErr(err)
	}

	out := make([]*berberimv1.Appointment, 0, len(res.Appointments))
	for i := range res.Appointments {
		out = append(out, h.apptToProto(&res.Appointments[i], res.Services[i], res.Staff[i], res.Customers[i], res.Reviews[i]))
	}

	return &berberimv1.ListAppointmentsResponse{
		Appointments: out,
		Total:        res.Total,
		TotalPages:   res.TotalPages,
	}, nil
}

// ── CancelAppointment ─────────────────────────────────────────────────────────

func (h *Handler) CancelAppointment(ctx context.Context, req *berberimv1.CancelAppointmentRequest) (*berberimv1.CancelAppointmentResponse, error) {
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

	cancelledByType := "customer"
	if rc.TokenType == "tenant_user" {
		cancelledByType = rc.Role // "admin" or "staff"
		if cancelledByType == "" {
			cancelledByType = "staff"
		}
	}

	if err := h.svc.CancelAppointment(ctx, CancelAppointmentRequest{
		TenantID:        rc.TenantID,
		CustomerID:      customerIDForRequest(rc),
		AppointmentID:   appointmentID,
		Reason:          req.Reason,
		CancelledByType: cancelledByType,
	}); err != nil {
		return nil, mapErr(err)
	}
	return &berberimv1.CancelAppointmentResponse{}, nil
}

// ── RescheduleAppointment ─────────────────────────────────────────────────────

func (h *Handler) RescheduleAppointment(ctx context.Context, req *berberimv1.RescheduleAppointmentRequest) (*berberimv1.RescheduleAppointmentResponse,
	error) {
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
	newStartsAt, err := time.Parse(time.RFC3339, req.NewStartsAt)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid new_starts_at — expected RFC3339")
	}

	var newStaffID uuid.UUID
	if req.NewStaffUserId != "" {
		newStaffID, err = uuid.Parse(req.NewStaffUserId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid new_staff_user_id")
		}
	}

	newAppt, err := h.svc.RescheduleAppointment(ctx, RescheduleAppointmentRequest{
		TenantID:       rc.TenantID,
		CustomerID:     customerIDForRequest(rc),
		AppointmentID:  appointmentID,
		NewStartsAt:    newStartsAt,
		NewStaffUserID: newStaffID,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	// Fetch staff for the new appointment if possible
	staff, _ := h.svc.repo.GetStaffMember(ctx, rc.TenantID, newAppt.StaffUserID)
	svcs, err := h.svc.repo.ListAppointmentServices(ctx, newAppt.ID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to load appointment services")
	}
	return &berberimv1.RescheduleAppointmentResponse{NewAppointment: h.apptToProto(newAppt, svcs, staff, nil)}, nil
}

// ── CompleteAppointment ───────────────────────────────────────────────────────

func (h *Handler) CompleteAppointment(ctx context.Context, req *berberimv1.CompleteAppointmentRequest) (*berberimv1.CompleteAppointmentResponse,
	error) {
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
	if err := h.svc.CompleteAppointment(ctx, CompleteAppointmentRequest{
		TenantID:      rc.TenantID,
		AppointmentID: appointmentID,
	}); err != nil {
		return nil, mapErr(err)
	}
	return &berberimv1.CompleteAppointmentResponse{}, nil
}

// ── MarkNoShow ────────────────────────────────────────────────────────────────

func (h *Handler) MarkNoShow(ctx context.Context, req *berberimv1.MarkNoShowRequest) (*berberimv1.MarkNoShowResponse, error) {
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
	if err := h.svc.MarkNoShow(ctx, MarkNoShowRequest{
		TenantID:      rc.TenantID,
		AppointmentID: appointmentID,
	}); err != nil {
		return nil, mapErr(err)
	}
	return &berberimv1.MarkNoShowResponse{}, nil
}

// ── MarkPaymentReceived ───────────────────────────────────────────────────────

func (h *Handler) MarkPaymentReceived(ctx context.Context, req *berberimv1.MarkPaymentReceivedRequest) (*berberimv1.MarkPaymentReceivedResponse,
	error) {
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
	if err := h.svc.MarkPaymentReceived(ctx, MarkPaymentReceivedRequest{
		TenantID:      rc.TenantID,
		AppointmentID: appointmentID,
	}); err != nil {
		return nil, mapErr(err)
	}
	return &berberimv1.MarkPaymentReceivedResponse{}, nil
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// resolveTenantID prefers the identity context over the request body field.
func resolveTenantID(ctx context.Context, fallback string) (uuid.UUID, error) {
	if rc, ok := identity.FromContext(ctx); ok && rc.TenantID != uuid.Nil {
		return rc.TenantID, nil
	}
	return uuid.Parse(fallback)
}

func customerIDForRequest(rc identity.RequestContext) uuid.UUID {
	if rc.TokenType == "customer" {
		return rc.UserID
	}
	return uuid.Nil
}

// mapErr converts domain errors to gRPC status errors.
func mapErr(err error) error {
	switch {
	case errors.Is(err, ErrNotFound):
		return status.Error(codes.NotFound, err.Error())
	case errors.Is(err, ErrInvalidTransition):
		return status.Error(codes.InvalidArgument, err.Error())
	case errors.Is(err, ErrSlotUnavailable):
		return status.Error(codes.AlreadyExists, err.Error())
	case errors.Is(err, ErrWeeklyBookingLimitReached):
		return status.Error(codes.ResourceExhausted, err.Error())
	case errors.Is(err, ErrStaffUnavailableForService),
		errors.Is(err, ErrOutsideWorkingHours):
		return status.Error(codes.FailedPrecondition, err.Error())
	case errors.Is(err, ErrTenantRequired),
		errors.Is(err, ErrServiceRequired),
		errors.Is(err, ErrStaffRequired),
		errors.Is(err, ErrCustomerRequired),
		errors.Is(err, ErrStartsAtRequired),
		errors.Is(err, ErrDateRequired),
		errors.Is(err, ErrInvalidStartsAt),
		errors.Is(err, ErrInvalidDate):
		return status.Error(codes.InvalidArgument, err.Error())
	default:
		return status.Error(codes.Internal, "internal error")
	}
}

func (h *Handler) apptToProto(a *Appointment, svcs []AppointmentService, staff *StaffMember, cust *CustomerInfo, rev ...*ReviewInfo) *berberimv1.Appointment {
	p := &berberimv1.Appointment{
		Id:          a.ID.String(),
		TenantId:    a.TenantID.String(),
		CustomerId:  a.CustomerID.String(),
		StaffUserId: a.StaffUserID.String(),
		StartsAt:    a.StartsAt.UTC().Format(time.RFC3339),
		EndsAt:      a.EndsAt.UTC().Format(time.RFC3339),
		Status:      a.Status,
		CreatedVia:  a.CreatedVia,
		CreatedAt:   a.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   a.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if staff != nil {
		p.Staff = &berberimv1.StaffOption{
			StaffUserId: staff.ID.String(),
			FirstName:   staff.FirstName,
			LastName:    staff.LastName,
			AvgRating:   staff.AvgRating,
			ReviewCount: int32(staff.ReviewCount),
		}
		if staff.AvatarKey != nil {
			url := h.avatarCfg.PublicURL(*staff.AvatarKey)
			p.Staff.AvatarUrl = &url
		}
		p.Staff.Specialty = staff.Specialty
		p.Staff.Bio = staff.Bio
	}
	if cust != nil {
		cp := &berberimv1.Customer{
			Id:          cust.ID.String(),
			PhoneNumber: cust.PhoneNumber,
			Status:      cust.Status,
			CreatedAt:   cust.CreatedAt.UTC().Format(time.RFC3339),
		}
		if cust.FirstName != nil {
			cp.FirstName = *cust.FirstName
		}
		if cust.LastName != nil {
			cp.LastName = *cust.LastName
		}
		p.Customer = cp
	}
	if a.CancellationReason != nil {
		p.CancellationReason = *a.CancellationReason
	}
	if a.NotesCustomer != nil {
		p.NotesCustomer = *a.NotesCustomer
	}
	if a.NotesInternal != nil {
		p.NotesInternal = *a.NotesInternal
	}
	if a.RescheduledFromAppointmentID != nil {
		p.RescheduledFromAppointmentId = a.RescheduledFromAppointmentID.String()
	}
	for _, svc := range svcs {
		ps := &berberimv1.AppointmentService{
			ServiceName:     svc.ServiceNameSnapshot,
			DurationMinutes: int32(svc.DurationMinutesSnapshot),
			Price:           svc.PriceSnapshot,
			PointsReward:    int32(svc.PointsRewardSnapshot),
		}
		if svc.ServiceID != nil {
			ps.ServiceId = svc.ServiceID.String()
		}
		p.Services = append(p.Services, ps)
	}
	var total float64
	for _, svc := range svcs {
		if v, err := strconv.ParseFloat(svc.PriceSnapshot, 64); err == nil {
			total += v
		}
	}
	p.TotalPrice = fmt.Sprintf("%.2f", total)
	if len(rev) > 0 && rev[0] != nil {
		r := rev[0]
		p.Review = &berberimv1.StaffReview{
			Id:          r.ID.String(),
			CustomerId:  r.CustomerID.String(),
			StaffUserId: r.StaffUserID.String(),
			Rating:      int32(r.Rating),
			IsAnonymous: r.IsAnonymous,
			CreatedAt:   r.CreatedAt.UTC().Format(time.RFC3339),
			UpdatedAt:   r.UpdatedAt.UTC().Format(time.RFC3339),
		}
		if r.Comment != nil {
			p.Review.Comment = *r.Comment
		}
	}
	return p
}

// ── Slot mapping helpers ──────────────────────────────────────────────────────

func (h *Handler) staffOptionsToProto(staff []StaffOption) []*berberimv1.StaffOption {
	out := make([]*berberimv1.StaffOption, 0, len(staff))
	for _, s := range staff {
		opt := &berberimv1.StaffOption{
			StaffUserId: s.ID.String(),
			FirstName:   s.FirstName,
			LastName:    s.LastName,
			AvgRating:   s.AvgRating,
			ReviewCount: int32(s.ReviewCount),
			Specialty:   s.Specialty,
			Bio:         s.Bio,
		}
		if s.AvatarKey != nil {
			url := h.avatarCfg.PublicURL(*s.AvatarKey)
			opt.AvatarUrl = &url
		}
		out = append(out, opt)
	}
	return out
}

func (h *Handler) slotsToProto(slots []AvailableSlot) []*berberimv1.AvailableSlot {
	out := make([]*berberimv1.AvailableSlot, 0, len(slots))
	for _, sl := range slots {
		out = append(out, &berberimv1.AvailableSlot{
			StartsAt:       sl.StartsAt.UTC().Format(time.RFC3339),
			EndsAt:         sl.EndsAt.UTC().Format(time.RFC3339),
			AvailableStaff: h.staffOptionsToProto(sl.AvailableStaff),
		})
	}
	return out
}

func filledSlotsToProto(filled []FilledSlot) []*berberimv1.FilledSlot {
	out := make([]*berberimv1.FilledSlot, 0, len(filled))
	for _, fl := range filled {
		out = append(out, &berberimv1.FilledSlot{
			StartsAt: fl.StartsAt.UTC().Format(time.RFC3339),
			EndsAt:   fl.EndsAt.UTC().Format(time.RFC3339),
		})
	}
	return out
}

func serviceRecordToProto(s *ServiceRecord) *berberimv1.Service {
	p := &berberimv1.Service{
		Id:              s.ID.String(),
		TenantId:        s.TenantID.String(),
		Name:            s.Name,
		DurationMinutes: int32(s.DurationMinutes),
		BasePrice:       s.BasePrice,
		PointsReward:    int32(s.PointsReward),
		IsActive:        s.IsActive,
		CreatedAt:       s.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:       s.UpdatedAt.UTC().Format(time.RFC3339),
	}
	if s.Description != nil {
		p.Description = *s.Description
	}
	if s.CategoryName != nil {
		p.CategoryName = *s.CategoryName
	}
	return p
}
