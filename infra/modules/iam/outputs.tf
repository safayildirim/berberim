output "api_sa_email" {
  value       = google_service_account.api.email
  description = "Service account email for the API Cloud Run services"
}

output "gateway_sa_email" {
  value       = google_service_account.gateway.email
  description = "Service account email for the Gateway Cloud Run service"
}

output "ci_sa_email" {
  value       = google_service_account.ci.email
  description = "Service account email for GitHub Actions CI/CD"
}

output "wif_provider_name" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Full resource name of the WIF provider for GitHub Actions"
}
