## **1. 🎯 Product Overview**

This product is a **multi-tenant SaaS platform** that enables **single-location men’s barbershops** to:

- manage appointments
- track customer relationships
- set up a loyalty (points) system
- view basic analytics

The platform consists of the following components:

- Customer Mobile App (React Native)
- Staff/Admin Mobile App (React Native – role-based)
- Web Admin Panel
- Backend API (multi-tenant)

---

## **2. 🧱 Scope (v1)**

### **Included**

- Appointment management
- Customer management
- Service and pricing management
- Staff management
- Calendar & availability
- Push notifications
- Loyalty (points system)
- Basic analytics (batch)
- Subscription lifecycle (basic)

### **Excluded (post-v1)**

- Multi-branch support
- Online payment integration
- WhatsApp notifications
- Campaign automation engine (beyond basic)
- Multi-country / timezone support
- Advanced RBAC
- Export / reporting

---

## **3. 🧑‍🤝‍🧑 Actors & Roles**

### **3.1 Platform**

- **Super Admin**
  - Creates / disables tenants
  - Provides support access (with audit logs)

### **3.2 Tenant (Barbershop)**

- **Admin**
- **Staff**

### **3.3 End User**

- Barbershop customer

---

## **4. 🏢 Tenant Model**

- Each barbershop = 1 tenant
- No branch concept (v1)
- All data is isolated per tenant

Tenant configuration includes:

- name
- logo
- branding (colors, etc.)
- working hours
- services
- staff
- loyalty rules

---

## **4.1 ⚙️ Tenant Settings**

Each tenant has configurable settings:

| Setting | Default | Description |
|---|---|---|
| `notification_reminder_hours` | 24 | Hours before appointment to send reminder |
| `cancellation_limit_hours` | 1 | Minimum hours before appointment to allow cancellation |
| `loyalty_enabled` | true | Enable/disable the loyalty points system |
| `walk_in_enabled` | true | Allow walk-in appointments from admin panel |
| `same_day_booking_enabled` | true | Allow customers to book same-day appointments |

---

## **5. 🔐 Authentication & Authorization**

### **End User**

- Phone number + OTP
- Social login (Google, Apple — provider ID token verification)

### **Admin / Staff**

- Email + password

### **Platform (Super Admin)**

- Email + password (separate platform user account)

### **Session Management**

- JWT access tokens (short-lived) + opaque refresh tokens (long-lived)
- Sessions can be listed and individually revoked
- "Logout from all devices" supported

### **Authorization**

- Fixed role system:
  - Admin: full access
  - Staff: limited access (calendar, appointment management)

---

## **6. 📱 Applications**

### **6.1 Customer Mobile App**

Main goal: booking appointments

Features:

- Service selection (one or more services per booking)
- Staff selection (optional — system auto-assigns if not specified)
- Date/time selection
- Create appointment
- Appointment history
- Rebook
- View and edit profile (first name, last name)
- View loyalty points balance and transaction history
- View campaigns

---

### **6.2 Staff/Admin Mobile App**

Role-based UI

**Admin:**

- Staff management
- Service management
- Working hours
- Appointments
- Send notifications

**Staff:**

- Personal calendar
- Appointment list
- Mark appointment as completed
- Mark payment as received

---

### **6.3 Web Admin Panel**

- Dashboard
- Appointment management
- Customer list
- Services
- Staff
- Loyalty system
- Settings

---

## **7. 📅 Appointment System**

### **7.1 Appointment Flow**

1. Select one or more services
2. (Optional) Select staff — must be capable of performing **all** selected services
3. Select date/time (slot length = sum of all selected service durations)
4. Confirm → **confirmed**

---

### **7.2 Appointment States**

- confirmed
- completed
- cancelled
- no_show
- rescheduled

**Notes:**

- Reschedule → creates a new appointment
- Old appointment = rescheduled

---

### **7.3 Rules**

- Appointments are instantly confirmed
- Cancellation limit: **at least 1 hour before**
- Walk-in supported (via admin panel)
- Same-day multiple bookings allowed

