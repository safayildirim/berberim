CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE tenants (
  id uuid primary key,
  name varchar(255) not null,
  slug varchar(100) not null unique,
  phone_number varchar(30),
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status varchar(30) not null default 'active' CHECK (status IN ('active', 'frozen', 'disabled')),
  timezone varchar(100) not null default 'Europe/Istanbul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE tenant_brandings (
  id uuid primary key,
  tenant_id uuid not null references tenants(id) unique,
  logo_url text,
  primary_color varchar(20),
  secondary_color varchar(20),
  tertiary_color varchar(20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE tenant_subscriptions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  plan varchar(50) not null default 'monthly',
  status varchar(30) not null default 'active' CHECK (status IN ('active', 'expired', 'frozen', 'cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX idx_tenant_subscriptions_tenant_id ON tenant_subscriptions(tenant_id, starts_at DESC);

CREATE TABLE tenant_settings (
  id uuid primary key,
  tenant_id uuid not null references tenants(id) unique,
  notification_reminder_hours integer not null default 24,
  cancellation_limit_hours integer not null default 1,
  loyalty_points_expiration_days integer,
  loyalty_enabled boolean not null default true,
  walk_in_enabled boolean not null default true,
  same_day_booking_enabled boolean not null default true,
  max_weekly_customer_bookings integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE user_devices (
  id uuid primary key,
  user_type varchar(20) not null CHECK (user_type IN ('customer', 'tenant_user', 'platform_user')),
  user_id uuid not null,
  tenant_id uuid references tenants(id),
  installation_id varchar(128) not null,
  provider varchar(20) not null default 'expo' CHECK (provider IN ('expo', 'fcm')),
  push_token text,
  platform varchar(10) not null CHECK (platform IN ('ios', 'android', 'web')),
  app_version varchar(32),
  locale varchar(16),
  timezone varchar(100),
  os_version varchar(64),
  device_model varchar(120),
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_type, user_id, installation_id)
);

CREATE INDEX idx_user_devices_user ON user_devices(user_type, user_id);
CREATE INDEX idx_user_devices_last_seen ON user_devices(last_seen_at DESC);
CREATE INDEX idx_user_devices_active_push ON user_devices(user_type, user_id, is_active) WHERE push_token IS NOT NULL;

CREATE TABLE sessions (
  id uuid primary key,
  user_type varchar(20) not null CHECK (user_type IN ('customer', 'tenant_user', 'platform_user')),
  user_id uuid not null,
  tenant_id uuid references tenants(id),
  refresh_token_hash text not null unique,
  device_id uuid references user_devices(id),
  ip_address inet,
  user_agent text,
  last_used_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_sessions_user ON sessions(user_type, user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE platform_users (
  id uuid primary key,
  email varchar(255) not null unique,
  password_hash text not null,
  role varchar(30) not null CHECK (role IN ('super_admin')),
  status varchar(30) not null default 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE tenant_users (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  email varchar(255) not null,
  password_hash text not null,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  avatar_key text,
  specialty varchar(100),
  bio text,
  role varchar(30) not null CHECK (role IN ('admin', 'staff')),
  status varchar(30) not null default 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email)
);

CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);

CREATE TABLE customers (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  phone_number varchar(30) not null,
  first_name varchar(100),
  last_name varchar(100),
  avatar_key text,
  status varchar(30) not null default 'active' CHECK (status IN ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, phone_number)
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_tenant_phone_number ON customers(tenant_id, phone_number);

CREATE TABLE customer_otp_codes (
  id uuid primary key,
  customer_id uuid not null references customers(id),
  code varchar(6) not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_customer_otp_codes_customer_id ON customer_otp_codes(customer_id, created_at DESC);

CREATE TABLE customer_identities (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  provider varchar(30) not null CHECK (provider IN ('google', 'apple')),
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider, provider_user_id)
);

CREATE INDEX idx_customer_identities_customer_id ON customer_identities(customer_id);

CREATE TABLE services (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  name varchar(150) not null,
  description text,
  duration_minutes integer not null,
  base_price numeric(12,2) not null,
  points_reward integer not null default 0,
  category_name varchar(100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX idx_services_tenant_id ON services(tenant_id);

CREATE TABLE staff_services (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  staff_user_id uuid not null references tenant_users(id),
  service_id uuid not null references services(id),
  custom_price numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (staff_user_id, service_id)
);

CREATE INDEX idx_staff_services_staff_user_id ON staff_services(staff_user_id);
CREATE INDEX idx_staff_services_service_id ON staff_services(service_id);


CREATE TABLE staff_schedule_rules (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  staff_user_id uuid not null references tenant_users(id),
  day_of_week integer not null CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time not null,
  end_time time not null,
  slot_interval_minutes integer not null default 30,
  is_working_day boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_user_id, day_of_week)
);

CREATE TABLE staff_time_offs (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  staff_user_id uuid not null references tenant_users(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  type varchar(30) not null CHECK (type IN ('leave', 'holiday', 'closure')),
  created_at timestamptz not null default now(),
  EXCLUDE USING gist (staff_user_id WITH =, tstzrange(start_at, end_at) WITH &&)
);

CREATE INDEX idx_staff_time_offs_staff_user_id ON staff_time_offs(staff_user_id);

CREATE TABLE appointments (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  staff_user_id uuid not null references tenant_users(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status varchar(30) not null CHECK (status IN ('confirmed', 'payment_received', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  cancellation_reason text,
  cancelled_by_type varchar(30) CHECK (cancelled_by_type IN ('customer', 'staff', 'admin')),
  completed_at timestamptz,
  no_show_marked_at timestamptz,
  notes_customer text,
  notes_internal text,
  rescheduled_from_appointment_id uuid references appointments(id),
  created_via varchar(30) not null CHECK (created_via IN ('customer_app', 'admin_panel', 'walk_in')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  EXCLUDE USING gist (staff_user_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'confirmed')
);

CREATE INDEX idx_appointments_tenant_starts_at ON appointments(tenant_id, starts_at);
CREATE INDEX idx_appointments_staff_user_id ON appointments(staff_user_id);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(tenant_id, status);
-- Composite index for cohort/retention/LTV queries: customer's first visit and visit aggregations.
CREATE INDEX idx_appointments_tenant_customer_starts
    ON appointments(tenant_id, customer_id, starts_at)
    WHERE status IN ('completed', 'payment_received');
-- Index for weekly booking limit count queries (covers all active statuses).
CREATE INDEX idx_appointments_tenant_customer_active
    ON appointments(tenant_id, customer_id, starts_at)
    WHERE status IN ('confirmed', 'payment_received', 'completed');
-- Index for no-show analysis: covers (tenant, date range, status) grouping.
CREATE INDEX idx_appointments_tenant_starts_status
    ON appointments(tenant_id, starts_at, status);

CREATE TABLE appointment_services (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  appointment_id uuid not null references appointments(id) on delete cascade,
  service_id uuid references services(id),
  service_name_snapshot varchar(150) not null,
  duration_minutes_snapshot integer not null,
  price_snapshot numeric(12,2) not null,
  points_reward_snapshot integer not null default 0,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_appointment_services_appointment_id ON appointment_services(appointment_id);
-- Covering index for LTV queries to avoid heap lookups on appointment_services.
CREATE INDEX idx_appointment_services_appt_price
    ON appointment_services(appointment_id) INCLUDE (price_snapshot, service_id);

CREATE TABLE loyalty_wallets (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  current_points integer not null default 0,
  lifetime_earned_points integer not null default 0,
  lifetime_spent_points integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (tenant_id, customer_id)
);

CREATE TABLE loyalty_transactions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  appointment_id uuid references appointments(id),
  type varchar(30) not null CHECK (type IN ('earn', 'redeem', 'expire', 'adjust')),
  points integer not null,
  balance_after integer not null,
  reason text not null,
  expires_at timestamptz,
  created_by_type varchar(30) not null CHECK (created_by_type IN ('system', 'admin', 'staff')),
  created_by_id uuid,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_loyalty_transactions_customer_id ON loyalty_transactions(customer_id, created_at desc);
CREATE INDEX idx_loyalty_transactions_appointment_id ON loyalty_transactions(appointment_id);
CREATE INDEX idx_loyalty_transactions_expires_at ON loyalty_transactions(expires_at) WHERE expires_at IS NOT NULL AND type = 'earn';

CREATE TABLE reward_catalog_items (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  title varchar(150) not null,
  description text,
  points_cost integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX idx_reward_catalog_items_tenant_id ON reward_catalog_items(tenant_id);

CREATE TABLE reward_redemptions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  reward_catalog_item_id uuid not null references reward_catalog_items(id),
  appointment_id uuid references appointments(id),
  redeemed_points integer not null,
  redeemed_by_user_id uuid not null references tenant_users(id),
  status varchar(30) not null default 'applied' CHECK (status IN ('applied', 'cancelled')),
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

CREATE TABLE campaigns (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  title varchar(255) not null,
  description text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX idx_campaigns_tenant_id ON campaigns(tenant_id);

CREATE TABLE notification_settings (
  id uuid primary key,
  tenant_id uuid not null unique references tenants(id),
  appointment_reminder_enabled boolean not null default true,
  reminder_offset_minutes integer not null default 120,
  send_to_customer boolean not null default true,
  send_to_staff boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE notification_reminders (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  appointment_id uuid not null references appointments(id),
  recipient_type varchar(20) not null CHECK (recipient_type IN ('customer', 'tenant_user')),
  recipient_id uuid not null,
  channel varchar(20) not null CHECK (channel IN ('push')),
  type varchar(40) not null CHECK (type IN ('appointment_reminder')),
  scheduled_at timestamptz not null,
  next_attempt_at timestamptz not null default now(),
  status varchar(20) not null CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'skipped')),
  dedupe_key varchar(255) not null unique,
  payload_json jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  last_error text,
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX idx_notification_reminders_due ON notification_reminders(status, next_attempt_at, scheduled_at);
CREATE INDEX idx_notification_reminders_appointment ON notification_reminders(appointment_id);
CREATE INDEX idx_notification_reminders_recipient ON notification_reminders(recipient_type, recipient_id, status);

CREATE TABLE push_notification_logs (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  recipient_type varchar(30) not null CHECK (recipient_type IN ('customer', 'staff', 'admin')),
  recipient_id uuid not null,
  template_type varchar(50) not null,
  title varchar(255) not null,
  body text not null,
  status varchar(30) not null CHECK (status IN ('pending', 'sent', 'failed')),
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_push_notification_logs_tenant_id ON push_notification_logs(tenant_id, created_at DESC);
CREATE INDEX idx_push_notification_logs_recipient ON push_notification_logs(recipient_type, recipient_id);

CREATE TABLE customer_notifications (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  customer_id uuid not null references customers(id),
  type varchar(30) not null CHECK (type IN ('booking', 'campaign', 'status', 'system')),
  title varchar(500) not null,
  body text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  deep_link text,
  reference_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

CREATE INDEX idx_customer_notifications_inbox ON customer_notifications(tenant_id, customer_id, created_at DESC);
CREATE INDEX idx_customer_notifications_unread ON customer_notifications(tenant_id, customer_id) WHERE is_read = false;

CREATE TABLE audit_logs (
  id uuid primary key,
  actor_type varchar(30) not null CHECK (actor_type IN ('super_admin', 'admin', 'staff', 'customer', 'system')),
  actor_id uuid,
  tenant_id uuid,
  entity_type varchar(50) not null,
  entity_id uuid,
  action varchar(100) not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_audit_logs_tenant_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE staff_reviews (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  appointment_id uuid NOT NULL REFERENCES appointments(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  staff_user_id uuid NOT NULL REFERENCES tenant_users(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, customer_id)
);

CREATE INDEX idx_staff_reviews_staff_user_id ON staff_reviews(staff_user_id);
CREATE INDEX idx_staff_reviews_tenant_id ON staff_reviews(tenant_id);
