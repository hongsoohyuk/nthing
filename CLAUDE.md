# One Bite (한입) - 벌크 상품 나눠사기 플랫폼

## 프로젝트 개요

"아 이거 한입만 먹고싶다" - 벌크/묶음 상품을 근처 사람과 나눠 구매하는 위치 기반 소셜 커머스 앱.

### 핵심 시나리오
1. 유저 A가 매장에서 두쫀쿠 4개입(2만원)을 발견 → 2개만 원함
2. 앱에서 상품 등록 (위치, 상품명, 사진, 가격, 나눌 수량)
3. 근처 유저 B에게 푸시 알림: "~~님이 ~m 근처에서 두쫀쿠 4개를 반씩 나눠갖길 원해요"
4. 유저 B가 수락 → 만나서 상품과 금액 교환

---

## 작업 영역 (Teammate 병렬 작업 가능)

### 영역 1: 백엔드 서버 (`server/`)
- 기술: Kotlin + Spring Boot 3.5 + H2(개발)/PostgreSQL(운영)
- 담당: REST API, 인증(JWT + 카카오 OAuth), DB
- API 명세: `docs/api-spec.md` 참고
- 현재 상태: Split CRUD API 완성, 카카오 인증 구조 완성 (빌드 OK)

### 영역 2: 모바일 클라이언트 (`mobile/` - 미생성)
- 기술: KMP + Compose Multiplatform
- 담당: UI, 네이티브 연동 (카메라, 위치, 푸시)
- API 연동: `docs/api-spec.md` 기준으로 서버와 독립 개발 가능
- 선행 조건: API 명세 확정

### 영역 3: 인프라 (`infra/` - 미생성)
- 기술: Docker, CI/CD, AWS/GCP
- 담당: 배포, 모니터링

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 | KMP + Compose Multiplatform | iOS + Android 동시 |
| 서버 | Kotlin + Spring Boot 3.5 | |
| DB (개발) | H2 in-memory | |
| DB (운영) | PostgreSQL + PostGIS | 위치 기반 쿼리 |
| 인증 | 카카오 OAuth + JWT | |
| 푸시 | FCM + APNs | |
| 이미지 저장 | S3/Cloud Storage | |

---

## 프로젝트 구조

```
one-bite/
├── CLAUDE.md                 # 이 문서 (프로젝트 전체 컨텍스트)
├── docs/
│   ├── api-spec.md           # API 명세 (서버-클라이언트 계약)
│   └── kotlin-learning-roadmap.md
├── server/                   # Spring Boot 백엔드
│   └── src/main/kotlin/com/onebite/server/
│       ├── OneBiteServerApplication.kt
│       ├── auth/             # 인증 (JWT, 카카오, Security)
│       │   ├── AuthController.kt
│       │   ├── AuthService.kt
│       │   ├── JwtProvider.kt
│       │   ├── JwtFilter.kt
│       │   ├── KakaoClient.kt
│       │   └── SecurityConfig.kt
│       ├── split/            # 나눠사기 핵심 도메인
│       │   ├── SplitController.kt
│       │   ├── SplitService.kt
│       │   ├── SplitRepository.kt
│       │   ├── SplitRequest.kt   # Entity
│       │   └── SplitDto.kt
│       └── user/             # 유저
│           ├── User.kt           # Entity
│           ├── UserRepository.kt
│           ├── UserController.kt
│           ├── UserService.kt
│           └── UserDto.kt
├── mobile/                   # KMP (미생성)
├── learn/                    # Kotlin 학습 자료
└── infra/                    # 인프라 (미생성)
```

---

## 서버 실행 방법

```bash
cd server
./gradlew bootRun
# http://localhost:8080
# H2 콘솔: http://localhost:8080/h2-console (JDBC URL: jdbc:h2:mem:onebite)
```

---

## 핵심 기능 분류

### MVP (Phase 1) - 핵심 루프 검증 — ✅ 기능 구현 완료 (2026-04-24)

