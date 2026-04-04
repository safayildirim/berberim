variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "environment" {
  type        = string
  description = "Environment name (dev or prod)"
}

variable "api_sa_email" {
  type        = string
  description = "Service account email for the API Cloud Run services"
}
