# Nthing (엔띵) - N분의 1로 나눠사는 위치 기반 소셜 커머스

## 프로젝트 개요

"반띵하자" - 벌크/묶음 상품을 근처 사람과 N분의 1로 나눠 구매하는 위치 기반 소셜 커머스 앱.

**브랜드명**: Nthing (영문) / 엔띵 (한글) — `N + thing` (N분의 1로 나눈 것). 한국어 "반띵하자"와 일맥상통.

> 기존 이름 "한입 (One Bite)"는 음식에 한정되는 느낌이 있어 2026-05-18 리브랜딩. 비음식 벌크 상품(휴지·세제·원두 등)에도 자연스러운 "Nthing/반띵" 컨셉으로 변경.

### 핵심 시나리오
1. 유저 A가 매장에서 두쫀쿠 4개입(2만원)을 발견 → 2개만 원함
2. 앱에서 상품 등록 (위치, 상품명, 사진, 가격, 나눌 수량)
3. 근처 유저 B에게 푸시 알림: "~~님이 ~m 근처에서 두쫀쿠 4개를 반띵하길 원해요"
4. 유저 B가 수락 → 만나서 상품과 금액 교환

---

## 작업 영역 (Teammate 병렬 작업 가능)

### 영역 1: 백엔드 서버 (`server/`)
- 기술: Kotlin + Spring Boot 3.5 + H2(개발)/PostgreSQL(운영)
- 담당: REST API, 인증(JWT + 소셜 OAuth 4종), DB
- API 명세: `docs/api-spec.md` 참고
- 현재 상태: Split CRUD API 완성, OAuth 4종 구조 완성 (빌드 OK)
- 서버 패키지 `com.onebite.server`는 그대로 유지 (외부 노출 X, 동작 안정성 우선)

### 영역 2: 모바일 클라이언트 (`mobile/`) — 마이그레이션 진행 중
- 기술: **Vite + React + Capacitor 8** (마이그레이션 결정 2026-05-18, scaffold 시 Capacitor 8.x 채택)
- App id: `co.nthing.app`
- 담당: UI, 네이티브 연동 (Capacitor Plugin: Camera/Geolocation/Preferences/Browser/Push)
- API 연동: `docs/api-spec.md` 기준으로 서버와 독립 개발
- 마이그레이션 spec: `docs/superpowers/specs/2026-05-18-client-rewrite-design.md`
- 기존 KMP 코드는 `mobile-kmp/`로 아카이브 (참고용, 마이그레이션 완료 후 삭제)

### 영역 3: 인프라 (`infra/`)
- 기술: Docker, Terraform (AWS), GitHub Actions
- 담당: 배포, 모니터링

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 모바일 | **Vite + React + Capacitor 8** | iOS + Android + Web (PWA) |
| 모바일 UI | Tailwind CSS + Pretendard | 디자인 토큰 `tailwind.config.ts` |
| 모바일 상태 | Zustand + TanStack Query | |
| 서버 | Kotlin + Spring Boot 3.5 | |
| DB (개발) | H2 in-memory | |
| DB (운영) | PostgreSQL + PostGIS | 위치 기반 쿼리 |
| 인증 | 소셜 OAuth (카카오/네이버/구글/애플) + JWT | 모바일은 웹 redirect (Capacitor Browser) |
| 푸시 | FCM + APNs (Phase 2) | Capacitor Push Notifications |
| 이미지 저장 | S3 + presigned URL | |
| 패키지 매니저 (클라) | pnpm | |

---

## 프로젝트 구조

```
one-bite/                        # 디렉토리·repo 이름은 그대로 (git history 보존)
├── CLAUDE.md                    # 이 문서 (프로젝트 전체 컨텍스트)
├── docs/
│   ├── api-spec.md              # API 명세 (서버-클라이언트 계약)
│   ├── design/
│   │   ├── claude-design-brief.md
│   │   └── mockups/
│   ├── superpowers/
│   │   ├── specs/
│   │   │   └── 2026-05-18-client-rewrite-design.md   # 마이그레이션 spec
│   │   └── plans/
│   └── kotlin-learning-roadmap.md
├── server/                      # Spring Boot 백엔드 (com.onebite.server 패키지 유지)
│   └── src/main/kotlin/com/onebite/server/
│       ├── NthingServerApplication.kt   # 후속 리네임 가능 (지금은 OneBiteServerApplication)
│       ├── auth/                # JWT + 소셜 OAuth + Security
│       ├── split/               # 나눠사기 핵심 도메인
│       └── user/                # 유저
├── mobile/                      # 새 Vite + React + Capacitor 클라이언트 (마이그레이션 진행)
│   ├── android/                 # Capacitor Android 셸
│   ├── ios/                     # Capacitor iOS 셸
│   ├── src/
│   │   ├── routes/              # 페이지 컴포넌트
│   │   ├── features/            # 도메인별 (auth/splits/map/upload/profile)
│   │   └── shared/              # api, components, hooks, stores, lib
│   ├── tailwind.config.ts
│   ├── capacitor.config.ts
│   └── vite.config.ts
├── mobile-kmp/                  # 기존 KMP 아카이브 (참고용, 후속 삭제 예정)
├── learn/                       # Kotlin 학습 자료
└── infra/                       # Terraform + AWS
```

