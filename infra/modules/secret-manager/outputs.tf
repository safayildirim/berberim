output "db_url_secret_id" {
  value       = google_secret_manager_secret.db_url.secret_id
  description = "Secret ID for the pooled DB connection string"
}

output "db_url_direct_secret_id" {
  value       = google_secret_manager_secret.db_url_direct.secret_id
  description = "Secret ID for the direct DB connection string (migrations)"
}

output "jwt_private_key_secret_id" {
  value       = google_secret_manager_secret.jwt_private_key.secret_id
  description = "Secret ID for the JWT RSA private key"
}
