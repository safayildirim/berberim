output "notification_channel_name" {
  value       = google_monitoring_notification_channel.email.name
  description = "Full resource name of the email notification channel"
}
