variable "aws_profile" {
  description = "AWS CLI profile name"
  type        = string
  default     = "personal"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.small"
}

variable "my_ip" {
  description = "Your IP for SSH access (CIDR, e.g. 1.2.3.4/32)"
  type        = string
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "onebite"
}

variable "uploads_bucket_name" {
  description = "S3 bucket name for user uploads. If null, defaults to <project_name>-uploads (must be globally unique)."
  type        = string
  default     = null
}
