variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "environment" {
  type        = string
  description = "Environment name (dev or prod)"
}

variable "notification_email" {
  type        = string
  description = "Email address for alert notifications"
}

variable "gateway_service_name" {
  type        = string
  description = "Cloud Run service name for the gateway (for uptime check)"
}

variable "gateway_url" {
  type        = string
  description = "Public HTTPS URL of the gateway service (for uptime check)"
}
