export type UserRole = 'staff' | 'admin';

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  status: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  currency: string;
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    tertiary_color: string;
  };
  settings: {
    loyalty_enabled: boolean;
    points_per_currency_unit: number;
    points_conversion_rate: number;
    reschedule_policy_hours: number;
  };
}

export interface NotificationSettings {
  appointment_reminder_enabled: boolean;
  reminder_offset_minutes: number;
  send_to_customer: boolean;
  send_to_staff: boolean;
  is_active: boolean;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  base_price: string;
  points_reward: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Protojson fields / Compatibility
  service_id?: string;
  service_name?: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: string;
  services: string[]; // service ids
  avatar_url?: string;
  avg_rating: number;
  review_count: number;
}

export interface StaffReview {
  id: string;
  appointment_id: string;
  customer_id: string; // empty string when anonymous
  customer_name: string; // empty string when anonymous
  staff_user_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  status: string;
  total_completed_appointments: number;
  last_appointment_at?: string;
  created_at: string;
  visit_count: number;
}

export type AppointmentStatus =
  | 'confirmed'
  | 'payment_received'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Appointment {
  id: string;
  customer_id: string;
  customer?: Customer; // Optional in list
  staff_id: string; // Deprecated by backend in favor of staff_user_id?
  staff_user_id?: string;
  staff: {
    staff_user_id: string;
    first_name: string;
    last_name: string;
  };
  service_ids: string[];
  services: Service[];
  starts_at: string; // ISO
  ends_at: string; // ISO
  status: AppointmentStatus;
  notes_customer?: string;
  notes_internal?: string;
  payment_received_at?: string;
  total_price: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleRule {
  id: string;
  staff_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, matches JS Date.getDay()
  start_time: string; // "HH:mm:ss" stored as UTC
  end_time: string; // "HH:mm:ss" stored as UTC
  is_working_day: boolean;
}

export interface TimeOff {
  id: string;
  start_at: string; // ISO
  end_at: string; // ISO
  reason?: string;
  type: 'leave' | 'holiday' | 'closure';
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  is_active: boolean;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  reward: Reward;
  customer_id: string;
  customer: Customer;
  status: 'applied' | 'cancelled';
  points_at_redemption: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  start_date: string; // ISO
  end_date: string; // ISO
  is_active: boolean;
  type: 'general' | 'loyalty' | 'discount';
}

export interface PopularService {
  name: string;
  count: number;
  progress: number; // 0.0–1.0 relative to top service
}

export interface AnalyticsOverview {
  // Appointment metrics
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_rate: number;
  no_show_rate_change: string;
  total_revenue: string;
  appointments_change: string;

  // Customer insights
  active_customers: number;
  returning_rate: number;
  visit_frequency: number;

  // Operational performance
  staff_utilization: number;
  popular_services: PopularService[];

  // Loyalty engagement
  rewards_redeemed: number;
  redeemed_change: string;
  loyalty_progress: number;
}

// ── Advanced Analytics ────────────────────────────────────────────────────────

export interface CohortPeriod {
  months_after: number;
  active_customers: number;
  retention_rate: number;
  revenue: string;
}

export interface CohortMonth {
  cohort: string;
  cohort_size: number;
  periods: CohortPeriod[];
}

export interface CohortAnalysis {
  cohorts: CohortMonth[];
}

export interface RetentionBucket {
  label: string;
  customer_count: number;
  percentage: number;
}

export interface RetentionByCohort {
  cohort: string;
  return_rate_30d: number;
  return_rate_60d: number;
  return_rate_90d: number;
}

export interface RetentionAnalysis {
  total_customers: number;
  returned_customers: number;
  overall_return_rate: number;
  avg_days_between_visits: number;
  buckets: RetentionBucket[];
  by_cohort: RetentionByCohort[];
}

export interface LTVSummary {
  avg_ltv: string;
  median_ltv: string;
  avg_visits: number;
  avg_revenue_per_visit: string;
  avg_lifespan_days: number;
}

export interface LTVSegment {
  segment: string;
  customer_count: number;
  avg_ltv: string;
  avg_visits: number;
  avg_revenue_per_visit: string;
}

export interface CustomerLTV {
  summary: LTVSummary;
  segments: LTVSegment[];
}

export interface NoShowByStaff {
  staff_user_id: string;
  staff_name: string;
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number;
}

export interface NoShowByTimeSlot {
  time_slot: string;
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number;
}

export interface NoShowByDayOfWeek {
  day_of_week: number;
  day_name: string;
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number;
}

export interface NoShowTrend {
  period: string;
  total_appointments: number;
  no_show_count: number;
  no_show_rate: number;
}

export interface NoShowAnalysis {
  total_no_shows: number;
  overall_no_show_rate: number;
  by_staff: NoShowByStaff[];
  by_time_slot: NoShowByTimeSlot[];
  by_day_of_week: NoShowByDayOfWeek[];
  trends: NoShowTrend[];
}

export interface LinkCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
  created_by_user_id: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  status: 'sent' | 'failed';
  sent_at: string;
}