---

## 서버 실행 방법

```bash
cd server
./gradlew bootRun
# http://localhost:8080
# H2 콘솔: http://localhost:8080/h2-console (JDBC URL: jdbc:h2:mem:onebite)
```

## 모바일 실행 방법 (마이그레이션 후)

```bash
cd mobile
pnpm install
pnpm dev                          # 브라우저 (개발 빠른 반복)
npx cap sync && npx cap open ios  # iOS Xcode
npx cap sync && npx cap open android  # Android Studio
```

---

## 핵심 기능 분류

### MVP (Phase 1) - 핵심 루프 검증 — ✅ 서버/KMP 기능 완성 (2026-04-24) / 🚧 React 마이그레이션 진행 중 (2026-05-18~)

**서버** (변경 없음)
- [x] 상품(Split) CRUD API
- [x] 카카오/네이버/구글/애플 소셜 로그인 + JWT
- [x] 유저 프로필 API (GET/PATCH /users/me)
- [x] 위치 기반 조회 (Haversine / PostGIS 전략 패턴)
- [x] 나눠사기 참여(join) + 자동 매칭 + 취소(cancel)
- [x] 내 나눠사기 / 참여한 나눠사기 (GET /splits/my, /splits/participated)
- [x] S3 presigned 이미지 업로드 (POST /uploads/sign)

**모바일 (KMP — 아카이브)**
- [x] 7화면 + OAuth 3+1종 + 카카오맵 + S3 업로드 + GPS — `mobile-kmp/`에 보존

