# TODO - Terraform 리팩터 후속 대응 (2026-04-24)

## 배경

`/infra/terraform/`를 HashiCorp 스타일 가이드에 맞춰 리팩터하면서 다음이 적용됨:

1. outputs 알파벳 정렬
2. 리소스 이름 `onebite` → `main` (moved 블록으로 안전 이동)
3. `provider.default_tags` 도입, 리소스별 `Project` 태그 제거 (+ `ManagedBy = Terraform` 자동 부착)
4. S3 버킷 SSE(AES256) 설정 추가
5. EBS 루트 볼륨 암호화(`encrypted = true`) 추가 → **EC2 인스턴스 2회 교체됨**
6. 파일 분리 (`terraform.tf` / `providers.tf` / `locals.tf`)

**최종 상태**
- EC2 instance ID: `i-0dc428aa2f2c4a522`
- Elastic IP: `43.200.206.239` (유지)
- S3 bucket: `onebite-uploads` (신규)

---

## 1. 새 EC2 인스턴스 부트스트랩 (필수)

인스턴스가 교체되어 `/opt/onebite`, `infra/.env`, Docker 이미지 전부 소실됨. 다시 올려야 함.

```bash
# 로컬에서: SSH 키 추출 (이전 키는 폐기됨, 새로 받아야 함)
cd infra/terraform
terraform output -raw private_key > onebite-key.pem
chmod 600 onebite-key.pem

# SSH known_hosts에서 옛 호스트 키 제거
ssh-keygen -R 43.200.206.239

# 또는 SSM으로 접속 (권장)
aws ssm start-session --target i-0dc428aa2f2c4a522 --profile personal --region ap-northeast-2
```

서버 안에서:
```bash
sudo git clone https://github.com/hongsoohyuk/one-bite.git /opt/onebite
sudo chown -R ec2-user:ec2-user /opt/onebite
```

---

## 2. `infra/.env`에 S3 설정 추가 (필수)

```bash
cd infra/terraform
terraform output uploads_bucket_name          # → "onebite-uploads"
terraform output -raw uploads_public_url_base # → "https://onebite-uploads.s3.ap-northeast-2.amazonaws.com"
```

로컬 `infra/.env`에 아래 키 추가/갱신:
```
AWS_REGION=ap-northeast-2
S3_BUCKET=onebite-uploads
S3_PUBLIC_URL_BASE=https://onebite-uploads.s3.ap-northeast-2.amazonaws.com
```

EC2로 업로드:
```bash
scp -i infra/terraform/onebite-key.pem infra/.env ec2-user@43.200.206.239:/tmp/onebite.env
# 서버 안에서:
sudo mv /tmp/onebite.env /opt/onebite/infra/.env
sudo chown ec2-user:ec2-user /opt/onebite/infra/.env
sudo chmod 600 /opt/onebite/infra/.env
```

> 로컬 개발은 AWS 크레덴셜이 없어도 서버 기동 자체는 됨 — `/api/uploads/sign` 호출 시에만 실패.

---

## 3. 컨테이너 기동 (필수)

```bash
# 서버 안에서
cd /opt/onebite
echo $GITHUB_TOKEN | sudo -u ec2-user docker login ghcr.io -u <username> --password-stdin
sudo -u ec2-user docker compose --env-file ./infra/.env -f docker-compose.prod.yml pull
sudo -u ec2-user docker compose --env-file ./infra/.env -f docker-compose.prod.yml up -d
```

또는 GitHub Actions `Deploy to AWS` 워크플로우 수동 재실행 (배포 스크립트가 위 과정을 자동 수행).

---

## 4. 헬스체크 (필수)

```bash
curl -I http://43.200.206.239/actuator/health          # nginx 경유 (80)
curl -I http://43.200.206.239:8080/actuator/health     # 직접 (8080)
```

---

## 5. S3 업로드 엔드포인트 검증 (권장)

```bash
# JWT 획득 후
curl -X POST http://43.200.206.239:8080/api/uploads/sign \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"contentType":"image/jpeg"}'
# → presigned PUT URL + public URL 반환되면 OK
```

---

## 6. (선택) AMI drift 방지

현재 `data "aws_ami" "al2023"`가 `most_recent = true`라서, AWS가 신규 AL2023 AMI를 릴리스할 때마다 `terraform plan`이 인스턴스 교체를 요구함. 다음 중 하나 적용 권장:

```hcl
# 옵션 A: AMI 변경 무시
resource "aws_instance" "main" {
  # ...
  lifecycle {
    ignore_changes = [ami]
  }
}
```

```hcl
# 옵션 B: AMI ID 핀 (변수화)
variable "ami_id" {
  type    = string
  default = "ami-03794698649b299e6"  # 현재 인스턴스의 AMI
}
```

---

## 7. (선택) GitHub Actions에서 인스턴스 ID 동적 조회

현재 `.github/workflows/deploy.yml`의 `EC2_INSTANCE_ID`가 하드코딩(`i-0dc428aa2f2c4a522`)이라 인스턴스 교체 때마다 갱신 필요.

대안: `aws_iam_role_policy.github_actions_ssm`에 `ec2:DescribeInstances` 권한 추가 → deploy 스크립트에서 태그(`Name=onebite-server`) 기반 조회.

---

## 서버/모바일 코드 변경 필요 여부

- **Server**: 변경 불필요. `application-prod.properties`가 이미 `S3_BUCKET`, `S3_PUBLIC_URL_BASE`, `AWS_REGION` env를 읽음.
- **Mobile**: 변경 불필요. EIP `43.200.206.239`가 유지됐으므로 `BASE_URL` 하드코딩(5곳) 그대로 유효.
