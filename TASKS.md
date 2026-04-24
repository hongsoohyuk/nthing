# One Bite - 전체 TODO 관리

> 최종 업데이트: 2026-04-24

각 영역별 상세는 `server/CLAUDE.md`, `mobile/CLAUDE.md`, `infra/CLAUDE.md` 참조.

---

## Phase 1 (MVP) — ✅ 기능 구현 완료

코드 작업 체크리스트는 모두 끝났고, 실기기 E2E 테스트 + OAuth 실값만 남은 상태.

### 서버 (`server/`) — ✅ 기능 완료

- [x] Split CRUD + 참여(join) + 취소(cancel)
- [x] 자동 매칭 (WAITING → MATCHED)
- [x] 위치 기반 조회 (H2: Haversine, PostgreSQL: PostGIS 전략 패턴)
- [x] 소셜 로그인 4종 (카카오/네이버/구글/애플) + JWT
- [x] 유저 프로필 (GET/PATCH /users/me)
- [x] 페이지네이션 (PageResponse, page/size)
- [x] Flyway 마이그레이션
- [x] **S3 presigned URL 업로드 (POST /uploads/sign)** — 2026-04-24
- [x] **내가 등록/참여한 나눠사기 (GET /splits/my, /splits/participated)** — 2026-04-24
- [x] docs/api-spec.md 최신
- [x] EC2 + PostgreSQL 배포 (Docker Compose)
- [x] GET /api/splits 비인증 둘러보기 허용

### 모바일 (`mobile/`) — ✅ 기능 완료 (Android + iOS 컴파일 통과)

- [x] KMP 프로젝트 (Android + iOS 타겟)
- [x] Ktor 클라이언트 (모든 서버 API 연동)
- [x] 소셜 로그인 (Android: 카카오/네이버/구글, iOS: 애플)
- [x] 토큰 저장 (Android: EncryptedSharedPreferences, iOS: Keychain)
- [x] 자동 로그인
- [x] 전체 화면 (로그인 / 메인 3탭 / 상세 / 등록 / 내 나눠사기 / 참여한 나눠사기)
- [x] **GPS 위치 캡처** (FusedLocation / CLLocationManager expect/actual)
- [x] **Kakao Map 연동** (MapTab에 핀 + 현재위치)
- [x] **카메라/갤러리** (ImagePicker expect/actual)
- [x] **이미지 S3 presigned PUT 업로드 플로우** — 2026-04-24 (이전엔 pickedImage가 서버로 안 감)
- [x] **프로필 메뉴 → 내 나눠사기 / 참여한 나눠사기 스크린** — 2026-04-24
- [x] Material3 테마 + 공통 UI (LoadingContent, ErrorContent, EmptyContent, SplitCard)
- [x] 네비게이션 (6 라우트: LOGIN, MAIN, SPLIT_DETAIL, CREATE_SPLIT, MY_SPLITS, PARTICIPATED_SPLITS)

### 인프라 (`infra/`) — ✅ AWS 배포 + CI/CD 자동화 완료

- [x] Docker Compose (개발 + 운영)
- [x] 멀티스테이지 Dockerfile + HEALTHCHECK
- [x] AWS Terraform: Default VPC + SG + KeyPair + EC2 t4g.small + EIP
- [x] IAM: EC2 SSM instance profile, GitHub Actions OIDC role
- [x] **S3 uploads 버킷 + bucket policy (splits/* public read) + CORS + EC2 role s3:PutObject** — 2026-04-24
- [x] **GitHub Actions 자동 배포** (GHCR 빌드 + SSM Run Command)
- [x] **배포 워크플로우 bootstrap** — /opt/onebite 자동 git clone + `ONEBITE_ENV_B64` Secret 에서 .env 복원 (수동 scp 불필요) — 2026-04-24
- [x] Nginx 리버스 프록시 (HTTP-only 임시)

---

## MVP 남은 것 (코드 아닌 운영/테스트)

**배포 & 검증**
- [ ] `feature/mvp` 브랜치 → main merge → Actions 자동 배포
- [ ] `curl http://43.200.206.239/actuator/health` 확인
- [ ] 실기기 E2E 스모크: 로그인 → 상품 등록(위치 캡처 + 사진 업로드) → 지도에서 핀 확인 → 참여
- [ ] 모바일에서 `GET /splits/mine` / `/participated` 정상 호출 확인

**보류 중 (도메인 확보 후 일괄 처리 — `infra/CLAUDE.md` 도메인 체크리스트 참조)**
- [ ] OAuth 콘솔에서 실제 CLIENT_ID / CLIENT_SECRET 발급 + Secret 업데이트
- [ ] HTTPS 활성화 (Let's Encrypt)
- [ ] 모바일 Base URL을 도메인 기반으로 전환 (현재 5개 파일에 EIP 하드코딩)
- [ ] nginx.conf 443 블록 복원

---

## MVP 이후 (정리/안정성)

**서버**
- [ ] Apple SignIn 서명 검증 (현재 idToken 디코딩만)
- [ ] 테스트 코드 확충 (현재 contextLoads + 기존 Controller 통합테스트)
- [ ] Rate limiting
- [ ] Swagger/OpenAPI 자동 생성

**모바일**
- [ ] iOS OAuth SDK 통합 (카카오/네이버/구글 CocoaPods 또는 SPM) — 현재 Apple만
- [ ] OAuth 키를 local.properties 로 완전 분리 (MainActivity 하드코딩 남아있음)
- [ ] iOS Base URL 분리 (현재 Android 에뮬레이터 전용 `10.0.2.2` OR EIP)
- [ ] 토큰 만료 감지 → 자동 로그아웃
- [ ] Pull-to-refresh (홈/지도/내 나눠사기)
- [ ] 페이지네이션 무한 스크롤

**인프라**
- [ ] 모니터링 (Prometheus + Grafana 또는 CloudWatch)
- [ ] 로그 집계 (Loki 또는 CloudWatch Logs)
- [ ] PostgreSQL 자동 백업
- [ ] EC2 인스턴스 ID 태그 기반 조회로 deploy.yml 하드코딩 제거

---

## Phase 2 — 신뢰와 편의성

- [ ] 푸시 알림 (서버 FCM/APNs + 모바일 수신)
- [ ] 인앱 채팅
- [ ] PG 에스크로 연동 (안전거래)
- [ ] 거래 완료 인증
- [ ] 신고/차단
- [ ] 상품 카테고리 & 검색

## Phase 3 — 성장

- [ ] 단골 매장 & 정기 나눠사기
- [ ] 커뮤니티
- [ ] 통계/분석
