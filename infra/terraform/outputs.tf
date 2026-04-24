output "api_url" {
  description = "API base URL"
  value       = "http://${aws_eip.main.public_ip}:8080"
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions (OIDC-assumed)"
  value       = aws_iam_role.github_actions.arn
}

output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.main.id
}

output "private_key" {
  description = "SSH private key (save to file)"
  value       = tls_private_key.main.private_key_openssh
  sensitive   = true
}

output "public_ip" {
  description = "Elastic IP of the EC2 instance"
  value       = aws_eip.main.public_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i onebite-key.pem ec2-user@${aws_eip.main.public_ip}"
}

output "uploads_bucket_name" {
  description = "S3 bucket name for user uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "uploads_public_url_base" {
  description = "Public base URL for uploaded images (used as S3_PUBLIC_URL_BASE in infra/.env)"
  value       = "https://${aws_s3_bucket.uploads.bucket}.s3.${var.aws_region}.amazonaws.com"
}
