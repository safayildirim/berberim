terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GCS bucket for Terraform remote state (all environments share this bucket).
resource "google_storage_bucket" "terraform_state" {
  name                        = "${var.project_id}-tf-state"
  location                    = "EU"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action { type = "Delete" }
    condition { num_newer_versions = 5 }
  }
}

# Enable the minimum set of APIs needed by all environments.
locals {
  bootstrap_apis = [
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "iamcredentials.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.bootstrap_apis)
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}
