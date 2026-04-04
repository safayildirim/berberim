package analytics

import (
	"context"

	berberimv1 "github.com/berberim/api/api/v1"
	"github.com/berberim/api/internal/identity"
	"go.uber.org/zap"
)

type Handler struct {
	svc *Service
	log *zap.Logger
}

func NewHandler(log *zap.Logger, svc *Service) *Handler {
	return &Handler{svc: svc, log: log}
}

// ── GetCohortAnalysis ────────────────────────────────────────────────────────

func (h *Handler) GetCohortAnalysis(ctx context.Context, req *berberimv1.GetCohortAnalysisRequest) (*berberimv1.GetCohortAnalysisResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	cohorts, err := h.svc.GetCohortAnalysis(ctx, rc.TenantID, req.MonthsBack)
	if err != nil {
		return nil, err
	}

	out := make([]*berberimv1.CohortMonth, 0, len(cohorts))
	for _, c := range cohorts {
		periods := make([]*berberimv1.CohortPeriod, 0, len(c.Periods))
		for _, p := range c.Periods {
			periods = append(periods, &berberimv1.CohortPeriod{
				MonthsAfter:     int32(p.MonthsAfter),
				ActiveCustomers: int32(p.ActiveCustomers),
				RetentionRate:   p.RetentionRate,
				Revenue:         p.Revenue,
			})
		}
		out = append(out, &berberimv1.CohortMonth{
			Cohort:     c.Cohort,
			CohortSize: int32(c.CohortSize),
			Periods:    periods,
		})
	}

	return &berberimv1.GetCohortAnalysisResponse{Cohorts: out}, nil
}

// ── GetRetentionAnalysis ─────────────────────────────────────────────────────

func (h *Handler) GetRetentionAnalysis(ctx context.Context, req *berberimv1.GetRetentionAnalysisRequest) (*berberimv1.GetRetentionAnalysisResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	result, err := h.svc.GetRetentionAnalysis(ctx, rc.TenantID, req.Range)
	if err != nil {
		return nil, err
	}

	buckets := make([]*berberimv1.RetentionBucket, 0, len(result.Buckets))
	for _, b := range result.Buckets {
		pct := 0.0
		if result.ReturnedCustomers > 0 {
			pct = float64(b.CustomerCount) / float64(result.ReturnedCustomers) * 100
		}
		buckets = append(buckets, &berberimv1.RetentionBucket{
			Label:         b.Label,
			CustomerCount: int32(b.CustomerCount),
			Percentage:    pct,
		})
	}

	byCohort := make([]*berberimv1.RetentionByCohort, 0, len(result.ByCohort))
	for _, c := range result.ByCohort {
		byCohort = append(byCohort, &berberimv1.RetentionByCohort{
			Cohort:         c.Cohort,
			ReturnRate_30D: c.ReturnRate30,
			ReturnRate_60D: c.ReturnRate60,
			ReturnRate_90D: c.ReturnRate90,
		})
	}

	return &berberimv1.GetRetentionAnalysisResponse{
		TotalCustomers:       int32(result.TotalCustomers),
		ReturnedCustomers:    int32(result.ReturnedCustomers),
		OverallReturnRate:    result.OverallReturnRate,
		AvgDaysBetweenVisits: result.AvgDaysBetweenVisits,
		Buckets:              buckets,
		ByCohort:             byCohort,
	}, nil
}

// ── GetCustomerLTV ───────────────────────────────────────────────────────────

func (h *Handler) GetCustomerLTV(ctx context.Context, req *berberimv1.GetCustomerLTVRequest) (*berberimv1.GetCustomerLTVResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	result, err := h.svc.GetCustomerLTV(ctx, rc.TenantID, req.SegmentBy)
	if err != nil {
		return nil, err
	}

	segments := make([]*berberimv1.LTVSegment, 0, len(result.Segments))
	for _, s := range result.Segments {
		segments = append(segments, &berberimv1.LTVSegment{
			Segment:            s.Segment,
			CustomerCount:      int32(s.CustomerCount),
			AvgLtv:             s.AvgLTV,
			AvgVisits:          s.AvgVisits,
			AvgRevenuePerVisit: s.AvgRevenuePerVisit,
		})
	}

	return &berberimv1.GetCustomerLTVResponse{
		Summary: &berberimv1.LTVSummary{
			AvgLtv:             result.Summary.AvgLTV,
			MedianLtv:          result.Summary.MedianLTV,
			AvgVisits:          result.Summary.AvgVisits,
			AvgRevenuePerVisit: result.Summary.AvgRevenuePerVisit,
			AvgLifespanDays:    result.Summary.AvgLifespanDays,
		},
		Segments: segments,
	}, nil
}

