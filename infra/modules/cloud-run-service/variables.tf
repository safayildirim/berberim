variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "GCP region to deploy the Cloud Run service"
}

variable "name" {
  type        = string
  description = "Cloud Run service name (e.g. dev-berberim-api-grpc)"
}

variable "image" {
  type        = string
  description = "Full image URL including tag (e.g. europe-west1-docker.pkg.dev/.../api:v1.0.0)"
}

variable "command" {
  type        = list(string)
  description = "Container command (overrides Dockerfile CMD)"
  default     = []
}

variable "port" {
  type        = number
  description = "Container port the service listens on"
}

variable "port_name" {
  type        = string
  description = "Port name — use 'h2c' for gRPC, 'http1' for HTTP"
  default     = "http1"
}

variable "cpu" {
  type        = string
  description = "CPU allocation (e.g. '1')"
  default     = "1"
}

variable "memory" {
  type        = string
  description = "Memory allocation (e.g. '512Mi')"
  default     = "512Mi"
}

variable "min_instances" {
  type        = number
  description = "Minimum number of instances (0 = scale to zero)"
  default     = 0
}

variable "max_instances" {
  type        = number
  description = "Maximum number of instances"
  default     = 2
}

variable "env_vars" {
  type        = map(string)
  description = "Plain environment variables to inject"
  default     = {}
}

# Secret env vars: map of ENV_VAR_NAME => secret_id
# The latest version of each secret is mounted as the env var.
variable "secret_env_vars" {
  type        = map(string)
  description = "Map of env var name => Secret Manager secret_id. Latest version is used."
  default     = {}
}

# Secret volumes: list of { secret_id, mount_path }
# Each secret is volume-mounted at the given path.
variable "secret_volumes" {
  type = list(object({
    secret_id  = string
    mount_path = string
  }))
  description = "Secrets to mount as volumes. Each secret's latest version is mounted at mount_path."
  default     = []
}

# IAM invokers — list of members that can invoke this service.
# Use ["allUsers"] for public, or specific SA emails for IAM-only.
variable "invoker_members" {
  type        = list(string)
  description = "IAM members granted roles/run.invoker on this service"
  default     = []
}

variable "service_account_email" {
  type        = string
  description = "Service account email the Cloud Run service runs as"
}