**서버**
- [x] 상품(Split) CRUD API
- [x] 카카오/네이버/구글/애플 소셜 로그인 + JWT
- [x] 유저 프로필 API (GET/PATCH /users/me)
- [x] 위치 기반 조회 (Haversine / PostGIS 전략 패턴)
- [x] 나눠사기 참여(join) + 자동 매칭 + 취소(cancel)
- [x] 내 나눠사기 / 참여한 나눠사기 (GET /splits/my, /splits/participated)
- [x] S3 presigned 이미지 업로드 (POST /uploads/sign)

**모바일**
- [x] 로그인 / 홈 / 지도 / 프로필 / 등록 / 상세 / 내/참여 나눠사기 (Android + iOS 컴파일 통과)
- [x] GPS 위치 캡처, Kakao Map 연동, 카메라/갤러리, S3 직접 PUT 업로드
- [x] 소셜 로그인 (Android 3종 + iOS 애플), Keychain/EncryptedSharedPrefs 토큰 저장

**인프라**
- [x] AWS Terraform (EC2 + EIP + S3 + IAM)
- [x] GitHub Actions 자동 배포 (GHCR + SSM + 자동 bootstrap)

**남은 것** (코드 아닌 운영/테스트)
- [ ] 실기기 E2E 스모크
- [ ] 도메인 확보 → HTTPS / OAuth 실값 / 모바일 BASE_URL 교체 (`infra/CLAUDE.md` 체크리스트)
- [ ] 푸시 알림 → Phase 2 로 이동

### Phase 2 - 신뢰와 편의성
- [ ] 인앱 채팅
- [ ] PG 에스크로 연동 (안전거래)
- [ ] 거래 완료 인증
- [ ] 신고/차단
- [ ] 상품 카테고리 & 검색

### Phase 3 - 성장
- [ ] 단골 매장 & 정기 나눠사기
- [ ] 커뮤니티
- [ ] 통계/분석

---

## 비즈니스/법률 검토 사항

### 반드시 검토해야 할 것들
1. **전자금융거래법** ⚠️ — 예치금/페이 기능은 전자금융업 등록 필요 (자본금 20억). MVP에서 제외.
2. **통신판매중개업 신고** — 개인 간 거래 중개이므로 필수. 관할 지자체에 신고.
3. **위치기반서비스사업자 신고** — 방송통신위원회 신고 필수.
4. **식품 소분 규제** — 미개봉 상품만 취급하도록 앱 정책 수립.
5. **개인정보보호법** — 개인정보처리방침 수립, 최소 수집 원칙.

### 수익 모델
- Phase 1: 없음 (유저 확보)
- Phase 2: 안전거래 수수료
- Phase 3: 프리미엄 구독, 매장 광고

---

## 기술적 의사결정 로그

| 날짜 | 결정 | 이유 | 대안 |
|------|------|------|------|
| 2026-02-21 | KMP + Compose Multiplatform | 1인 개발, 언어 통일, 네이티브 API 접근 | Flutter, RN |
| 2026-02-21 | Spring Boot (Kotlin) | 언어 통일, 검증된 프레임워크 | Node.js, Firebase |
| 2026-02-21 | MVP에서 예치금 제외 | 전자금융업 등록 요건(20억) | PG 에스크로 연동 |
| 2026-02-21 | 소셜 로그인 우선 | 가입 허들 최소화 | 이메일/비밀번호 |
| 2026-04-24 | 이미지 저장: S3 + presigned URL (당근마켓식) | EC2 재기동 시 로컬 파일 소실 리스크, t4g.small 대역폭 절약, 프로덕션 표준 | 로컬 파일 (MVP 후 마이그레이션 부담 큼), S3+서버 프록시 (대역폭 낭비) |

---

## 컨벤션 & 규칙
- 커밋 메시지: Conventional Commits (feat:, fix:, docs:, chore:)
- 브랜치 전략: main → develop → feature/xxx
- 코드 리뷰: Claude가 기술 리뷰 역할 수행
- 문서: 주요 결정은 이 파일의 "기술적 의사결정 로그"에 기록
- 서버 패키지 구조: 도메인별 분리 (auth/, split/, user/)
- API 명세 우선: `docs/api-spec.md`를 먼저 합의 → 서버/클라이언트 독립 개발