// ── GetNoShowAnalysis ────────────────────────────────────────────────────────

func (h *Handler) GetNoShowAnalysis(ctx context.Context, req *berberimv1.GetNoShowAnalysisRequest) (*berberimv1.GetNoShowAnalysisResponse, error) {
	rc, err := identity.FromGRPCMeta(ctx)
	if err != nil {
		return nil, err
	}
	if err := rc.RequireTenant(); err != nil {
		return nil, err
	}

	result, err := h.svc.GetNoShowAnalysis(ctx, rc.TenantID, req.Range)
	if err != nil {
		return nil, err
	}

	byStaff := make([]*berberimv1.NoShowByStaff, 0, len(result.ByStaff))
	for _, s := range result.ByStaff {
		rate := 0.0
		if s.TotalAppointments > 0 {
			rate = float64(s.NoShowCount) / float64(s.TotalAppointments) * 100
		}
		byStaff = append(byStaff, &berberimv1.NoShowByStaff{
			StaffUserId:       s.StaffUserID,
			StaffName:         s.StaffName,
			TotalAppointments: int32(s.TotalAppointments),
			NoShowCount:       int32(s.NoShowCount),
			NoShowRate:        rate,
		})
	}

	byTimeSlot := make([]*berberimv1.NoShowByTimeSlot, 0, len(result.ByTimeSlot))
	for _, ts := range result.ByTimeSlot {
		rate := 0.0
		if ts.TotalAppointments > 0 {
			rate = float64(ts.NoShowCount) / float64(ts.TotalAppointments) * 100
		}
		byTimeSlot = append(byTimeSlot, &berberimv1.NoShowByTimeSlot{
			TimeSlot:          ts.TimeSlot,
			TotalAppointments: int32(ts.TotalAppointments),
			NoShowCount:       int32(ts.NoShowCount),
			NoShowRate:        rate,
		})
	}

	byDOW := make([]*berberimv1.NoShowByDayOfWeek, 0, len(result.ByDayOfWeek))
	for _, d := range result.ByDayOfWeek {
		rate := 0.0
		if d.TotalAppointments > 0 {
			rate = float64(d.NoShowCount) / float64(d.TotalAppointments) * 100
		}
		byDOW = append(byDOW, &berberimv1.NoShowByDayOfWeek{
			DayOfWeek:         int32(d.DayOfWeek),
			DayName:           DayName(d.DayOfWeek),
			TotalAppointments: int32(d.TotalAppointments),
			NoShowCount:       int32(d.NoShowCount),
			NoShowRate:        rate,
		})
	}

	trends := make([]*berberimv1.NoShowTrend, 0, len(result.Trends))
	for _, t := range result.Trends {
		rate := 0.0
		if t.TotalAppointments > 0 {
			rate = float64(t.NoShowCount) / float64(t.TotalAppointments) * 100
		}
		trends = append(trends, &berberimv1.NoShowTrend{
			Period:            t.Period,
			TotalAppointments: int32(t.TotalAppointments),
			NoShowCount:       int32(t.NoShowCount),
			NoShowRate:        rate,
		})
	}

	return &berberimv1.GetNoShowAnalysisResponse{
		TotalNoShows:      int32(result.TotalNoShows),
		OverallNoShowRate: result.OverallNoShowRate,
		ByStaff:           byStaff,
		ByTimeSlot:        byTimeSlot,
		ByDayOfWeek:       byDOW,
		Trends:            trends,
	}, nil
}
