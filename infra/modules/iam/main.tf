# ── Service accounts ─────────────────────────────────────────────────────────

resource "google_service_account" "api" {
  account_id   = "${var.environment}-berberim-api"
  display_name = "[${var.environment}] Berberim API"
  project      = var.project_id
}

resource "google_service_account" "gateway" {
  account_id   = "${var.environment}-berberim-gateway"
  display_name = "[${var.environment}] Berberim Gateway"
  project      = var.project_id
}

# CI service account is shared across environments — use count to create it only once.
resource "google_service_account" "ci" {
  account_id   = "berberim-ci"
  display_name = "Berberim CI/CD (GitHub Actions)"
  project      = var.project_id
}

# ── IAM roles ─────────────────────────────────────────────────────────────────

resource "google_project_iam_member" "api_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = google_service_account.api.member
}

resource "google_project_iam_member" "api_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = google_service_account.api.member
}

resource "google_project_iam_member" "gateway_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = google_service_account.gateway.member
}

resource "google_project_iam_member" "gateway_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = google_service_account.gateway.member
}

# CI SA needs broad permissions to manage all project resources via Terraform.
# Standard pattern: editor (resource CRUD) + projectIamAdmin (IAM bindings)
# + workloadIdentityPoolAdmin (WIF management).

resource "google_project_iam_member" "ci_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = google_service_account.ci.member
}

resource "google_project_iam_member" "ci_project_iam_admin" {
  project = var.project_id
  role    = "roles/resourcemanager.projectIamAdmin"
  member  = google_service_account.ci.member
}

resource "google_project_iam_member" "ci_wif_pool_admin" {
  project = var.project_id
  role    = "roles/iam.workloadIdentityPoolAdmin"
  member  = google_service_account.ci.member
}

# ── Workload Identity Federation (GitHub Actions) ─────────────────────────────

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "ci_wif" {
  service_account_id = google_service_account.ci.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}
