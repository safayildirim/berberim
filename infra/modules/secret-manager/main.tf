# Secret shells only — no versions are created here.
# Values are uploaded manually after terraform apply:
#   gcloud secrets versions add <secret_id> --data-file=- ...
#
# Secrets per environment:
#   {env}-berberim-db-url              — Neon pooled connection string (API runtime)
#   {env}-berberim-db-url-direct       — Neon direct connection string (migrations only)
#   {env}-berberim-jwt-private-key     — RSA PEM (api-grpc + api-http)
#   {env}-berberim-twilio-account-sid  — Twilio Account SID
#   {env}-berberim-twilio-auth-token   — Twilio Auth Token
#   {env}-berberim-twilio-from-number  — Twilio sender phone number

resource "google_secret_manager_secret" "db_url" {
  project   = var.project_id
  secret_id = "${var.environment}-berberim-db-url"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "db_url_direct" {
  project   = var.project_id
  secret_id = "${var.environment}-berberim-db-url-direct"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "jwt_private_key" {
  project   = var.project_id
  secret_id = "${var.environment}-berberim-jwt-private-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "twilio_account_sid" {
  project   = var.project_id
  secret_id = "${var.environment}-berberim-twilio-account-sid"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "twilio_auth_token" {
  project   = var.project_id
  secret_id = "${var.environment}-berberim-twilio-auth-token"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "twilio_from_number" {
  project   = var.project_id
  secret_id = "${var.environment}-berberim-twilio-from-number"
  replication {
    auto {}
  }
}

# ── Per-secret IAM bindings ───────────────────────────────────────────────────

resource "google_secret_manager_secret_iam_member" "api_db_url" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.db_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.api_sa_email}"
}

resource "google_secret_manager_secret_iam_member" "api_jwt_key" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.jwt_private_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.api_sa_email}"
}

# db-url-direct is accessed manually (migrations) — no Cloud Run SA binding needed.

resource "google_secret_manager_secret_iam_member" "api_twilio_account_sid" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.twilio_account_sid.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.api_sa_email}"
}

resource "google_secret_manager_secret_iam_member" "api_twilio_auth_token" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.twilio_auth_token.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.api_sa_email}"
}

resource "google_secret_manager_secret_iam_member" "api_twilio_from_number" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.twilio_from_number.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.api_sa_email}"
}