---

### **7.4 No-show**

- Marked by admin/staff
- Used in analytics

---

## **8. ⏱️ Availability & Calendar**

### **8.1 Model**

- Weekly working hours
- Exception days:
  - leave
  - holidays
  - special closures

---

### **8.2 Services & Duration**

Each service includes:

- name
- description (optional)
- category (optional, e.g. "Saç", "Sakal", "Bakım")
- duration (minutes)
- base price
- points reward (earned when payment received)
- active flag

---

### **8.3 Multi-service Booking**

- Users can select multiple services in a single appointment
- Total duration = SUM(service durations)
- Points earned = SUM(points_reward per service)
- Availability slots are sized to the total duration
- Staff must be capable of performing **all** selected services to appear as available

---

### **8.4 Slot Logic**

- Dynamic slots (based on service duration)
- Filled slots are disabled (grayed out)
- One staff = one customer at a time

---

### **8.5 Staff Constraints**

- Staff have service-based capabilities (defined via staff–service assignments)
- Not every staff can provide every service
- For multi-service bookings, staff must be able to perform all selected services
- Staff with no service assignments cannot be booked

---

## **9. 💰 Payment Model (v1)**

- No online payments
- Payments are physical

Flow:

1. Appointment completed
2. Staff marks “payment received”
3. Points are calculated

---

## **10. 🎯 Loyalty System**

### **10.1 Point Earning**

Trigger:

- appointment = completed
- payment_received = true (staff marks payment)

Points earned = SUM of `points_reward` across all services in the appointment

---

### **10.2 Configurable Rules (Tenant)**

- points per service
- expiration
- reward catalog

---

### **10.3 Reward System**

Defined by tenant:

- X points → Y reward

Examples:

- 100 → free haircut
- 150 → discount

---

### **10.4 Redemption**

- Applied by admin
- Points are deducted

---

### **10.5 Balance & History**

- Customers can view current points balance
- Customers can view full transaction history (earn / redeem / expire / adjust)
- Staff/admin can view balance for any customer by customer ID

---

## **11. 🔔 Notifications**

### **v1 Channels**

- Push Notification

---

### **Events**

- Appointment created
- Appointment reminder
- Appointment cancelled
- Campaign message

---

### **Reminder**

- Configurable by tenant (e.g., 1 day before)

---

## **12. 📊 Analytics (Batch)**

### **Calculated daily**

### **Metrics**

- Daily appointment count
- Weekly/monthly active users
- Retention rate
- No-show rate
- Cancellation rate
- Staff utilization
- Most popular services
- Average appointment frequency
- Points usage rate
- Churn

---

## **13. 💳 Subscription & Billing**

### **Model**

- Monthly subscription

---

### **Lifecycle**

- Active
- Expired
- Frozen

---

### **Rules**

- Cancellation → remains active until period ends
- Afterward:
  - all access is disabled
  - tenant = frozen
  - data is preserved

---

### **Reactivation**

- Payment → tenant becomes active

---

## **14. 🔐 Security & Access**

- Strict tenant isolation
- Super admin access (with audit logs)
- Basic authentication security (v1)

---

## **15. 🧰 Admin Capabilities**

Tenant Admin:

- staff CRUD (create, list, enable, disable)
- service CRUD (create, update, set active/inactive) with category support
- staff–service assignments (which staff can perform which services)
- working hours configuration
- tenant settings (reminders, cancellation window, loyalty toggle, walk-in, same-day booking)
- campaigns
- push notifications
- loyalty configuration and reward catalog

---

## **16. ⚙️ Non-functional Requirements**

- Mobile-first experience
- Low latency booking (<300ms API)
- Multi-tenant isolation
- Scalable backend (future-proof)
- Daily batch jobs (analytics)

---

## **17. 🚀 Future Expansion (v2+)**

- Multi-branch support
- Online payments
- WhatsApp integration
- Dynamic pricing
- Advanced campaigns
- Marketplace model (multiple barbershops in one app)
- AI-based scheduling
- CRM features
