package analytics

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type RepoInterface interface {
	GetTenantTimezone(ctx context.Context, tenantID uuid.UUID) (string, error)

	GetCohortSizes(ctx context.Context, tenantID uuid.UUID, monthsBack int) ([]CohortSizeRow, error)
	GetCohortActivity(ctx context.Context, tenantID uuid.UUID, monthsBack int) ([]CohortRow, error)

	GetRetentionSummary(ctx context.Context, tenantID uuid.UUID) (*RetentionSummaryRow, error)
	GetRetentionBuckets(ctx context.Context, tenantID uuid.UUID) ([]RetentionBucketRow, error)
	GetRetentionByCohort(ctx context.Context, tenantID uuid.UUID, monthsBack int) ([]RetentionCohortRow, error)

	GetLTVSummary(ctx context.Context, tenantID uuid.UUID) (*LTVSummaryRow, error)
	GetLTVByCohort(ctx context.Context, tenantID uuid.UUID) ([]LTVSegmentRow, error)
	GetLTVByAcquisitionChannel(ctx context.Context, tenantID uuid.UUID) ([]LTVSegmentRow, error)
	GetLTVByServiceCategory(ctx context.Context, tenantID uuid.UUID) ([]LTVSegmentRow, error)

	GetNoShowByStaff(ctx context.Context, tenantID uuid.UUID, from, to string) ([]NoShowStaffRow, error)
	GetNoShowByTimeSlot(ctx context.Context, tenantID uuid.UUID, from, to, tz string) ([]NoShowTimeSlotRow, error)
	GetNoShowByDayOfWeek(ctx context.Context, tenantID uuid.UUID, from, to, tz string) ([]NoShowDayOfWeekRow, error)
	GetNoShowTrends(ctx context.Context, tenantID uuid.UUID, from, to, truncUnit string) ([]NoShowTrendRow, error)
}

var _ RepoInterface = (*Repo)(nil)

type Service struct {
	repo RepoInterface
	log  *zap.Logger
}

func NewService(log *zap.Logger, repo RepoInterface) *Service {
	return &Service{repo: repo, log: log}
}

// ── Cohort Analysis ──────────────────────────────────────────────────────────

type CohortPeriodResult struct {
	MonthsAfter     int
	ActiveCustomers int
	RetentionRate   float64
	Revenue         string
}

type CohortResult struct {
	Cohort     string
	CohortSize int
	Periods    []CohortPeriodResult
}

func (s *Service) GetCohortAnalysis(ctx context.Context, tenantID uuid.UUID, monthsBack int32) ([]CohortResult, error) {
	if monthsBack <= 0 {
		monthsBack = 6
	}
	if monthsBack > 12 {
		monthsBack = 12
	}

	sizes, err := s.repo.GetCohortSizes(ctx, tenantID, int(monthsBack))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "cohort sizes: %v", err)
	}

	activity, err := s.repo.GetCohortActivity(ctx, tenantID, int(monthsBack))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "cohort activity: %v", err)
	}

	sizeMap := make(map[string]int, len(sizes))
	for _, s := range sizes {
		sizeMap[s.Cohort] = s.CohortSize
	}

	// Group activity rows by cohort.
	activityMap := make(map[string][]CohortRow)
	for _, row := range activity {
		activityMap[row.Cohort] = append(activityMap[row.Cohort], row)
	}

	var results []CohortResult
	for _, sz := range sizes {
		cohort := CohortResult{
			Cohort:     sz.Cohort,
			CohortSize: sz.CohortSize,
		}
		for _, row := range activityMap[sz.Cohort] {
			rate := 0.0
			if sz.CohortSize > 0 {
				rate = float64(row.ActiveCustomers) / float64(sz.CohortSize) * 100
			}
			cohort.Periods = append(cohort.Periods, CohortPeriodResult{
				MonthsAfter:     row.MonthsAfter,
				ActiveCustomers: row.ActiveCustomers,
				RetentionRate:   rate,
				Revenue:         row.Revenue,
			})
		}
		results = append(results, cohort)
	}
	return results, nil
}

// ── Retention Analysis ───────────────────────────────────────────────────────

type RetentionResult struct {
	TotalCustomers       int
	ReturnedCustomers    int
	OverallReturnRate    float64
	AvgDaysBetweenVisits float64
	Buckets              []RetentionBucketRow
	ByCohort             []RetentionCohortRow
}

