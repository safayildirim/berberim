output "gateway_url" {
  value       = module.cloud_run_gateway.service_url
  description = "Public URL of the gateway (entry point for mobile apps)"
}

output "api_grpc_url" {
  value       = module.cloud_run_api_grpc.service_url
  description = "URL of the api-grpc service (IAM-only)"
}

output "api_http_url" {
  value       = module.cloud_run_api_http.service_url
  description = "URL of the api-http service (IAM-only)"
}

output "api_grpc_addr" {
  value       = "${trimprefix(module.cloud_run_api_grpc.service_url, "https://")}:443"
  description = "gRPC target address for use in gateway config (host:port, no scheme)"
}

output "registry_url" {
  value       = module.artifact_registry.repository_url
  description = "Artifact Registry base URL for pushing/pulling images"
}

output "wif_provider_name" {
  value       = module.iam.wif_provider_name
  description = "WIF provider name — set as WIF_PROVIDER in GitHub Actions secrets"
}

output "ci_sa_email" {
  value       = module.iam.ci_sa_email
  description = "CI service account email — set as CI_SERVICE_ACCOUNT in GitHub Actions secrets"
}

output "db_url_secret_id" {
  value       = module.secret_manager.db_url_secret_id
  description = "Secret Manager secret ID for the pooled DB URL"
}

output "db_url_direct_secret_id" {
  value       = module.secret_manager.db_url_direct_secret_id
  description = "Secret Manager secret ID for the direct DB URL (migrations)"
}
