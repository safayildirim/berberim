locals {
  prefix = "${var.environment}-berberim"
}

# ── Notification channel ──────────────────────────────────────────────────────

resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "${local.prefix} alerts"
  type         = "email"
  labels = {
    email_address = var.notification_email
  }
}

# ── Cloud Run: 5xx error rate ─────────────────────────────────────────────────
# Alert when 5xx responses exceed 5% of requests over a 5-minute window.

resource "google_monitoring_alert_policy" "cloud_run_5xx" {
  project      = var.project_id
  display_name = "${local.prefix} Cloud Run 5xx rate"
  combiner     = "OR"

  conditions {
    display_name = "5xx rate > 5%"
    condition_threshold {
      filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.project_id = "${var.project_id}"
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class = "5xx"
      EOT

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.labels.service_name"]
      }

      comparison      = "COMPARISON_GT"
      threshold_value = 0.05
      duration        = "60s"

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]

  alert_strategy {
    auto_close = "1800s"
  }
}

# ── Cloud Run: p99 request latency ───────────────────────────────────────────
# Alert when p99 latency exceeds 5s over a 5-minute window.

resource "google_monitoring_alert_policy" "cloud_run_latency" {
  project      = var.project_id
  display_name = "${local.prefix} Cloud Run p99 latency"
  combiner     = "OR"

  conditions {
    display_name = "p99 latency > 5s"
    condition_threshold {
      filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND resource.labels.project_id = "${var.project_id}"
        AND metric.type = "run.googleapis.com/request_latencies"
      EOT

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_MAX"
        group_by_fields      = ["resource.labels.service_name"]
      }

      comparison      = "COMPARISON_GT"
      threshold_value = 5000 # milliseconds
      duration        = "60s"

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]

  alert_strategy {
    auto_close = "1800s"
  }
}

# ── Uptime check: gateway health ──────────────────────────────────────────────

resource "google_monitoring_uptime_check_config" "gateway" {
  project      = var.project_id
  display_name = "${local.prefix} gateway uptime"
  timeout      = "10s"
  period       = "300s"

  http_check {
    path         = "/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = replace(var.gateway_url, "https://", "")
    }
  }
}

resource "google_monitoring_alert_policy" "gateway_uptime" {
  project      = var.project_id
  display_name = "${local.prefix} gateway uptime failure"
  combiner     = "OR"

  conditions {
    display_name = "uptime check failing"
    condition_threshold {
      filter = <<-EOT
        resource.type = "uptime_url"
        AND metric.type = "monitoring.googleapis.com/uptime_check/check_passed"
        AND metric.labels.check_id = "${google_monitoring_uptime_check_config.gateway.uptime_check_id}"
      EOT

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_FRACTION_TRUE"
        cross_series_reducer = "REDUCE_MEAN"
      }

      comparison      = "COMPARISON_LT"
      threshold_value = 0.5
      duration        = "60s"

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]

  alert_strategy {
    auto_close = "1800s"
  }
}
