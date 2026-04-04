output "service_url" {
  value       = google_cloud_run_v2_service.this.uri
  description = "HTTPS URL of the Cloud Run service (e.g. https://dev-berberim-api-grpc-xxxx-ew.a.run.app)"
}

output "service_name" {
  value       = google_cloud_run_v2_service.this.name
  description = "Name of the Cloud Run service"
}
