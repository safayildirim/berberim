output "repository_url" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.berberim.repository_id}"
  description = "Base URL for pushing/pulling images (without trailing slash)"
}
