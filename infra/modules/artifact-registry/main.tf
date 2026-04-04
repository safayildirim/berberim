resource "google_artifact_registry_repository" "berberim" {
  project       = var.project_id
  location      = var.region
  repository_id = "berberim"
  format        = "DOCKER"
  description   = "Berberim container images (api and gateway)"
}
