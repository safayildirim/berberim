locals {
  services = [
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "iamcredentials.googleapis.com",
    "cloudscheduler.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.services)
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