**모바일 (Vite + React + Capacitor — 마이그레이션 Phase 1)**
- [x] Vite 프로젝트 scaffold + Capacitor 셸 (Phase 1.1)
- [x] Tailwind + 디자인 토큰 + Pretendard (1.1) + 디자인 시스템 컴포넌트 8종 (Phase 1.2)
- [x] API 클라이언트(auth/me + splits/uploads) + authStore + locationStore + TanStack Query 훅 (Phase 1.3 + 1.4)
- [x] 7화면 이식: Login(1.3) + MainLayout 셸(AppBar+BottomNav+FAB) + Home/Map/Profile/Create/Detail/List (Phase 1.4) — Map은 placeholder(1.5)
- [~] OAuth: kakao/naver/google 서버 릴레이(nthing://) 배선 + dev-login (Phase 1.3) — Apple·실키 라운드트립 후속
- [x] 카카오맵 JS SDK (Phase 1.5) — 지도/핀/슬라이드업, 키 없으면 placeholder
- [x] Capacitor Plugins: Preferences/Browser/App (1.3) + Camera/Geolocation (1.5)
- [x] iOS/Android 디버그 빌드 검증 (2026-05-29) — Android `assembleDebug` APK + iOS `App.app`(iPhone 17 sim) 둘 다 통과. 빌드 환경 요구: Android는 JDK 21(Capacitor 8 플러그인 toolchain), iOS는 Xcode `-downloadPlatform iOS`로 iOS 시뮬 런타임 설치 필요
- [ ] iOS/Android 실기기 스모크 (코드 서명 + 실기기)

**인프라**
- [x] AWS Terraform (EC2 + EIP + S3 + IAM)
- [x] GitHub Actions 자동 배포 (GHCR + SSM + 자동 bootstrap)
- [x] 도메인 확보 + HTTPS (2026-06-02) — `nthing.app` 확보. 서버 `api.nthing.app`(EC2 nginx + Let's Encrypt), 랜딩 `nthing.app`(Vercel). repo 리네임(one-bite→nthing) 잔재(OIDC trust/GHCR/clone) 정렬 완료

**남은 것** (코드 아닌 운영/테스트)
- [x] OAuth 실값 교체 (2026-06-02) — **웹 리다이렉트 3종(Google/Kakao/Naver)** 서버(`infra/.env`→`ONEBITE_ENV_B64`→배포) + 모바일(`.env.local` VITE_*) + provider 콘솔 redirect `https://api.nthing.app/api/auth/callback/{provider}` 등록 완료. Apple 만 미배선(Apple Developer 계정 대기)
- [x] 모바일 BASE_URL dev/prod 분리 (2026-06-02) — `.env.development`=`/api`(Vite proxy), `.env.production`=`https://api.nthing.app/api`(앱 빌드, OAuth redirect_uri 기반)
- [ ] 실기기 E2E 스모크 — iPhone 17 보유. 무료 Apple ID(Xcode personal team, 7일 서명)로 **코어 앱 + Google/Kakao/Naver 로그인 + API**는 지금 테스트 가능. Apple 로그인·푸시·(iOS 카카오맵 도메인)은 유료 Apple Developer 계정 후
- [ ] 푸시 알림 → Phase 2 로 이동

### Phase 2 - 신뢰와 편의성
- [~] 푸시 알림 (Capacitor `@capacitor-firebase/messaging` + 서버 FCM 단일 채널) — 코드 완성. Firebase 프로젝트(`n-thing`) 생성 + config 배치 완료(2026-06-02): Android `google-services.json`, iOS `GoogleService-Info.plist`(Xcode 타겟 등록), 서버 service account(`server/secrets/`, gitignored). 남은 것: 서버 prod에 service account 마운트(`FIREBASE_CREDENTIALS_PATH`) + iOS APNs 키(Apple Developer 계정 후)
- [~] 위치 기반 트리거 알림 ("근처 N미터 내 새 반띵") — 코드 완성 (DeviceLocationQuery 전략 패턴)
- [ ] 인앱 채팅
- [ ] PG 에스크로 연동 (안전거래)
- [ ] 거래 완료 인증
- [ ] 신고/차단
- [ ] 상품 카테고리 & 검색

### Phase 3 - 성장
- [ ] 백그라운드 위치 추적 (지나가다가 알림)
- [ ] 단골 매장 & 정기 반띵
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
| 2026-05-18 | 브랜드 리브랜딩 한입 → Nthing/엔띵 | "반띵하자" 컨셉이 비음식 벌크 상품(휴지/세제/원두 등)까지 자연스럽게 포괄, 글로벌 확장 친화 | 한입 유지 |
| 2026-05-18 | 디자인 컬러 한입 오렌지(#FF6B35) → 딥 그린(#16A34A) | 당근마켓과 동일 톤 회피, 신선/안전 어소시에이션 | 테라코타, 인디고 |
| 2026-05-18 | 클라이언트 마이그레이션 KMP → Vite + React + Capacitor | KMP 학습/유지보수 부담, 디자인 mockup이 HTML 기반이라 React 이식 유리, iOS PWA 푸시 한계 → Capacitor 셸 필요 | KMP 유지, RN, Flutter, 수동 WebView Bridge |
| 2026-05-29 | Phase 2 푸시: FCM 단일 채널 + device 테이블(토큰+위치) + 이벤트 AFTER_COMMIT 디커플링 | 1인 개발 서버 단순화(APNs 직접 회피), 정밀 근접 타겟팅, split 도메인 비침투 | 네이티브 APNs+FCM 분리, 지오해시 토픽, 아웃박스 |
| 2026-06-02 | 랜딩 페이지(`web/`, Next.js) Vercel 배포 + `nthing.app` 도메인 연결 (apex A→Vercel, www→apex 308, GitHub `main` 자동배포, rootDirectory=`web`) | 정적 랜딩은 EC2 부하 없이 Vercel 무료 호스팅·자동 SSL·CDN로 충분, 앱 API(`api.nthing.app`)는 EC2 유지로 분리 | EC2/nginx에 직접 서빙(SSL·배포 수동 부담), S3+CloudFront(설정 과다) |

---

## 컨벤션 & 규칙
- 커밋 메시지: Conventional Commits (feat:, fix:, docs:, chore:)
- 브랜치 전략: main → develop → feature/xxx
- 코드 리뷰: Claude가 기술 리뷰 역할 수행
- 문서: 주요 결정은 이 파일의 "기술적 의사결정 로그"에 기록
- 서버 패키지 구조: 도메인별 분리 (auth/, split/, user/)
- 모바일 패키지 id: `co.nthing.app`
- 모바일 클라이언트 구조: features/ (도메인별) + shared/ (공용)
- API 명세 우선: `docs/api-spec.md`를 먼저 합의 → 서버/클라이언트 독립 개발

---

## 카피톤 (UI 텍스트 컨벤션)

브랜드 리브랜딩 이후 표준화된 카피.

| 영역 | 카피 |
|------|------|
| 워드마크 (영문) | **Nthing** |
| 워드마크 (한글) | **엔띵** |
| 슬로건 | "반띵하자" |
| 서브카피 (Login) | "근처에서 N분의 1, 같이 사요" |
| 메인 액션 (CTA, 참여) | "반띵할게요" |
| 등록 액션 | "반띵 등록하기" / "내 반띵 올리기" |
| 화면 타이틀 (홈) | "근처 반띵" |
| 게시물 단위 명사 | "반띵" 또는 "나눠사기" (둘 다 사용 가능, UI 컨텍스트에 맞게) |
| Empty 상태 | "아직 반띵이 없어요" / "첫 반띵을 올려보세요" |
| 마감 상태 | "마감된 반띵" |
| 프로필 헤더 | "나의 반띵" |

3명 이상 N분의 1도 "반띵" 동사로 통일 (서브텍스트로 "N명이서 나누기" 정보 보조).
