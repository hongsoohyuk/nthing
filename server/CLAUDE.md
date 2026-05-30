# Server - Spring Boot 백엔드

## 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| 언어 | Kotlin 1.9.25 | |
| 프레임워크 | Spring Boot 3.5.0 | |
| DB (개발) | H2 in-memory | `jdbc:h2:mem:onebite` |
| DB (운영) | PostgreSQL 16 + PostGIS 3.4 | 위치 기반 쿼리 |
| 인증 | JWT (JJWT 0.12.6) + 소셜 OAuth | |
| Java | JDK 17 | |

## 실행 방법

```bash
# 개발 (H2)
./gradlew bootRun
# http://localhost:8080
# H2 콘솔: http://localhost:8080/h2-console (JDBC URL: jdbc:h2:mem:onebite)

# Docker (PostgreSQL)
cd .. && make dev
```

## 프로젝트 구조

```
src/main/kotlin/com/onebite/server/
├── OneBiteServerApplication.kt
├── auth/                    # 인증 도메인
│   ├── AuthController.kt   # POST /api/auth/{kakao,naver,google,apple}
│   ├── AuthService.kt      # OAuth 플로우 오케스트레이션
│   ├── JwtProvider.kt      # JWT 생성/검증 (HMAC-SHA256)
│   ├── JwtFilter.kt        # Bearer 토큰 추출 → SecurityContext
│   ├── SecurityConfig.kt   # /api/auth/** 퍼블릭, 나머지 인증 필요
│   ├── KakaoClient.kt      # 카카오 token+userInfo
│   ├── NaverClient.kt      # 네이버 token+userInfo
│   ├── GoogleClient.kt     # 구글 token+userInfo
│   ├── AppleClient.kt      # 애플 idToken 디코딩
│   └── SocialUserInfo.kt   # 통합 DTO (id, nickname, profileImageUrl)
├── split/                   # 나눠사기 도메인
│   ├── SplitController.kt  # CRUD + join + cancel + nearby + my + participated
│   ├── SplitService.kt     # 비즈니스 로직
│   ├── SplitDto.kt         # CreateSplitDto, SplitResponse, AuthorDto, ParticipantDto
│   ├── SplitRequest.kt     # Entity (상품 정보 + 위치 + 상태)
│   ├── SplitParticipant.kt # Entity (참여자)
│   ├── SplitRepository.kt  # findNearby, findByStatus, findByAuthorId, findByParticipantUserId
│   └── SplitParticipantRepository.kt
├── upload/                  # 이미지 업로드 도메인 (S3 presigned URL)
│   ├── S3Config.kt         # S3Presigner 빈 (region=aws.region, default credential chain)
│   ├── UploadController.kt # POST /api/uploads/sign
│   ├── UploadService.kt    # presign PUT URL 생성 + 크기/타입 검증
│   └── UploadDto.kt        # PresignRequest, PresignResponse
├── user/                    # 유저 도메인
│   ├── User.kt              # Entity (provider, providerId, nickname, profileImageUrl)
│   ├── UserRepository.kt    # findByProviderAndProviderId
│   ├── UserController.kt    # GET/PATCH /api/users/me
│   ├── UserService.kt       # 프로필 조회/수정
│   └── UserDto.kt           # UserResponse, UpdateUserDto
└── notification/            # 푸시 알림 도메인 (FCM)
    ├── Device.kt / DeviceRepository.kt
    ├── DeviceLocationQuery.kt  # 전략 패턴 (H2 Haversine / PostGIS)
    ├── Notification.kt / NotificationRepository.kt
    ├── DeviceController.kt     # POST /api/devices, /api/devices/unregister
    ├── DeviceDto.kt            # RegisterDeviceRequest, UnregisterDeviceRequest, DeviceResponse
    ├── DeviceService.kt        # 토큰 upsert + 삭제
    ├── FcmSender.kt / FcmConfig.kt / AsyncConfig.kt
    ├── NotificationService.kt  # 수신자 결정 + FCM 전송 + 로그 + 토큰 정리
    └── NotificationEventListener.kt  # split 이벤트 → 푸시 (AFTER_COMMIT + @Async)
```

