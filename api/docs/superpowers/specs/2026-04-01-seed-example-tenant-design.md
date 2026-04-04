# Seed: Example Tenant Data

**Date:** 2026-04-01

## Goal

Provide a manually-runnable SQL file that populates the local Docker PostgreSQL database with a realistic example tenant for development and testing.

## File

`api/seeds/example.sql`

## Approach

Plain SQL `INSERT` statements with hardcoded UUIDs and `ON CONFLICT DO NOTHING` for idempotency. Inserts follow FK dependency order.

## Seed Data

### Tenant
- Name: `Berber Ali`
- Slug: `berber-ali`
- Timezone: `Europe/Istanbul`
- Status: `active`

### Tenant Branding
- Logo URL: placeholder string
- Primary color: `#2D3142`
- Secondary color: `#EF8C45`

### Tenant Settings
- Notification reminder: 24h
- Cancellation limit: 1h
- Loyalty, walk-in, same-day booking: all enabled

### Tenant Users
| Email | Role | Password |
|---|---|---|
| `ali@berberali.com` | `admin` | `Test1234!` |
| `mehmet@berberali.com` | `staff` | `Test1234!` |

Password hash: bcrypt of `Test1234!`.

### Services
| Name | Duration | Price |
|---|---|---|
| Haircut | 30 min | 150.00 ₺ |
| Beard Trim | 20 min | 100.00 ₺ |
| Hair + Beard | 45 min | 220.00 ₺ |

### Staff Services
Mehmet (staff) linked to all 3 services with no custom price override.

## Makefile Target

```makefile
seed:
    docker compose exec postgres psql -U postgres -d berberim -f /dev/stdin < seeds/example.sql
```

Run from `api/` directory: `make seed`

## How to Reset and Re-seed

```bash
make reset-force   # wipes volumes, re-runs migrations
make seed          # re-inserts example data
```
