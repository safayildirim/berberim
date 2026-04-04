resource "google_cloud_run_v2_service" "this" {
  project              = var.project_id
  name                 = var.name
  location             = var.region
  ingress              = "INGRESS_TRAFFIC_ALL"
  deletion_protection  = false

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image   = var.image
      command = length(var.command) > 0 ? var.command : null

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
        cpu_idle = true
      }

      ports {
        name           = var.port_name
        container_port = var.port
      }

      # Plain env vars
      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Secret env vars (latest version)
      dynamic "env" {
        for_each = var.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      # Secret volume mounts
      # mount_path is the full file path (e.g. /secrets/jwt-private-key/private.pem).
      # Cloud Run mounts the volume at the directory; the file appears at mount_path.
      dynamic "volume_mounts" {
        for_each = var.secret_volumes
        content {
          name       = replace(volume_mounts.value.secret_id, "/[^a-zA-Z0-9-]/", "-")
          mount_path = dirname(volume_mounts.value.mount_path)
        }
      }
    }

    # Secret volumes declaration
    dynamic "volumes" {
      for_each = var.secret_volumes
      content {
        name = replace(volumes.value.secret_id, "/[^a-zA-Z0-9-]/", "-")
        secret {
          secret = volumes.value.secret_id
          items {
            version = "latest"
            path    = basename(volumes.value.mount_path)
          }
        }
      }
    }
  }

}

# IAM invoker bindings
resource "google_cloud_run_v2_service_iam_member" "invokers" {
  for_each = toset(var.invoker_members)

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = each.value
}