## API 엔드포인트

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | /api/auth/kakao | X | 카카오 로그인 (code) |
| POST | /api/auth/naver | X | 네이버 로그인 (code + state) |
| POST | /api/auth/google | X | 구글 로그인 (code) |
| POST | /api/auth/apple | X | 애플 로그인 (idToken) |
| GET | /api/splits | X | 목록 (status, lat/lng/radiusKm 필터) — 비인증 둘러보기 허용 |
| GET | /api/splits/{id} | X | 단건 조회 — 비인증 둘러보기 허용 |
| POST | /api/splits | O | 등록 |
| GET | /api/splits/my | O | 내가 등록한 나눠사기 (페이지네이션) |
| GET | /api/splits/participated | O | 내가 참여한 나눠사기 (페이지네이션) |
| POST | /api/splits/{id}/join | O | 참여 |
| PATCH | /api/splits/{id}/cancel | O | 취소 (작성자만, WAITING만) |
| POST | /api/uploads/sign | O | S3 presigned PUT URL 발급 (contentType, size) |
| POST | /api/devices | O | 디바이스 토큰/위치 등록·갱신 (upsert) |
| POST | /api/devices/unregister | O | 디바이스 토큰 삭제 (로그아웃) |
| GET | /api/users/me | O | 내 프로필 |
| PATCH | /api/users/me | O | 프로필 수정 (nickname) |

SecurityConfig 매칭 순서 주의: `/splits/my`와 `/splits/participated`는 `/splits/{id}` 보다 **먼저** 인증 요구로 명시되어야 Spring이 path variable로 흡수하지 않음.

## 핵심 비즈니스 로직

- **참여(join)**: WAITING 상태만 가능, 본인 글 불가, 중복 참여 불가, 참여자 충족 시 → MATCHED 자동 전환
- **취소(cancel)**: 작성자만, WAITING 상태만 → CANCELLED
- **위치 조회(nearby)**: Haversine 공식으로 거리 계산, 기본 반경 3km, 거리순 정렬

## 설정 프로필

- **기본 (H2)**: `application.properties` — Flyway + DDL validate, SQL 로깅 ON
- **운영 (PostgreSQL)**: `application-prod.properties` — Flyway (공통+prod 마이그레이션), 환경변수로 설정 주입

## 구현 상태

### 완료 (MVP)
- [x] Split CRUD API (등록/조회/취소)
- [x] 참여(join) API + 자동 매칭
- [x] 위치 기반 조회 (H2: Haversine, PostgreSQL: PostGIS ST_DWithin)
- [x] 카카오/네이버/구글/애플 OAuth
- [x] JWT 인증 (생성/검증/필터)
- [x] 유저 프로필 API (GET/PATCH)
- [x] Docker 멀티스테이지 빌드
- [x] PostgreSQL + PostGIS 운영 설정
- [x] Flyway DB 마이그레이션 (V1: 초기 스키마, V2: PostGIS geography)
- [x] 페이지네이션 (PageResponse, page/size)
- [x] PostGIS 네이티브 쿼리 (프로필 기반 전략 — SplitLocationQuery)
- [x] GET /api/splits 비인증 허용 (둘러보기)
- [x] **S3 presigned URL 업로드 (POST /api/uploads/sign)** — AWS SDK v2, 5MB 제한, jpg/png/webp 화이트리스트
- [x] **GET /api/splits/my** (내가 등록) — 기존 존재했고 이번에 문서 추가
- [x] **GET /api/splits/participated** (내가 참여) — JPQL join on SplitParticipant
- [x] EC2 + PostgreSQL 배포 (infra 쪽 자동화 완료)

### TODO

**다음 (안정성)**
- [ ] Apple SignIn 서명 검증 (현재 idToken 디코딩만, Apple 공개키 검증 누락)
- [ ] 테스트 코드 확충 (현재 SplitControllerIntegrationTest, UserControllerIntegrationTest 정도)
- [ ] OAuth redirect relay — iOS 웹 OAuth용 엔드포인트 (`GET /api/auth/callback/{provider}` → 커스텀 스킴 리다이렉트)
- [ ] Rate limiting
- [ ] Swagger/OpenAPI 문서 자동 생성

**Phase 2**
- [x] 푸시 알림 서버 (FCM + APNs) — notification 도메인: Device(token upsert/unregister), DeviceLocationQuery, NotificationService(4종 알림), AFTER_COMMIT+@Async 이벤트 리스너 (모바일 연동 진행 중)
- [ ] 인앱 채팅
- [ ] PG 에스크로 연동

## S3 업로드 주의사항

- `UploadService`는 `S3Presigner`를 주입받는다. **presigned URL 서명에도 실제 AWS 크레덴셜이 필요** — 로컬에서 `/api/uploads/sign` 호출하려면 `aws configure` 프로필 세팅 필수. EC2에서는 instance role이 자동 해결.
- `aws.s3.public-url-base` 가 비어있으면 `https://{bucket}.s3.{region}.amazonaws.com/{key}` 로 조립. CloudFront 도입 시 이 변수에 CDN base URL 지정.
- `uploads/sign` 응답의 `publicUrl`은 **업로드 완료 후에만 유효**. 클라이언트가 PUT 성공 응답 받은 뒤 `POST /splits`의 `imageUrl`로 사용.
- 버킷은 `splits/*` prefix만 public read. 다른 prefix(향후 프로필 이미지 등)는 별도 정책 필요.
