# Seed Example Tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `api/seeds/example.sql` with a realistic example tenant (Berber Ali) including branding, settings, two users (admin + staff), three services, and staff_service links — plus a `make seed` target to run it against the Docker DB.

**Architecture:** A single idempotent SQL file with hardcoded UUIDs and `ON CONFLICT DO NOTHING` guards, inserted in FK dependency order. A Makefile target pipes the file into `psql` running inside the Docker postgres container.

**Tech Stack:** PostgreSQL 15, Docker Compose, Make

---

### Task 1: Create `api/seeds/` directory and `example.sql`

**Files:**
- Create: `api/seeds/example.sql`

- [ ] **Step 1: Create the seeds directory and SQL file**

Create `api/seeds/example.sql` with the following content:

```sql
-- =============================================================
-- Example Tenant Seed
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- Run via: make seed  (from api/ directory)
-- =============================================================

-- UUIDs used in this seed:
-- tenant:        a1000000-0000-0000-0000-000000000001
-- branding:      a2000000-0000-0000-0000-000000000001
-- settings:      a3000000-0000-0000-0000-000000000001
-- user admin:    a4000000-0000-0000-0000-000000000001
-- user staff:    a4000000-0000-0000-0000-000000000002
-- service 1:     a5000000-0000-0000-0000-000000000001
-- service 2:     a5000000-0000-0000-0000-000000000002
-- service 3:     a5000000-0000-0000-0000-000000000003
-- staff_svc 1:   a6000000-0000-0000-0000-000000000001
-- staff_svc 2:   a6000000-0000-0000-0000-000000000002
-- staff_svc 3:   a6000000-0000-0000-0000-000000000003

-- 1. Tenant
INSERT INTO tenants (id, name, slug, phone_number, address, status, timezone)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Berber Ali',
  'berber-ali',
  '+905321234567',
  'Bağcılar, İstanbul',
  'active',
  'Europe/Istanbul'
) ON CONFLICT DO NOTHING;

-- 2. Branding
INSERT INTO tenant_brandings (id, tenant_id, logo_url, primary_color, secondary_color, tertiary_color)
VALUES (
  'a2000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'https://placehold.co/200x200?text=BA',
  '#2D3142',
  '#EF8C45',
  '#FFFFFF'
) ON CONFLICT DO NOTHING;

-- 3. Settings
INSERT INTO tenant_settings (id, tenant_id, notification_reminder_hours, cancellation_limit_hours, loyalty_enabled, walk_in_enabled, same_day_booking_enabled)
VALUES (
  'a3000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  24,
  1,
  true,
  true,
  true
) ON CONFLICT DO NOTHING;

-- 4. Tenant Users
-- Password for both: Test1234!  (bcrypt $2y$10$...)
INSERT INTO tenant_users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
VALUES
  (
    'a4000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'ali@berberali.com',
    '$2y$10$uANeEQ4XqYhP4ocbaK9L6.2QN2vDj8jFaqL61eeliwDzcfSw6wC0i',
    'Ali',
    'Yılmaz',
    'admin',
    'active'
  ),
  (
    'a4000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'mehmet@berberali.com',
    '$2y$10$uANeEQ4XqYhP4ocbaK9L6.2QN2vDj8jFaqL61eeliwDzcfSw6wC0i',
    'Mehmet',
    'Kaya',
    'staff',
    'active'
  )
ON CONFLICT DO NOTHING;

-- 5. Services
INSERT INTO services (id, tenant_id, name, description, duration_minutes, base_price, points_reward, category_name, is_active)
VALUES
  (
    'a5000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Haircut',
    'Classic haircut with scissors or clippers',
    30,
    150.00,
    10,
    'Hair',
    true
  ),
  (
    'a5000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Beard Trim',
    'Beard shaping and trim',
    20,
    100.00,
    7,
    'Beard',
    true
  ),
  (
    'a5000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Hair + Beard',
    'Full haircut and beard trim combo',
    45,
    220.00,
    15,
    'Combo',
    true
  )
ON CONFLICT DO NOTHING;

-- 6. Staff Services (Mehmet offers all 3 services)
INSERT INTO staff_services (id, tenant_id, staff_user_id, service_id, custom_price, is_active)
VALUES
  (
    'a6000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'a4000000-0000-0000-0000-000000000002',
    'a5000000-0000-0000-0000-000000000001',
    NULL,
    true
  ),
  (
    'a6000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'a4000000-0000-0000-0000-000000000002',
    'a5000000-0000-0000-0000-000000000002',
    NULL,
    true
  ),
  (
    'a6000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'a4000000-0000-0000-0000-000000000002',
    'a5000000-0000-0000-0000-000000000003',
    NULL,
    true
  )
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Verify the file was created**

```bash
ls -la api/seeds/example.sql
```

Expected: file exists, non-zero size.

---

### Task 2: Add `seed` Makefile target

**Files:**
- Modify: `api/Makefile`

- [ ] **Step 1: Add the `seed` target to `api/Makefile`**

Add the following after the `migrate-down` target at the bottom of [api/Makefile](api/Makefile):

```makefile
seed:
	docker compose exec postgres psql -U postgres -d berberim -f /dev/stdin < seeds/example.sql
