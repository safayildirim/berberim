terraform {
  required_version = ">= 1.7"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  prefix        = "${var.environment}-berberim"
  github_repo   = "safayildirim/berberim"
  registry_url  = "${var.region}-docker.pkg.dev/${var.project_id}/berberim"
  api_image     = "${local.registry_url}/api:${var.api_image_tag}"
  gateway_image = "${local.registry_url}/gateway:${var.gateway_image_tag}"
}

# ── GCP API enablement ────────────────────────────────────────────────────────

module "project_services" {
  source     = "../../modules/project-services"
  project_id = var.project_id
}

# ── IAM: service accounts + WIF ──────────────────────────────────────────────

module "iam" {
  source      = "../../modules/iam"
  project_id  = var.project_id
  environment = var.environment
  github_repo = local.github_repo

  depends_on = [module.project_services]
}

# ── Artifact Registry ─────────────────────────────────────────────────────────

module "artifact_registry" {
  source     = "../../modules/artifact-registry"
  project_id = var.project_id
  region     = var.region

  depends_on = [module.project_services]
}

# ── Secret Manager (shells only — values uploaded manually) ──────────────────

module "secret_manager" {
  source       = "../../modules/secret-manager"
  project_id   = var.project_id
  environment  = var.environment
  api_sa_email = module.iam.api_sa_email

  depends_on = [module.project_services]
}

# ── Cloud Run: api-grpc ───────────────────────────────────────────────────────

module "cloud_run_api_grpc" {
  source = "../../modules/cloud-run-service"

  project_id            = var.project_id
  region                = var.region
  name                  = "${local.prefix}-api-grpc"
  image                 = local.api_image
  command               = ["./berberim-api", "grpc"]
  port                  = 9091
  port_name             = "h2c"
  cpu                   = var.cpu
  memory                = var.memory
  min_instances         = var.api_min_instances
  max_instances         = var.api_max_instances
  service_account_email = module.iam.api_sa_email

  env_vars = {
    ENV                   = var.environment
    GRPC_PORT             = "9091"
    JWT_ISSUER            = var.jwt_issuer
    JWT_PRIVATE_KEY_PATH  = "/secrets/jwt-private-key/private.pem"
    DB_MAX_OPEN_CONNS     = "5"
    DB_MAX_IDLE_CONNS     = "2"
    DB_CONN_MAX_LIFETIME  = "5m"
    DB_CONN_MAX_IDLE_TIME = "1m"
  }

  secret_env_vars = {
    DB_URL = module.secret_manager.db_url_secret_id
  }

  secret_volumes = [
    {
      secret_id  = module.secret_manager.jwt_private_key_secret_id
      mount_path = "/secrets/jwt-private-key/private.pem"
    }
  ]

  invoker_members = ["serviceAccount:${module.iam.gateway_sa_email}"]

  depends_on = [module.iam, module.secret_manager]
}

# ── Cloud Run: api-http ───────────────────────────────────────────────────────

module "cloud_run_api_http" {
  source = "../../modules/cloud-run-service"

  project_id            = var.project_id
  region                = var.region
  name                  = "${local.prefix}-api-http"
  image                 = local.api_image
  command               = ["./berberim-api", "http"]
  port                  = 8081
  port_name             = "http1"
  cpu                   = var.cpu
  memory                = var.memory
  min_instances         = var.api_min_instances
  max_instances         = var.api_max_instances
  service_account_email = module.iam.api_sa_email

  env_vars = {
    ENV                   = var.environment
    JWT_ISSUER            = var.jwt_issuer
    JWT_PRIVATE_KEY_PATH  = "/secrets/jwt-private-key/private.pem"
    DB_MAX_OPEN_CONNS     = "5"
    DB_MAX_IDLE_CONNS     = "2"
    DB_CONN_MAX_LIFETIME  = "5m"
    DB_CONN_MAX_IDLE_TIME = "1m"
  }

  secret_env_vars = {
    DB_URL = module.secret_manager.db_url_secret_id
  }

  secret_volumes = [
    {
      secret_id  = module.secret_manager.jwt_private_key_secret_id
      mount_path = "/secrets/jwt-private-key/private.pem"
    }
  ]

  invoker_members = ["serviceAccount:${module.iam.gateway_sa_email}"]

  depends_on = [module.iam, module.secret_manager]
}

# ── Cloud Run: gateway ────────────────────────────────────────────────────────

module "cloud_run_gateway" {
  source = "../../modules/cloud-run-service"

  project_id            = var.project_id
  region                = var.region
  name                  = "${local.prefix}-gateway"
  image                 = local.gateway_image
  port                  = 8080
  port_name             = "http1"
  cpu                   = var.cpu
  memory                = var.memory
  min_instances         = var.gateway_min_instances
  max_instances         = var.gateway_max_instances
  service_account_email = module.iam.gateway_sa_email

  env_vars = {
    ENV            = var.environment
    API_GRPC_ADDR  = "${trimprefix(module.cloud_run_api_grpc.service_url, "https://")}:443"
    AUTHZ_JWKS_URL = "${module.cloud_run_api_http.service_url}/.well-known/jwks.json"
    AUTHZ_ISSUER   = var.jwt_issuer
  }

  invoker_members = ["allUsers"]

  depends_on = [module.iam, module.cloud_run_api_grpc, module.cloud_run_api_http]
}

# ── Monitoring ────────────────────────────────────────────────────────────────

module "monitoring" {
  source = "../../modules/monitoring"

  project_id           = var.project_id
  environment          = var.environment
  notification_email   = var.notification_email
  gateway_service_name = module.cloud_run_gateway.service_name
  gateway_url          = module.cloud_run_gateway.service_url

  depends_on = [module.cloud_run_gateway]
}
