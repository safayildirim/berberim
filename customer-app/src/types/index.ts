export type TenantConfig = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  phone_number: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    tertiary_color: string;
  };
  settings: {
    notification_reminder_hours: number;
    cancellation_limit_hours: number;
    loyalty_enabled: boolean;
    walk_in_enabled: boolean;
    same_day_booking_enabled: boolean;
  };
};

export type CustomerProfile = {
  profile: {
    id: string;
    phone_number: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    status: string;
    total_completed_appointments: number;
    last_appointment_at: string;
    created_at: string;
    loyalty_points: number;
  };
  tenants: TenantMembership[];
};

export type AppointmentStatus =
  | 'confirmed'
  | 'payment_received'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'
  | 'pending';

export type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  base_price: string;
  category_name: string;
};

export type Staff = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string;
  specialty?: string;
  bio?: string;
  avg_rating: number;
  review_count: number;
};

export type StaffReview = {
  id: string;
  appointment_id: string;
  customer_id: string;
  staff_user_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySlot = {
  starts_at: string;
  ends_at: string;
  available_staff: {
    staff_user_id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    specialty?: string;
    bio?: string;
    avg_rating: number;
    review_count: number;
  }[];
};

export type FilledSlot = {
  starts_at: string;
  ends_at: string;
};

export type RecommendedSlot = {
  starts_at: string;
  ends_at: string;
  available_staff: AvailabilitySlot['available_staff'];
  label: 'earliest' | 'preferred_time' | 'preferred_staff' | 'popular';
};

export type AppointmentService = {
  service_id: string;
  service_name: string;
  duration_minutes: number;
  price: string;
  points_reward: number;
};

export type Appointment = {
  id: string;
  customer_id: string;
  status: AppointmentStatus;
  starts_at: string;
  ends_at: string;
  staff_user_id: string;
  services: AppointmentService[];
  staff?: Staff;
  total_price: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  review?: StaffReview;
};

export type LoyaltyWallet = {
  current_points: number;
  lifetime_earned_points: number;
  lifetime_spent_points: number;
};

export type LoyaltyTransaction = {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  balance_after: number;
  reason: string;
  appointment_id?: string;
  created_at: string;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  isAvailable: boolean;
};

export type Campaign = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
};

// ── Multi-tenant membership types ──────────────────────────────────────────

export type TenantMembership = {
  tenant_id: string;
  name: string;
  slug: string;
  logo_url: string;
  status: string;
  joined_at: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'campaign' | 'status' | 'system';
  is_read: boolean;
  created_at: string;
  read_at?: string;
  deep_link?: string;
  reference_id?: string;
};
