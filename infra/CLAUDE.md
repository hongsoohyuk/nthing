# Infra - Docker & 배포

## 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| 클라우드 | AWS EC2 (Seoul) | ap-northeast-2 |
| IaC | Terraform (AWS Provider) | Default VPC 사용 |
| 컨테이너 | Docker + Docker Compose | |
| 리버스 프록시 | Nginx + Certbot (Let's Encrypt) | SSL 종단 |
| CI/CD | GitHub Actions + GHCR | 이미지 빌드/푸시/SSH 배포 |
| DB | PostgreSQL 16 + PostGIS 3.4 | 위치 기반 쿼리 |
| 런타임 | Eclipse Temurin JRE 17 (jammy) | 멀티스테이지 빌드 |
| OS | Amazon Linux 2023 (arm64) | Graviton2 호환 |

## 디렉토리 구조

```
프로젝트 루트/
├── docker-compose.yml          # 개발 환경
├── docker-compose.prod.yml     # 운영 환경 (nginx, certbot, server, db)
├── Makefile                    # 편의 명령어
├── .github/workflows/
│   └── deploy.yml              # GHCR 푸시 + SSH 배포 + 헬스체크
├── infra/
│   ├── CLAUDE.md               # 이 문서
│   ├── .env.example            # 환경변수 템플릿
│   ├── nginx/
│   │   └── nginx.conf          # 리버스 프록시 설정
│   ├── scripts/
│   │   └── init-ssl.sh         # 최초 Let's Encrypt 발급 스크립트
│   ├── certbot/                # 인증서 저장 디렉토리
│   └── terraform/
│       ├── main.tf             # AWS 리소스 (SG, Key Pair, EC2, EIP)
│       ├── variables.tf        # 변수 정의
│       ├── outputs.tf          # 출력값
│       ├── user-data.sh        # EC2 초기화 (Docker 설치)
│       └── .gitignore
└── server/
    ├── Dockerfile              # 멀티스테이지 빌드 + HEALTHCHECK
    └── .dockerignore
```

## AWS 인프라 스펙

| 리소스 | 사양 | 월 예상 비용 |
|--------|------|--------------|
| EC2 t4g.small | 2 vCPU ARM Graviton2 / 2GB RAM | ~$15 |
| EBS gp3 | 30GB | ~$2.4 |
| Elastic IP | 인스턴스 연결 중 무료, 분리 시 시간당 $0.005 | - |
| Egress | 100GB/월 무료 이후 $0.126/GB | - |
| S3 (uploads) | 사용량 기반 (저장 $0.023/GB·월, PUT $0.005/1k, GET $0.0004/1k) | ~$0-1/월 (MVP 규모) |
| **합계** | | **~$17-20/월** |

Default VPC/Subnet을 사용해 네트워크 리소스는 직접 생성하지 않음.

## Terraform 사용법

### 작업 규칙 (Claude 전용)

Terraform 코드를 작성·수정·리뷰할 때는 반드시 아래 skill들을 먼저 invoke한 뒤 작업한다.

- `terraform-code-generation:terraform-style-guide` — 파일 구성, 네이밍, 변수/출력 규칙, 보안 하드닝 체크리스트
- `terraform-code-generation:terraform-workflow` (존재 시) — `fmt` → `validate` → `plan` 순서
- Registry 조회 MCP (`mcp__plugin_terraform-code-generation_terraform__*`) — provider/module 최신 버전 및 capability 확인 후 코드 생성

커밋 전 항상 `terraform fmt -recursive` + `terraform validate` 통과 확인.

### 사전 준비

1. AWS CLI 설치 + profile 설정: `aws configure --profile personal`
2. SSH 접근 허용할 내 IP 확보 (CIDR `1.2.3.4/32` 형식)
3. `terraform.tfvars` 작성 (아래 참고)

### 실행

```bash
cd infra/terraform
terraform init          # AWS provider 다운로드
terraform plan          # 변경사항 확인
terraform apply         # 리소스 생성
terraform destroy       # 리소스 삭제
```

### 주요 변수 (terraform.tfvars)

```hcl
my_ip         = "1.2.3.4/32"        # SSH 접근 허용할 내 IP (필수)
aws_profile   = "personal"          # 기본값
aws_region    = "ap-northeast-2"    # 기본값
instance_type = "t4g.small"         # 기본값
project_name  = "onebite"           # 기본값
```

### SSH 키 추출

`tls_private_key`로 자동 생성된 키를 로컬 파일로 저장:

```bash
terraform output -raw private_key > onebite-key.pem
chmod 600 onebite-key.pem
ssh -i onebite-key.pem ec2-user@$(terraform output -raw public_ip)
```

## 실행 명령어 (Makefile)

| 명령어 | 설명 |
|--------|------|
| `make dev` | 개발 환경 기동 (docker compose up --build -d) |
| `make dev-down` | 개발 환경 종료 |
| `make prod` | 운영 환경 기동 (docker-compose.prod.yml) |
| `make prod-down` | 운영 환경 종료 |
| `make build` | JAR 로컬 빌드 (gradlew bootJar) |
| `make logs` | 전체 로그 |
| `make logs-server` | 서버 로그만 |
| `make logs-db` | DB 로그만 |
| `make clean` | 전체 정리 (volumes + gradle clean) |

## 환경 구성

### 개발 (docker-compose.yml)
- **DB**: postgis/postgis:16-3.4, 포트 5432, 크레덴셜 하드코딩 (onebite/onebite-dev-pass)
- **서버**: Dockerfile 빌드, 포트 8080, Spring profile=prod
- **JWT**: 개발용 시크릿 하드코딩
- **헬스체크**: DB → pg_isready (5s 간격)

### 운영 (docker-compose.prod.yml)
- **nginx**: 80/443 포트 노출, 리버스 프록시 → `server:8080`
- **certbot**: Let's Encrypt 인증서 발급/갱신 (볼륨 공유)
- **DB**: 환경변수로 크레덴셜 주입, 리소스 제한 (512M, 0.5 CPU)
- **서버**: `infra/.env` 로드, 리소스 제한 (768M, 1.0 CPU), 내부 네트워크만 노출
- **헬스체크**: DB + 서버 (/actuator/health, 30s 간격, 40s 시작 유예)
- **재시작**: `restart: always`

### 환경변수 (infra/.env.example)
```
DB_NAME, DB_USERNAME, DB_PASSWORD
JWT_SECRET, JWT_EXPIRATION
KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI
NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
APPLE_CLIENT_ID
```

## Docker 빌드 (server/Dockerfile)

멀티스테이지 빌드:
1. **Builder** (temurin:17-jdk-jammy): Gradle 래퍼 → 의존성 다운로드 → bootJar
2. **Runtime** (temurin:17-jre-jammy): JAR 복사 → `java -jar app.jar`
3. **HEALTHCHECK**: `/actuator/health` 주기적 호출

## CI/CD 파이프라인 (.github/workflows/deploy.yml)

1. main 브랜치 푸시 (paths: `server/**`, `docker-compose.prod.yml`, `infra/nginx/**`, `.github/workflows/deploy.yml`) 또는 수동 트리거
2. Docker 이미지 **linux/arm64**로 빌드 → GHCR(`ghcr.io/<owner>/onebite/server:latest`) 푸시
3. **GitHub OIDC**로 AWS IAM role 가정 (`onebite-github-actions-role`)
4. **AWS SSM Run Command**로 EC2에 배포 스크립트 실행
   - **bootstrap**: `/opt/onebite`가 없으면 `git clone` → 항상 `ONEBITE_ENV_B64` Secret을 풀어 `/opt/onebite/infra/.env`로 저장 (overwrite) → chown/chmod
   - **deploy**: `git fetch && git reset --hard origin/main` → `docker login ghcr.io` → `docker compose --env-file ./infra/.env pull/up -d` → `docker image prune`
5. `/actuator/health` 재시도 헬스체크 (HTTP 80, nginx 경유)

### GitHub Secrets
- `AWS_ROLE_TO_ASSUME` — `arn:aws:iam::<account>:role/onebite-github-actions-role`
- `EC2_HOST` — Elastic IP (health check 및 로그 보고용)
- `ONEBITE_ENV_B64` — `infra/.env` 파일 전체 내용을 base64로 인코딩한 값. **이게 EC2의 `/opt/onebite/infra/.env` 원본**. 값 수정 시:
  ```bash
  # 로컬에서 infra/.env 수정 → 다시 base64
  base64 -i infra/.env | tr -d '\n' | pbcopy
  # GitHub → Settings → Secrets → ONEBITE_ENV_B64 편집
  # Actions 탭에서 "Deploy to AWS" 워크플로우 Re-run
  ```
  배포 워크플로우가 줄바꿈 자동 제거는 해주지만, 생성 시 `tr -d '\n'` 걸어두면 안전.
- (GHCR 인증은 GitHub 기본 토큰 사용)

### GitHub Actions → AWS 인증 흐름
- Terraform이 `aws_iam_openid_connect_provider.github`와 GitHub Actions용 role(`onebite-github-actions-role`)을 생성
- Role의 trust policy가 `repo:hongsoohyuk/one-bite:*` sub claim을 허용
- 부여된 권한: `ssm:SendCommand`, `ssm:GetCommandInvocation`, `ssm:ListCommandInvocations`
- EC2에는 `onebite-ec2-ssm-profile` instance profile이 붙어 `AmazonSSMManagedInstanceCore`로 SSM과 통신

### 인스턴스 ID 하드코딩
`deploy.yml`의 `env.EC2_INSTANCE_ID`는 현재 인스턴스 ID로 하드코딩되어 있습니다. 인스턴스를 재생성하면 이 값도 같이 업데이트해야 합니다.

## S3 이미지 업로드

유저가 등록하는 나눠사기 상품 사진은 S3에 직접 업로드합니다 (서버는 presigned PUT URL만 발급).

### Terraform 리소스
- `aws_s3_bucket.uploads` — 기본 이름 `onebite-uploads` (전역 중복 시 `uploads_bucket_name` 변수로 오버라이드)
- `aws_s3_bucket_ownership_controls` — `BucketOwnerEnforced` (ACL 사용 안 함)
- `aws_s3_bucket_public_access_block` — `block_public_policy=false` (splits/* public read 허용)
- `aws_s3_bucket_policy` — `splits/*` prefix만 public GET 허용, 나머지는 private
- `aws_s3_bucket_cors_configuration` — 모바일 클라이언트 PUT 허용 (`PUT`, `GET`, `*` origin)
- `aws_iam_role_policy.ec2_s3_uploads` — 기존 `ec2_ssm` role에 `s3:PutObject/GetObject/DeleteObject` 권한 연결 (presigned URL 서명에 필수)

### 업로드 플로우
1. 모바일이 `POST /api/uploads/sign` → 서버가 presigned PUT URL + 최종 public URL 반환
2. 모바일이 `PUT <presigned URL>` 로 이미지 바이트 직접 업로드 (서버 경유 X)
3. 모바일이 `POST /api/splits` 의 `imageUrl` 필드에 public URL 포함하여 등록

### 배포 후 환경변수 설정
```bash
cd infra/terraform && terraform apply
BUCKET=$(terraform output -raw uploads_bucket_name)
URLBASE=$(terraform output -raw uploads_public_url_base)
# infra/.env 에 반영 후 EC2로 재배포
# S3_BUCKET=$BUCKET
# S3_PUBLIC_URL_BASE=$URLBASE
# AWS_REGION=ap-northeast-2
```

로컬 개발에서는 AWS 크레덴셜이 없어도 서버는 기동됨 — `/api/uploads/sign` 호출 시에만 실패합니다. 로컬에서 업로드까지 테스트하려면 `aws configure` 프로필 설정 필요.

## 운영 배포 절차

### 최초 1회 (인프라 프로비저닝)
```bash
cd infra/terraform
terraform init && terraform apply

terraform output -raw private_key > onebite-key.pem
chmod 600 onebite-key.pem

# 로컬 SSH 접속 (my_ip 화이트리스트 유지)
ssh -i onebite-key.pem ec2-user@$(terraform output -raw public_ip)

# 또는 AWS SSM Session Manager로 접속 (권장)
aws ssm start-session --target $(terraform output -raw instance_id) --profile personal --region ap-northeast-2
```

### 최초 1회 (저장소 bootstrap)

**수동 작업 필요 없음.** GitHub Secret `ONEBITE_ENV_B64`만 등록되어 있으면 배포 워크플로우가 EC2에서 자동으로 다음을 수행:

- `/opt/onebite`가 없으면 `git clone` + chown
- `ONEBITE_ENV_B64`를 디코드하여 `/opt/onebite/infra/.env`로 저장 (매 배포마다 덮어쓰기, Secret = 단일 소스 of truth)

즉, 새 인스턴스 만들면:
1. Terraform으로 인스턴스 생성
2. `.github/workflows/deploy.yml` 의 `EC2_INSTANCE_ID`를 새 값으로 업데이트 후 push
3. Actions가 알아서 bootstrap + deploy

`.env` 값 변경 시에도 동일: Secret 편집 → 수동 "Re-run workflow".

### 최초 1회 (SSL 발급, 도메인 준비 후)
현재는 HTTP-only nginx 구성. 도메인이 준비되면:
1. `infra/nginx/nginx.conf`에 443 server 블록과 80→443 redirect 복원
2. 서버에서 `./infra/scripts/init-ssl.sh <도메인>` 실행
3. OAuth provider 콘솔에서 redirect URI를 HTTPS/도메인 기반으로 업데이트
4. `infra/.env`의 `*_REDIRECT_URI`도 같이 업데이트 → `base64 -i infra/.env | tr -d '\n'` → `ONEBITE_ENV_B64` Secret 덮어쓰기 → Actions "Re-run"

### 일상 배포
GitHub Actions가 main 브랜치 푸시 시 자동으로 배포합니다. 수동 롤아웃은 Actions 탭에서 `Deploy to AWS` 워크플로우를 재실행.

## 현재 임시 조치 / 하드코딩 (프로덕션 전환 시 정리 대상)

도메인이 없는 상태에서 배포 파이프라인을 우선 검증하기 위해 아래 항목들이 임시로 들어가 있습니다.

### 1) nginx HTTP-only
- `infra/nginx/nginx.conf`가 443 server 블록과 80→443 redirect를 제거한 임시 버전
- 원본(SSL + redirect)은 git history 커밋 `be37a2d` 이전(예: `4cf983d`)에서 확인 가능
- 복원 시: 443 블록 복원 + 80의 location `/`을 `return 301 https://$host$request_uri;`로 변경. `/.well-known/acme-challenge/` location은 유지

### 2) `/opt/onebite/infra/.env`의 OAuth 값이 전부 dummy
- 영향 키: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `APPLE_CLIENT_ID`
- `DB_*`, `JWT_*`는 실제 값이라 서버는 정상 기동하지만, OAuth 로그인은 동작하지 않음
- 실제 값은 각 개발자 콘솔(카카오/네이버/Google GCP/Apple Developer)에만 있고, 이전 AWS 인스턴스의 .env는 OCI 이주 때 소실됨

### 3) `deploy.yml`의 EC2 인스턴스 ID 하드코딩
- `.github/workflows/deploy.yml`의 `env.EC2_INSTANCE_ID: i-0dc428aa2f2c4a522`
- 인스턴스를 재생성하면 이 값도 같이 수정해야 함
- 대안: `aws_iam_role_policy.github_actions_ssm`에 `ec2:DescribeInstances` 권한 추가 + deploy 스크립트에서 태그(`Name=onebite-server`) 기반 조회

### 4) 모바일 클라이언트 / 문서의 서버 IP 하드코딩
- `http://43.200.206.239:8080`이 직접 박혀 있는 5개 파일:
  - `mobile/composeApp/src/commonMain/kotlin/com/onebite/app/data/api/OneBiteApi.kt:33`
  - `mobile/composeApp/src/androidMain/kotlin/com/onebite/app/auth/OAuthHandler.android.kt:29`
  - `mobile/composeApp/src/iosMain/kotlin/com/onebite/app/auth/OAuthHandler.ios.kt:25`
  - `mobile/iosApp/iosApp/Info.plist` (NSExceptionDomains 키 `43.200.206.239`)
  - `docs/setup-guide.md`
- 도메인 전환 시 일괄 수정 + 모바일 앱 재빌드 필요

### 5) AWS Security Group의 SSH 22번은 로컬 IP 전용
- `main.tf`의 SG ingress SSH 규칙이 `var.my_ip = 59.10.176.51/32`로 제한
- 로컬 IP가 바뀌면 `terraform.tfvars`의 `my_ip` 갱신 후 `terraform apply`
- GitHub Actions 배포는 이 SSH를 거치지 않고 SSM으로 통신하므로 영향 없음

## 도메인 준비 시 체크리스트

도메인을 확보한 시점에 아래 순서대로 진행하면 됩니다.

### 1) DNS
- [ ] 도메인(또는 서브도메인)의 A 레코드를 Elastic IP `43.200.206.239`로 지정
- [ ] 전파 확인: `dig +short api.example.com`

### 2) nginx.conf 복원
- [ ] `infra/nginx/nginx.conf`에 443 server 블록 추가 (SSL 종단, proxy → `spring_boot`)
- [ ] 80 server 블록의 location `/`을 HTTPS redirect로 변경
- [ ] `/.well-known/acme-challenge/` location은 유지 (certbot 갱신용)
- [ ] 커밋은 **SSL 발급 이전에 push하지 말 것** (cert 파일 없이 443 서버 블록이 먼저 올라가면 nginx 기동 실패)

### 3) Let's Encrypt 발급
- [ ] `ssh`(또는 `aws ssm start-session`)로 접속
- [ ] `cd /opt/onebite && sudo -u ec2-user ./infra/scripts/init-ssl.sh <your-domain>`
- [ ] 이후 nginx.conf 복원본을 git push → deploy 워크플로우로 반영
- [ ] `curl -I https://<domain>/actuator/health` → `200 OK` 확인

### 4) OAuth 콘솔 업데이트
- [ ] 카카오: developers.kakao.com → 내 애플리케이션 → 카카오 로그인 → Redirect URI에 `https://<domain>/api/auth/kakao/callback` 추가
- [ ] 네이버: developers.naver.com → 애플리케이션 → 서비스 URL / Callback URL 업데이트
- [ ] Google: console.cloud.google.com → APIs & Services → Credentials → OAuth client → Authorized redirect URIs
- [ ] Apple: developer.apple.com → Identifiers → Services IDs → Domains and Subdomains / Return URLs

### 5) `infra/.env` 업데이트 + 재배포
- [ ] 각 콘솔에서 실제 `CLIENT_SECRET` 복사 → 로컬 `infra/.env`에 반영 (`KAKAO_CLIENT_SECRET`, `NAVER_CLIENT_SECRET`, `GOOGLE_CLIENT_SECRET`)
- [ ] `KAKAO_REDIRECT_URI`, `GOOGLE_REDIRECT_URI`를 `https://<domain>/...`로 변경
- [ ] `base64 -i infra/.env | tr -d '\n' | pbcopy` → GitHub Settings에서 `ONEBITE_ENV_B64` Secret 덮어쓰기
- [ ] GitHub Actions → "Deploy to AWS" → **Re-run workflow** 클릭 (bootstrap step이 EC2의 `.env`를 덮어쓰고 컨테이너 재시작까지 처리)

### 6) 모바일 클라이언트 base URL 전환
- [ ] 위 "모바일 클라이언트 / 문서의 서버 IP 하드코딩" 섹션의 5개 파일을 `https://<domain>` (포트 없음)으로 일괄 수정
- [ ] iOS `Info.plist`의 `NSExceptionDomains` 키를 제거하거나, 도메인으로 교체 (HTTPS라면 ATS exception 자체가 불필요)
- [ ] Android/iOS 앱 재빌드 + 배포

### 7) 검증
- [ ] `curl https://<domain>/actuator/health` → `{"status":"UP"}`
- [ ] 모바일 앱에서 카카오/네이버/Google/Apple 로그인 각각 실행
- [ ] JWT 발급 후 `/api/splits` 등 인증 요구 엔드포인트 호출

## 구현 상태

### 완료
- [x] Docker Compose 개발 환경 (PostgreSQL + PostGIS + Spring Boot)
- [x] Docker Compose 운영 환경 (nginx + certbot + server + db)
- [x] 멀티스테이지 Dockerfile + HEALTHCHECK
- [x] Makefile 편의 명령어
- [x] 환경변수 템플릿 (.env.example)
- [x] Spring 프로필 분리 (default/prod)
- [x] AWS Terraform (Default VPC + SG + Key Pair + EC2 t4g.small + EIP + S3 uploads bucket)
- [x] GitHub Actions 배포 파이프라인 (GHCR + SSH)
- [x] Nginx 리버스 프록시 설정
- [x] Let's Encrypt 발급 스크립트 (init-ssl.sh)

### TODO
- [ ] **도메인 연결** — Route53 또는 외부 DNS에서 A 레코드를 EIP로 지정
- [ ] **HTTPS 활성화** — 도메인 확보 후 `init-ssl.sh` 실행
- [ ] **모바일 API base URL을 도메인 기반으로 전환** — 현재 EIP 하드코딩
- [ ] **모니터링** — Prometheus + Grafana
- [ ] **로깅** — ELK 또는 Loki
- [ ] **백업** — PostgreSQL 자동 백업 + 복원 절차
