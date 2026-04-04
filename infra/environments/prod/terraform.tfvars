project_id  = "berberim-492720"
region      = "europe-west1"
environment = "prod"

api_min_instances     = 1
api_max_instances     = 10
gateway_min_instances = 1
gateway_max_instances = 10
cpu                   = "1"
memory                = "512Mi"

jwt_issuer         = "https://berberim.com"
notification_email = "alerts@berberim.com"