```

Also add `seed` to the `.PHONY` line:

```makefile
.PHONY: all build run test test-race tidy clean generate gen-keys seed
```

- [ ] **Step 2: Verify the target parses correctly**

```bash
cd api && make --dry-run seed
```

Expected: prints the `docker compose exec ...` command without error.

---

### Task 3: Run the seed and verify data

- [ ] **Step 1: Ensure Docker is up with migrations applied**

```bash
cd api && make docker-up
```

Wait for all services to be healthy (the `berberim-api` healthcheck passes).

- [ ] **Step 2: Run the seed**

```bash
cd api && make seed
```

Expected output: no errors, just SQL command confirmations like `INSERT 0 1`.

- [ ] **Step 3: Verify tenant row**

```bash
docker compose exec postgres psql -U postgres -d berberim -c \
  "SELECT id, name, slug, status FROM tenants WHERE slug = 'berber-ali';"
```

Expected:
```
                  id                  |    name    |   slug    | status
--------------------------------------+------------+-----------+--------
 a1000000-0000-0000-0000-000000000001 | Berber Ali | berber-ali | active
```

- [ ] **Step 4: Verify users**

```bash
docker compose exec postgres psql -U postgres -d berberim -c \
  "SELECT email, role, status FROM tenant_users WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001';"
```

Expected:
```
         email          |  role  | status
------------------------+--------+--------
 ali@berberali.com      | admin  | active
 mehmet@berberali.com   | staff  | active
```

- [ ] **Step 5: Verify services**

```bash
docker compose exec postgres psql -U postgres -d berberim -c \
  "SELECT name, duration_minutes, base_price FROM services WHERE tenant_id = 'a1000000-0000-0000-0000-000000000001';"
```

Expected:
```
    name     | duration_minutes | base_price
-------------+------------------+------------
 Haircut     |               30 |     150.00
 Beard Trim  |               20 |     100.00
 Hair + Beard|               45 |     220.00
```

- [ ] **Step 6: Verify staff_services**

```bash
docker compose exec postgres psql -U postgres -d berberim -c \
  "SELECT s.name, ss.custom_price, ss.is_active
   FROM staff_services ss
   JOIN services s ON s.id = ss.service_id
   WHERE ss.staff_user_id = 'a4000000-0000-0000-0000-000000000002';"
```

Expected:
```
     name      | custom_price | is_active
---------------+--------------+-----------
 Haircut       |              | t
 Beard Trim    |              | t
 Hair + Beard  |              | t
```

- [ ] **Step 7: Verify idempotency — run seed a second time**

```bash
cd api && make seed
```

Expected: no errors, all inserts show `INSERT 0 0` (conflict skipped).

- [ ] **Step 8: Commit**

```bash
cd api
git add seeds/example.sql Makefile docs/superpowers/specs/2026-04-01-seed-example-tenant-design.md docs/superpowers/plans/2026-04-01-seed-example-tenant.md
git commit -m "chore: add example tenant seed data and make seed target"
```
