package analytics

// ── Cohort Analysis ──────────────────────────────────────────────────────────

type CohortRow struct {
	Cohort          string `gorm:"column:cohort"`
	MonthsAfter     int    `gorm:"column:months_after"`
	ActiveCustomers int    `gorm:"column:active_customers"`
	Revenue         string `gorm:"column:revenue"`
}

type CohortSizeRow struct {
	Cohort     string `gorm:"column:cohort"`
	CohortSize int    `gorm:"column:cohort_size"`
}

// ── Retention Analysis ───────────────────────────────────────────────────────

type RetentionBucketRow struct {
	Label         string `gorm:"column:label"`
	CustomerCount int    `gorm:"column:customer_count"`
}

type RetentionCohortRow struct {
	Cohort       string  `gorm:"column:cohort"`
	ReturnRate30 float64 `gorm:"column:return_rate_30d"`
	ReturnRate60 float64 `gorm:"column:return_rate_60d"`
	ReturnRate90 float64 `gorm:"column:return_rate_90d"`
}

type RetentionSummaryRow struct {
	TotalCustomers       int     `gorm:"column:total_customers"`
	ReturnedCustomers    int     `gorm:"column:returned_customers"`
	AvgDaysBetweenVisits float64 `gorm:"column:avg_days_between_visits"`
}

// ── Customer LTV ─────────────────────────────────────────────────────────────

type LTVSummaryRow struct {
	AvgLTV             string  `gorm:"column:avg_ltv"`
	MedianLTV          string  `gorm:"column:median_ltv"`
	AvgVisits          float64 `gorm:"column:avg_visits"`
	AvgRevenuePerVisit string  `gorm:"column:avg_revenue_per_visit"`
	AvgLifespanDays    float64 `gorm:"column:avg_lifespan_days"`
}

type LTVSegmentRow struct {
	Segment            string  `gorm:"column:segment"`
	CustomerCount      int     `gorm:"column:customer_count"`
	AvgLTV             string  `gorm:"column:avg_ltv"`
	AvgVisits          float64 `gorm:"column:avg_visits"`
	AvgRevenuePerVisit string  `gorm:"column:avg_revenue_per_visit"`
}

// ── No-Show Analysis ─────────────────────────────────────────────────────────

type NoShowStaffRow struct {
	StaffUserID       string `gorm:"column:staff_user_id"`
	StaffName         string `gorm:"column:staff_name"`
	TotalAppointments int    `gorm:"column:total_appointments"`
	NoShowCount       int    `gorm:"column:no_show_count"`
}

type NoShowTimeSlotRow struct {
	TimeSlot          string `gorm:"column:time_slot"`
	TotalAppointments int    `gorm:"column:total_appointments"`
	NoShowCount       int    `gorm:"column:no_show_count"`
}

type NoShowDayOfWeekRow struct {
	DayOfWeek         int `gorm:"column:day_of_week"`
	TotalAppointments int `gorm:"column:total_appointments"`
	NoShowCount       int `gorm:"column:no_show_count"`
}

type NoShowTrendRow struct {
	Period            string `gorm:"column:period"`
	TotalAppointments int    `gorm:"column:total_appointments"`
	NoShowCount       int    `gorm:"column:no_show_count"`
}
