# Tenant App

The tenant app is the management tool for barbershop owners and staff. It covers everything needed to run the shop day-to-day: appointments, scheduling, customer management, and business performance.

Two roles exist within a tenant: **Staff** and **Admin**. Staff members have access to their own schedule and appointments. Admins have full access to all shop settings and data.

---

## Dashboard

The dashboard gives a live view of how the day is going.

**Stats at a glance:**
- Completed appointments today
- Upcoming confirmed appointments
- No-shows

**Next appointment widget** shows the next customer coming in — their name, service, and time — along with a check-in action.

**Quick actions** provide one-tap shortcuts to the most common tasks: open the calendar, create an appointment, view customers, or manage services.

**Shop insights** (admins) show today's revenue, staff utilization percentage, and average rating.

---

## Calendar

The calendar is the scheduling hub. It shows the day's appointment blocks across all staff, with each block showing the customer name, service, and duration.

From the calendar, staff and admins can:
- Create a new appointment manually (walk-in or phone booking)
- Add a time-off block (break, leave, holiday, or closure)
- View and manage existing appointments

---

## Appointments

### Creating an Appointment

Manual appointment creation follows a step-by-step flow:

1. **Select a customer** — search existing customers by name or phone, or add a new one on the spot. Recent and VIP customers are highlighted.
2. **Assign a staff member** — search barbers by name or specialty. Each barber shows their current capacity and average session time.
3. **Select services** — search and select one or more services with pricing.
4. **Choose a date and time** — calendar-based date picker with available time slots.
5. **Review and confirm** — summary of all details before booking.

### Appointment Actions

Once an appointment is created, staff can take the following actions directly from the appointment detail view:

- **Mark as completed** — close out the appointment after the service is done
- **Mark payment received** — record that the customer has paid
- **Mark as no-show** — record that the customer didn't arrive
- **Reschedule** — move the appointment to a new date/time
- **Cancel** — cancel the booking with an optional reason

Internal notes can be added to any appointment, visible only to staff.

---

## Customers

The customers section is a directory of everyone who has visited or booked at the shop.

**Customer list** shows each customer's name, last visit date, total visit count, and loyalty tier. The list can be searched by name or phone and sorted by name or most recent visit.

**Customer profile** shows full booking history, loyalty points balance, and contact information. Admins can update customer details, set their status (active or inactive), or add them manually.

Customer tiers (Standard, Gold Member, VIP, Lapsed) are calculated automatically based on visit history.

---

## Reviews

The reviews screen shows all feedback left by customers for the logged-in staff member.

- **Summary card** shows the average rating and total number of reviews
- **Review list** shows individual reviews with customer name (or "Anonymous"), rating, comment, and date
- **Filters** allow narrowing reviews by star rating (5-star, 4-star) or most recent

---

## Staff Management *(Admin only)*

Admins can manage the full team from the More menu.

- Add new staff members with their name, email, specialty, and role
- Edit staff information or profile photo
- Set staff role (Staff or Admin)
- Activate or deactivate a staff account
- View per-staff reviews and ratings
- Manage each staff member's assigned services

### Working Hours & Time Off

Each staff member has a weekly schedule defining their working days and hours. Admins can configure this per person.

Time off can be added for individual staff members as:
- **Break** — a short block within a day
- **Leave** — a multi-day personal absence
- **Holiday** — a public holiday
- **Closure** — a shop-wide closure period

---

## Services *(Admin only)*

The service catalog defines what the shop offers.

Each service has:
- Name and description
- Duration (in minutes)
- Price
- Category (Haircuts, Shaves, Treatments, Add-ons, etc.)
- Loyalty points reward (how many points a customer earns for this service)
- Active / inactive status

Services can be assigned to specific staff members, which controls which barbers appear as options when a customer books that service.

---

## Loyalty & Rewards *(Admin only)*

Admins configure the shop's loyalty program from this section.

**Program settings** control whether loyalty is enabled and how points accumulate.

**Rewards catalog** defines what customers can redeem their points for. Each reward has:
- A title and description
- A point cost
- Active / inactive status

Admins can create, edit, and delete rewards at any time.

---

## Analytics *(Admin only)*

The analytics screen gives a performance view of the shop over a selected time range (daily, weekly, or monthly).

**Appointments**
- Total appointments in the period
- Completed, cancelled, and no-show counts
- No-show rate
- Change vs. the previous period

**Customer insights**
- Number of active customers
- Returning customer rate
- Average visit frequency

**Operational performance**
- Staff utilization (booked time vs. available working hours)
- Most popular services by booking count

**Loyalty engagement**
- Rewards redeemed in the period
- Overall loyalty program health score
- Active loyalty members

---

## Settings & Profile

All users can update their personal profile, manage their time off, set notification preferences, and switch the app language (Turkish or English).

Admins additionally have access to shop branding settings (logo, colors) and tenant-level configuration.
