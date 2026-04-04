#!/usr/bin/env bash
# bootstrap.sh — One-time setup for the Berberim GCP infrastructure.
#
# Run this ONCE from a machine with:
#   - gcloud authenticated (gcloud auth application-default login)
#   - terraform installed (>= 1.7)
#   - docker installed
#
# Usage:
#   ./scripts/bootstrap.sh

set -euo pipefail

PROJECT_ID="berberim-492720"
REGION="europe-west1"
ENVIRONMENT="${ENVIRONMENT:-dev}"

echo "==> [1/6] Bootstrap: GCS state bucket + GCP APIs"
cd "$(dirname "$0")/../infra/bootstrap"
terraform init
terraform apply -auto-approve

echo ""
echo "==> [2/6] Dev infrastructure: IAM, Artifact Registry, Secret Manager shells"
cd ../environments/"$ENVIRONMENT"
terraform init
terraform apply \
  -target=module.project_services \
  -target=module.iam \
  -target=module.artifact_registry \
  -target=module.secret_manager \
  -auto-approve

echo ""
echo "==> [3/6] Manual step: Upload secrets to Secret Manager"
echo ""
echo "    You must upload the following secrets before continuing:"
echo ""
echo "    1. Neon pooled connection string:"
echo "       echo -n 'postgres://...' | gcloud secrets versions add ${ENVIRONMENT}-berberim-db-url \\"
echo "         --data-file=- --project=${PROJECT_ID}"
echo ""
echo "    2. Neon direct connection string (for migrations):"
echo "       echo -n 'postgres://...' | gcloud secrets versions add ${ENVIRONMENT}-berberim-db-url-direct \\"
echo "         --data-file=- --project=${PROJECT_ID}"
echo ""
echo "    3. JWT RSA private key:"
echo "       gcloud secrets versions add ${ENVIRONMENT}-berberim-jwt-private-key \\"
echo "         --data-file=api/keys/private.pem --project=${PROJECT_ID}"
echo ""
read -r -p "Press ENTER once all secrets are uploaded..."

echo ""
echo "==> [4/6] Manual step: Build and push Docker images"
echo ""
echo "    gcloud auth configure-docker ${REGION}-docker.pkg.dev"
echo "    docker build -f api/Dockerfile -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/berberim/api:v0.1.0 ."
echo "    docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/berberim/api:v0.1.0"
echo "    docker build -f api-gateway/Dockerfile -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/berberim/gateway:v0.1.0 ."
echo "    docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/berberim/gateway:v0.1.0"
echo ""
read -r -p "Press ENTER once images are pushed..."

echo ""
echo "==> [5/6] Apply remaining infrastructure (Cloud Run + Monitoring)"
terraform apply \
  -var="api_image_tag=v0.1.0" \
  -var="gateway_image_tag=v0.1.0" \
  -auto-approve

echo ""
echo "==> [6/6] Run migrations against Neon"
echo ""
echo "    DB_URL=\$(gcloud secrets versions access latest \\"
echo "      --secret=${ENVIRONMENT}-berberim-db-url-direct \\"
echo "      --project=${PROJECT_ID})"
echo "    migrate -path api/migrations -database \"\$DB_URL\" up"
echo ""
echo "    Run the above manually, or use: ./scripts/migrate.sh"
echo ""

echo "Bootstrap complete for environment: ${ENVIRONMENT}"
echo ""
echo "Next steps:"
echo "  1. Run migrations:    ./scripts/migrate.sh"
echo "  2. Get gateway URL:   terraform output gateway_url"
echo "  3. Set GitHub secrets: WIF_PROVIDER, CI_SERVICE_ACCOUNT, GCP_PROJECT_ID"
echo "     Values from:        terraform output wif_provider_name"
echo "                         terraform output ci_sa_email"
