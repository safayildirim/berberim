package analytics

import (
	"context"

	"github.com/berberim/api/internal/txctx"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) *Repo {
	return &Repo{db: db}
}

func (r *Repo) dbForCtx(ctx context.Context) *gorm.DB {
	return txctx.DBForCtx(ctx, r.db)
}

// ── Tenant helpers ───────────────────────────────────────────────────────────

func (r *Repo) GetTenantTimezone(ctx context.Context, tenantID uuid.UUID) (string, error) {
	var tz string
	err := r.db.WithContext(ctx).
		Table("tenants").
		Where("id = ?", tenantID).
		Pluck("timezone", &tz).Error
	return tz, err
}

// ── Cohort Analysis ──────────────────────────────────────────────────────────

func (r *Repo) GetCohortSizes(ctx context.Context, tenantID uuid.UUID, monthsBack int) ([]CohortSizeRow, error) {
	var rows []CohortSizeRow
	err := r.dbForCtx(ctx).Raw(`
		SELECT
			to_char(cohort_month, 'YYYY-MM') AS cohort,
			COUNT(*) AS cohort_size
		FROM (
			SELECT customer_id, date_trunc('month', MIN(starts_at)) AS cohort_month
			FROM appointments
			WHERE tenant_id = ? AND status IN ('completed', 'payment_received')
			GROUP BY customer_id
		) first_visits
		WHERE cohort_month >= date_trunc('month', NOW()) - make_interval(months => ?)
		GROUP BY cohort_month
		ORDER BY cohort_month
	`, tenantID, monthsBack).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetCohortActivity(ctx context.Context, tenantID uuid.UUID, monthsBack int) ([]CohortRow, error) {
	var rows []CohortRow
	err := r.dbForCtx(ctx).Raw(`
		WITH first_visits AS (
			SELECT customer_id, date_trunc('month', MIN(starts_at)) AS cohort_month
			FROM appointments
			WHERE tenant_id = ? AND status IN ('completed', 'payment_received')
			GROUP BY customer_id
		),
		monthly_activity AS (
			SELECT
				fv.cohort_month,
				date_trunc('month', a.starts_at) AS activity_month,
				COUNT(DISTINCT a.customer_id) AS active_customers,
				COALESCE(SUM(asvc.price_snapshot), 0)::text AS revenue
			FROM first_visits fv
			JOIN appointments a ON a.customer_id = fv.customer_id
				AND a.tenant_id = ?
				AND a.status IN ('completed', 'payment_received')
			LEFT JOIN appointment_services asvc ON asvc.appointment_id = a.id
			WHERE fv.cohort_month >= date_trunc('month', NOW()) - make_interval(months => ?)
			GROUP BY fv.cohort_month, date_trunc('month', a.starts_at)
		)
		SELECT
			to_char(cohort_month, 'YYYY-MM') AS cohort,
			EXTRACT(MONTH FROM age(activity_month, cohort_month))::int AS months_after,
			active_customers,
			revenue
		FROM monthly_activity
		ORDER BY cohort_month, months_after
	`, tenantID, tenantID, monthsBack).Scan(&rows).Error
	return rows, err
}

// ── Retention Analysis ───────────────────────────────────────────────────────

func (r *Repo) GetRetentionSummary(ctx context.Context, tenantID uuid.UUID) (*RetentionSummaryRow, error) {
	var row RetentionSummaryRow
	err := r.dbForCtx(ctx).Raw(`
		WITH customer_visits AS (
			SELECT
				customer_id,
				COUNT(*) AS visit_count,
				AVG(gap_days) AS avg_gap
			FROM (
				SELECT
					customer_id,
					EXTRACT(DAY FROM (starts_at - LAG(starts_at) OVER (PARTITION BY customer_id ORDER BY starts_at))) AS gap_days
				FROM appointments
				WHERE tenant_id = ? AND status IN ('completed', 'payment_received')
			) sub
			GROUP BY customer_id
		)
		SELECT
			COUNT(*) AS total_customers,
			COUNT(*) FILTER (WHERE visit_count > 1) AS returned_customers,
			COALESCE(AVG(avg_gap) FILTER (WHERE visit_count > 1), 0) AS avg_days_between_visits
		FROM customer_visits
	`, tenantID).Scan(&row).Error
	return &row, err
}

func (r *Repo) GetRetentionBuckets(ctx context.Context, tenantID uuid.UUID) ([]RetentionBucketRow, error) {
	var rows []RetentionBucketRow
	err := r.dbForCtx(ctx).Raw(`
		WITH customer_return AS (
			SELECT
				customer_id,
				MIN(starts_at) AS first_visit,
				(ARRAY_AGG(starts_at ORDER BY starts_at))[2] AS second_visit
			FROM appointments
			WHERE tenant_id = ? AND status IN ('completed', 'payment_received')
			GROUP BY customer_id
			HAVING COUNT(*) > 1
		)
		SELECT
			CASE
				WHEN EXTRACT(DAY FROM (second_visit - first_visit)) <= 30 THEN '0-30 days'
				WHEN EXTRACT(DAY FROM (second_visit - first_visit)) <= 60 THEN '31-60 days'
				WHEN EXTRACT(DAY FROM (second_visit - first_visit)) <= 90 THEN '61-90 days'
				WHEN EXTRACT(DAY FROM (second_visit - first_visit)) <= 180 THEN '91-180 days'
				ELSE '180+ days'
			END AS label,
			COUNT(*) AS customer_count
		FROM customer_return
		GROUP BY 1
		ORDER BY MIN(EXTRACT(DAY FROM (second_visit - first_visit)))
	`, tenantID).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetRetentionByCohort(ctx context.Context, tenantID uuid.UUID, monthsBack int) ([]RetentionCohortRow, error) {
	var rows []RetentionCohortRow
	err := r.dbForCtx(ctx).Raw(`
		WITH first_visits AS (
			SELECT customer_id, MIN(starts_at) AS first_visit,
				   date_trunc('month', MIN(starts_at)) AS cohort_month
			FROM appointments
			WHERE tenant_id = ? AND status IN ('completed', 'payment_received')
			GROUP BY customer_id
		),
		returns AS (
			SELECT
				fv.customer_id,
				fv.cohort_month,
				MIN(a.starts_at) FILTER (WHERE a.starts_at > fv.first_visit) AS next_visit
			FROM first_visits fv
			LEFT JOIN appointments a ON a.customer_id = fv.customer_id
				AND a.tenant_id = ?
				AND a.status IN ('completed', 'payment_received')
				AND a.starts_at > fv.first_visit
			WHERE fv.cohort_month >= date_trunc('month', NOW()) - make_interval(months => ?)
			GROUP BY fv.customer_id, fv.cohort_month
		)
		SELECT
			to_char(cohort_month, 'YYYY-MM') AS cohort,
			ROUND(100.0 * COUNT(*) FILTER (WHERE next_visit IS NOT NULL AND EXTRACT(DAY FROM (next_visit - cohort_month)) <= 30) / NULLIF(COUNT(*), 0), 1) AS return_rate_30d,
			ROUND(100.0 * COUNT(*) FILTER (WHERE next_visit IS NOT NULL AND EXTRACT(DAY FROM (next_visit - cohort_month)) <= 60) / NULLIF(COUNT(*), 0), 1) AS return_rate_60d,
			ROUND(100.0 * COUNT(*) FILTER (WHERE next_visit IS NOT NULL AND EXTRACT(DAY FROM (next_visit - cohort_month)) <= 90) / NULLIF(COUNT(*), 0), 1) AS return_rate_90d
		FROM returns
		GROUP BY cohort_month
		ORDER BY cohort_month
	`, tenantID, tenantID, monthsBack).Scan(&rows).Error
	return rows, err
}

// ── Customer LTV ─────────────────────────────────────────────────────────────

func (r *Repo) GetLTVSummary(ctx context.Context, tenantID uuid.UUID) (*LTVSummaryRow, error) {
	var row LTVSummaryRow
	err := r.dbForCtx(ctx).Raw(`
		WITH customer_revenue AS (
			SELECT
				a.customer_id,
				COALESCE(SUM(asvc.price_snapshot), 0) AS lifetime_revenue,
				COUNT(DISTINCT a.id) AS total_visits,
				EXTRACT(DAY FROM (MAX(a.starts_at) - MIN(a.starts_at))) AS lifespan_days
			FROM appointments a
			JOIN appointment_services asvc ON asvc.appointment_id = a.id
			WHERE a.tenant_id = ? AND a.status IN ('completed', 'payment_received')
			GROUP BY a.customer_id
		)
		SELECT
			ROUND(AVG(lifetime_revenue), 2)::text AS avg_ltv,
			ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lifetime_revenue)::numeric, 2)::text AS median_ltv,
			ROUND(AVG(total_visits)::numeric, 1)::float AS avg_visits,
			CASE WHEN SUM(total_visits) > 0
				THEN ROUND((SUM(lifetime_revenue) / SUM(total_visits))::numeric, 2)::text
				ELSE '0.00' END AS avg_revenue_per_visit,
			COALESCE(AVG(lifespan_days), 0) AS avg_lifespan_days
		FROM customer_revenue
	`, tenantID).Scan(&row).Error
	return &row, err
}

func (r *Repo) GetLTVByCohort(ctx context.Context, tenantID uuid.UUID) ([]LTVSegmentRow, error) {
	var rows []LTVSegmentRow
	err := r.dbForCtx(ctx).Raw(`
		WITH customer_revenue AS (
			SELECT
				a.customer_id,
				COALESCE(SUM(asvc.price_snapshot), 0) AS lifetime_revenue,
				COUNT(DISTINCT a.id) AS total_visits,
				date_trunc('month', MIN(a.starts_at)) AS cohort_month
			FROM appointments a
			JOIN appointment_services asvc ON asvc.appointment_id = a.id
			WHERE a.tenant_id = ? AND a.status IN ('completed', 'payment_received')
			GROUP BY a.customer_id
		)
		SELECT
			to_char(cohort_month, 'YYYY-MM') AS segment,
			COUNT(*) AS customer_count,
			ROUND(AVG(lifetime_revenue), 2)::text AS avg_ltv,
			ROUND(AVG(total_visits)::numeric, 1)::float AS avg_visits,
			CASE WHEN SUM(total_visits) > 0
				THEN ROUND((SUM(lifetime_revenue) / SUM(total_visits))::numeric, 2)::text
				ELSE '0.00' END AS avg_revenue_per_visit
		FROM customer_revenue
		GROUP BY cohort_month
		ORDER BY cohort_month
	`, tenantID).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetLTVByAcquisitionChannel(ctx context.Context, tenantID uuid.UUID) ([]LTVSegmentRow, error) {
	var rows []LTVSegmentRow
	err := r.dbForCtx(ctx).Raw(`
		WITH customer_revenue AS (
			SELECT
				a.customer_id,
				COALESCE(SUM(asvc.price_snapshot), 0) AS lifetime_revenue,
				COUNT(DISTINCT a.id) AS total_visits,
				(ARRAY_AGG(a.created_via ORDER BY a.starts_at))[1] AS channel
			FROM appointments a
			JOIN appointment_services asvc ON asvc.appointment_id = a.id
			WHERE a.tenant_id = ? AND a.status IN ('completed', 'payment_received')
			GROUP BY a.customer_id
		)
		SELECT
			COALESCE(channel, 'unknown') AS segment,
			COUNT(*) AS customer_count,
			ROUND(AVG(lifetime_revenue), 2)::text AS avg_ltv,
			ROUND(AVG(total_visits)::numeric, 1)::float AS avg_visits,
			CASE WHEN SUM(total_visits) > 0
				THEN ROUND((SUM(lifetime_revenue) / SUM(total_visits))::numeric, 2)::text
				ELSE '0.00' END AS avg_revenue_per_visit
		FROM customer_revenue
		GROUP BY channel
		ORDER BY AVG(lifetime_revenue) DESC
	`, tenantID).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetLTVByServiceCategory(ctx context.Context, tenantID uuid.UUID) ([]LTVSegmentRow, error) {
	var rows []LTVSegmentRow
	err := r.dbForCtx(ctx).Raw(`
		WITH customer_primary_category AS (
			SELECT
				a.customer_id,
				s.category_name,
				COUNT(*) AS usage_count,
				ROW_NUMBER() OVER (PARTITION BY a.customer_id ORDER BY COUNT(*) DESC) AS rn
			FROM appointments a
			JOIN appointment_services asvc ON asvc.appointment_id = a.id
			JOIN services s ON s.id = asvc.service_id AND s.tenant_id = a.tenant_id
			WHERE a.tenant_id = ? AND a.status IN ('completed', 'payment_received')
			GROUP BY a.customer_id, s.category_name
		),
		customer_revenue AS (
			SELECT
				a.customer_id,
				COALESCE(SUM(asvc.price_snapshot), 0) AS lifetime_revenue,
				COUNT(DISTINCT a.id) AS total_visits
			FROM appointments a
			JOIN appointment_services asvc ON asvc.appointment_id = a.id
			WHERE a.tenant_id = ? AND a.status IN ('completed', 'payment_received')
			GROUP BY a.customer_id
		)
		SELECT
			COALESCE(cpc.category_name, 'uncategorized') AS segment,
			COUNT(*) AS customer_count,
			ROUND(AVG(cr.lifetime_revenue), 2)::text AS avg_ltv,
			ROUND(AVG(cr.total_visits)::numeric, 1)::float AS avg_visits,
			CASE WHEN SUM(cr.total_visits) > 0
				THEN ROUND((SUM(cr.lifetime_revenue) / SUM(cr.total_visits))::numeric, 2)::text
				ELSE '0.00' END AS avg_revenue_per_visit
		FROM customer_revenue cr
		JOIN customer_primary_category cpc ON cpc.customer_id = cr.customer_id AND cpc.rn = 1
		GROUP BY cpc.category_name
		ORDER BY AVG(cr.lifetime_revenue) DESC
	`, tenantID, tenantID).Scan(&rows).Error
	return rows, err
}

// ── No-Show Analysis ─────────────────────────────────────────────────────────

func (r *Repo) GetNoShowByStaff(ctx context.Context, tenantID uuid.UUID, from, to string) ([]NoShowStaffRow, error) {
	var rows []NoShowStaffRow
	err := r.dbForCtx(ctx).Raw(`
		SELECT
			a.staff_user_id::text AS staff_user_id,
			CONCAT(tu.first_name, ' ', tu.last_name) AS staff_name,
			COUNT(*) AS total_appointments,
			COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_show_count
		FROM appointments a
		JOIN tenant_users tu ON tu.id = a.staff_user_id
		WHERE a.tenant_id = ? AND a.starts_at >= ?::timestamptz AND a.starts_at < ?::timestamptz
		GROUP BY a.staff_user_id, tu.first_name, tu.last_name
		ORDER BY no_show_count DESC
	`, tenantID, from, to).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetNoShowByTimeSlot(ctx context.Context, tenantID uuid.UUID, from, to, tz string) ([]NoShowTimeSlotRow, error) {
	var rows []NoShowTimeSlotRow
	err := r.dbForCtx(ctx).Raw(`
		SELECT
			CASE
				WHEN EXTRACT(HOUR FROM a.starts_at AT TIME ZONE ?) < 12 THEN 'morning'
				WHEN EXTRACT(HOUR FROM a.starts_at AT TIME ZONE ?) < 17 THEN 'afternoon'
				ELSE 'evening'
			END AS time_slot,
			COUNT(*) AS total_appointments,
			COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_show_count
		FROM appointments a
		WHERE a.tenant_id = ? AND a.starts_at >= ?::timestamptz AND a.starts_at < ?::timestamptz
		GROUP BY 1
		ORDER BY MIN(EXTRACT(HOUR FROM a.starts_at AT TIME ZONE ?))
	`, tz, tz, tenantID, from, to, tz).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetNoShowByDayOfWeek(ctx context.Context, tenantID uuid.UUID, from, to, tz string) ([]NoShowDayOfWeekRow, error) {
	var rows []NoShowDayOfWeekRow
	err := r.dbForCtx(ctx).Raw(`
		SELECT
			EXTRACT(DOW FROM a.starts_at AT TIME ZONE ?)::int AS day_of_week,
			COUNT(*) AS total_appointments,
			COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_show_count
		FROM appointments a
		WHERE a.tenant_id = ? AND a.starts_at >= ?::timestamptz AND a.starts_at < ?::timestamptz
		GROUP BY 1
		ORDER BY 1
	`, tz, tenantID, from, to).Scan(&rows).Error
	return rows, err
}

func (r *Repo) GetNoShowTrends(ctx context.Context, tenantID uuid.UUID, from, to, truncUnit string) ([]NoShowTrendRow, error) {
	var rows []NoShowTrendRow
	// truncUnit is "month" or "quarter"
	format := "YYYY-MM"
	if truncUnit == "quarter" {
		format = "YYYY-\"Q\"Q"
	}
	err := r.dbForCtx(ctx).Raw(`
		SELECT
			to_char(date_trunc(?, a.starts_at), ?) AS period,
			COUNT(*) AS total_appointments,
			COUNT(*) FILTER (WHERE a.status = 'no_show') AS no_show_count
		FROM appointments a
		WHERE a.tenant_id = ? AND a.starts_at >= ?::timestamptz AND a.starts_at < ?::timestamptz
		GROUP BY 1
		ORDER BY 1
	`, truncUnit, format, tenantID, from, to).Scan(&rows).Error
	return rows, err
}