func (s *Service) GetRetentionAnalysis(ctx context.Context, tenantID uuid.UUID, rangeStr string) (*RetentionResult, error) {
	if rangeStr == "" {
		rangeStr = "90d"
	}

	// Validate range (used for per-cohort months_back).
	monthsBack := 6
	switch rangeStr {
	case "30d":
		monthsBack = 3
	case "60d":
		monthsBack = 6
	case "90d":
		monthsBack = 6
	case "180d":
		monthsBack = 9
	case "365d":
		monthsBack = 12
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid range %q: must be 30d, 60d, 90d, 180d, or 365d", rangeStr)
	}

	summary, err := s.repo.GetRetentionSummary(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "retention summary: %v", err)
	}

	buckets, err := s.repo.GetRetentionBuckets(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "retention buckets: %v", err)
	}

	byCohort, err := s.repo.GetRetentionByCohort(ctx, tenantID, monthsBack)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "retention by cohort: %v", err)
	}

	overallRate := 0.0
	if summary.TotalCustomers > 0 {
		overallRate = float64(summary.ReturnedCustomers) / float64(summary.TotalCustomers) * 100
	}

	return &RetentionResult{
		TotalCustomers:       summary.TotalCustomers,
		ReturnedCustomers:    summary.ReturnedCustomers,
		OverallReturnRate:    overallRate,
		AvgDaysBetweenVisits: summary.AvgDaysBetweenVisits,
		Buckets:              buckets,
		ByCohort:             byCohort,
	}, nil
}

// ── Customer LTV ─────────────────────────────────────────────────────────────

type LTVResult struct {
	Summary  LTVSummaryRow
	Segments []LTVSegmentRow
}

func (s *Service) GetCustomerLTV(ctx context.Context, tenantID uuid.UUID, segmentBy string) (*LTVResult, error) {
	if segmentBy == "" {
		segmentBy = "cohort"
	}

	summary, err := s.repo.GetLTVSummary(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "ltv summary: %v", err)
	}

	var segments []LTVSegmentRow
	switch segmentBy {
	case "cohort":
		segments, err = s.repo.GetLTVByCohort(ctx, tenantID)
	case "acquisition_channel":
		segments, err = s.repo.GetLTVByAcquisitionChannel(ctx, tenantID)
	case "service_category":
		segments, err = s.repo.GetLTVByServiceCategory(ctx, tenantID)
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid segment_by %q: must be cohort, acquisition_channel, or service_category", segmentBy)
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "ltv segments: %v", err)
	}

	return &LTVResult{Summary: *summary, Segments: segments}, nil
}

// ── No-Show Analysis ─────────────────────────────────────────────────────────

var dayNames = [7]string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}

type NoShowResult struct {
	TotalNoShows      int
	OverallNoShowRate float64
	ByStaff           []NoShowStaffRow
	ByTimeSlot        []NoShowTimeSlotRow
	ByDayOfWeek       []NoShowDayOfWeekRow
	Trends            []NoShowTrendRow
}

func (s *Service) GetNoShowAnalysis(ctx context.Context, tenantID uuid.UUID, rangeStr string) (*NoShowResult, error) {
	if rangeStr == "" {
		rangeStr = "monthly"
	}

	now := time.Now().UTC()
	var from, to time.Time
	var truncUnit string

	switch rangeStr {
	case "monthly":
		from = now.AddDate(0, -1, 0)
		to = now
		truncUnit = "month"
	case "quarterly":
		from = now.AddDate(0, -3, 0)
		to = now
		truncUnit = "quarter"
	case "yearly":
		from = now.AddDate(-1, 0, 0)
		to = now
		truncUnit = "month"
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid range %q: must be monthly, quarterly, or yearly", rangeStr)
	}

	fromStr := from.Format(time.RFC3339)
	toStr := to.Format(time.RFC3339)

	tz, err := s.repo.GetTenantTimezone(ctx, tenantID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "get timezone: %v", err)
	}
	if tz == "" {
		tz = "UTC"
	}

	byStaff, err := s.repo.GetNoShowByStaff(ctx, tenantID, fromStr, toStr)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "no-show by staff: %v", err)
	}

	byTimeSlot, err := s.repo.GetNoShowByTimeSlot(ctx, tenantID, fromStr, toStr, tz)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "no-show by time slot: %v", err)
	}

	byDOW, err := s.repo.GetNoShowByDayOfWeek(ctx, tenantID, fromStr, toStr, tz)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "no-show by day: %v", err)
	}

	trends, err := s.repo.GetNoShowTrends(ctx, tenantID, fromStr, toStr, truncUnit)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "no-show trends: %v", err)
	}

	// Compute totals.
	totalAppts := 0
	totalNoShows := 0
	for _, s := range byStaff {
		totalAppts += s.TotalAppointments
		totalNoShows += s.NoShowCount
	}

	overallRate := 0.0
	if totalAppts > 0 {
		overallRate = float64(totalNoShows) / float64(totalAppts) * 100
	}

	return &NoShowResult{
		TotalNoShows:      totalNoShows,
		OverallNoShowRate: overallRate,
		ByStaff:           byStaff,
		ByTimeSlot:        byTimeSlot,
		ByDayOfWeek:       byDOW,
		Trends:            trends,
	}, nil
}

// DayName returns the English name for a day-of-week number (0=Sunday).
func DayName(dow int) string {
	if dow < 0 || dow > 6 {
		return fmt.Sprintf("Day %d", dow)
	}
	return dayNames[dow]
}
