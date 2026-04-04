variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "GCP region"
}

variable "environment" {
  type        = string
  description = "Environment name (dev or prod)"
}

variable "api_image_tag" {
  type        = string
  description = "Docker image tag for the API service"
  default     = "latest"
}

variable "gateway_image_tag" {
  type        = string
  description = "Docker image tag for the gateway service"
  default     = "latest"
}

variable "api_min_instances" {
  type        = number
  description = "Minimum Cloud Run instances for API services"
  default     = 1
}

variable "api_max_instances" {
  type        = number
  description = "Maximum Cloud Run instances for API services"
  default     = 10
}

variable "gateway_min_instances" {
  type        = number
  description = "Minimum Cloud Run instances for gateway"
  default     = 1
}

variable "gateway_max_instances" {
  type        = number
  description = "Maximum Cloud Run instances for gateway"
  default     = 10
}

variable "cpu" {
  type        = string
  description = "CPU allocation for all Cloud Run services"
  default     = "1"
}

variable "memory" {
  type        = string
  description = "Memory allocation for all Cloud Run services"
  default     = "512Mi"
}

variable "jwt_issuer" {
  type        = string
  description = "JWT issuer URL (e.g. https://berberim.com)"
}

variable "notification_email" {
  type        = string
  description = "Email address for monitoring alerts"
}
