#!/usr/bin/env bash
# migrate.sh — Run golang-migrate against the Neon direct endpoint.
#
# Fetches the direct connection string from Secret Manager and runs migrations.
# Requires:
#   - gcloud authenticated (gcloud auth application-default login)
#   - migrate CLI installed (go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest)
#
# Usage:
#   ./scripts/migrate.sh [up|down|version]   (default: up)
#   ENVIRONMENT=prod ./scripts/migrate.sh up

set -euo pipefail

PROJECT_ID="berberim-492720"
ENVIRONMENT="${ENVIRONMENT:-dev}"
DIRECTION="${1:-up}"
MIGRATIONS_PATH="$(dirname "$0")/../api/migrations"

SECRET_ID="${ENVIRONMENT}-berberim-db-url-direct"

echo "==> Fetching direct DB URL from Secret Manager"
echo "    Project:     ${PROJECT_ID}"
echo "    Secret:      ${SECRET_ID}"
echo "    Environment: ${ENVIRONMENT}"
echo ""

DB_URL="$(gcloud secrets versions access latest \
  --secret="${SECRET_ID}" \
  --project="${PROJECT_ID}")"

if [[ -z "$DB_URL" ]]; then
  echo "ERROR: Could not fetch secret ${SECRET_ID}"
  exit 1
fi

echo "==> Running migrations: ${DIRECTION}"
echo "    Migrations path: ${MIGRATIONS_PATH}"
echo ""

migrate \
  -path "${MIGRATIONS_PATH}" \
  -database "${DB_URL}" \
  "${DIRECTION}"

echo ""
echo "Migrations complete."
