terraform {
  backend "gcs" {
    bucket = "berberim-492720-tf-state"
    prefix = "dev"
  }
}
