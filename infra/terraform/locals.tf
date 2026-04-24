locals {
  uploads_bucket_name = coalesce(var.uploads_bucket_name, "${var.project_name}-uploads")
}
