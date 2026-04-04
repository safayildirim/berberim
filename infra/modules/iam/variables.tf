variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "environment" {
  type        = string
  description = "Environment name (dev or prod)"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository in owner/repo format (e.g. safayildirim/berberim)"
}
