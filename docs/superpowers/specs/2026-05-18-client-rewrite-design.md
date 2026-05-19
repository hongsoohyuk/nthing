# Nthing 클라이언트 마이그레이션: KMP → Vite + React + Capacitor

작성일: 2026-05-18

> **참고**: 이 spec 작성 직후 브랜드명이 "한입(One Bite)" → **Nthing(엔띵)**으로 리브랜딩됨. spec 본문은 새 이름 기준으로 작성.

## 1. Context

Nthing(엔띵) 모바일 클라이언트(`mobile/`)는 이전에 KMP + Compose Multiplatform으로 구현되어 MVP가 거의 완성 상태(Android/iOS 컴파일 통과, 7 화면, OAuth 4종, 카카오맵, S3 업로드 등).

그러나 다음 이유로 클라이언트를 **Vite + React + Capacitor**로 전면 교체한다. 서버(`server/`, Spring Boot)와 인프라(`infra/`)는 그대로 유지.

### Why

1. **사용자 학습/유지보수 부담** — KMP/Compose Multiplatform과 Kotlin/Swift 네이티브 SDK 작업이 사용자의 본업/장기 가치와 정렬되지 않음 (React/웹 친숙).
2. **디자인 자산 활용 효율** — Claude Design으로 생성한 mockup이 HTML/CSS 기반(`docs/design/claude-design-brief.md`). React 1:1 이식이 Compose보다 훨씬 매끄러움.
3. **푸시 알림** — Nthing 핵심 가치인 "근처 N미터 내 새 반띵 알림"이 iOS PWA로는 사실상 불가(16.4+ + 홈 화면 추가 한정). Capacitor 셸로 APNs 직접 수신 필요.

## 2. Stack

### 클라이언트 (확정)

| 항목 | 선택 | 비고 |
|------|------|------|
| 빌드 도구 | Vite 5+ | 정적 SPA, Capacitor 친화 |
| UI | React 18 | hooks 위주 |
| 라우터 | React Router 6 | 파일 기반 X, 명시적 라우트 트리 |
| 언어 | TypeScript (strict) | |
| 스타일 | Tailwind CSS 3.4+ | 디자인 토큰을 `tailwind.config.ts`에 매핑 |
| 전역 상태 | Zustand | 인증 토큰, 위치, 알림 등 |
| 서버 데이터 | TanStack Query (React Query) v5 | Splits CRUD, mutation, 캐싱 |
| HTTP | fetch + 인터셉터(토큰 자동 주입) | 별도 axios 없음 |
| 테스트 | Vitest + React Testing Library | |
| 린트/포맷 | ESLint + Prettier | |
| 패키지 매니저 | pnpm | |
| 모바일 셸 | Capacitor 6 | iOS/Android 셸 생성 + Plugin |

### Capacitor Plugins

| 플러그인 | 용도 |
|---------|------|
| `@capacitor/camera` | 사진 촬영 + 갤러리 (JPEG 0.85 압축) |
| `@capacitor/geolocation` | GPS 위치 캡처 (포그라운드만 — MVP) |
| `@capacitor/preferences` | 토큰 저장 (iOS Keychain / Android EncryptedSharedPrefs) |
| `@capacitor/browser` | OAuth redirect (InAppBrowser 패턴) |
| `@capacitor/app` | Deep link / 앱 lifecycle |
| `@capacitor/push-notifications` | FCM + APNs (Phase 2) |
| `@capacitor/network` | 네트워크 상태 감지 |

### 서버/인프라 (변경 없음)

- Kotlin + Spring Boot 3.5
- H2(개발) / PostgreSQL+PostGIS(운영)
- AWS EC2 + S3 + IAM (Terraform)
- API 명세: `docs/api-spec.md` 그대로 호환

## 3. Architecture

### 디렉토리 구조

```
one-bite/
├── mobile/                       # 새 Vite + React + Capacitor 클라이언트
│   ├── android/                  # `npx cap add android` 결과 (Studio 프로젝트)
│   ├── ios/                      # `npx cap add ios` 결과 (Xcode 프로젝트)
│   ├── public/                   # 정적 자산 (favicon 등)
│   ├── src/
│   │   ├── main.tsx              # 엔트리
│   │   ├── App.tsx               # 라우트 트리 + Provider 묶기
│   │   ├── routes/               # 페이지 컴포넌트 (Login, Home, Map, ...)
│   │   ├── features/             # 도메인별 로직 + 컴포넌트
│   │   │   ├── auth/             # OAuth flow + AuthStore
│   │   │   ├── splits/           # CRUD + 참여/취소 + queries
│   │   │   ├── map/              # KakaoMap 래퍼 + 핀
│   │   │   ├── upload/           # S3 presigned + Camera
│   │   │   └── profile/
│   │   ├── shared/
│   │   │   ├── api/              # OneBiteApi (fetch + 토큰 인터셉터)
│   │   │   ├── components/       # 디자인 시스템 (Button, Card, Badge, TextField, AppBar, BottomNav, FAB, SplitCard, ...)
│   │   │   ├── hooks/            # useGeolocation, useImagePicker 등
│   │   │   ├── stores/           # Zustand stores (authStore, locationStore, ...)
│   │   │   └── lib/              # utils (formatPrice, distance 등)
│   │   ├── styles/
│   │   │   └── index.css         # Tailwind base + Pretendard import
│   │   └── env.d.ts
│   ├── capacitor.config.ts
│   ├── tailwind.config.ts        # 디자인 토큰 정의
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── mobile-kmp/                   # 기존 KMP 아카이브 (마이그레이션 완료 후 삭제)
├── server/                       # 그대로
├── infra/                        # 그대로
└── docs/
    ├── design/
    │   ├── claude-design-brief.md     # 디자인 브리프 (그대로)
    │   └── mockups/                   # Claude Design 출력 (참고용)
    └── superpowers/specs/
        └── 2026-05-18-client-rewrite-design.md   # 이 문서
```

### 라우트 트리

```
/                              → 자동 분기 (토큰 있으면 /home, 없으면 /login)
/login                         → LoginScreen
/auth/callback                 → OAuth 콜백 처리
/home                          → MainLayout > HomeTab    (BottomNav: 홈)
/map                           → MainLayout > MapTab     (BottomNav: 지도)
/profile                       → MainLayout > ProfileTab (BottomNav: 나)
/splits/new                    → CreateSplitScreen
/splits/:id                    → SplitDetailScreen
/me/splits                     → SplitListScreen (mine)
/me/splits/participated        → SplitListScreen (participated)
```

### Zustand Stores

```ts
// authStore
{
  token: string | null;
  user: { id: number; nickname: string; ... } | null;
  setToken(token: string): void;
  logout(): void;
  hydrate(): Promise<void>;   // Preferences에서 로드
}

// locationStore
{
  current: { lat: number; lng: number } | null;
  setCurrent(loc): void;
  request(): Promise<boolean>;
}
```

### TanStack Query 키 컨벤션

```ts
queryKey: ['splits', { lat, lng, radius }]    // 목록
queryKey: ['splits', splitId]                  // 상세
queryKey: ['splits', 'my']                     // 내 게시물
queryKey: ['splits', 'participated']           // 참여한
queryKey: ['me']                               // 프로필
```

### API 클라이언트

```ts
// shared/api/oneBiteApi.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;   // 환경별 분리

export const oneBiteApi = {
  async getSplits(params) { ... },
  async getSplit(id) { ... },
  async createSplit(req) { ... },
  async joinSplit(id) { ... },
  async cancelSplit(id) { ... },     // PATCH /splits/:id/cancel (기존 KMP 버그 수정 그대로)
  async signUpload(req) { ... },
  async uploadToS3(url, bytes, contentType) { ... },
  async getMe() { ... },
  async updateMe(req) { ... },
  async loginWithCode(provider, code) { ... },
};
```

기존 `mobile/composeApp/.../OneBiteApi.kt`의 메소드 시그니처를 TypeScript로 1:1 이식.

### OAuth Flow (모두 웹 redirect)

```
1. User taps "카카오로 시작하기"
2. Build OAuth URL: https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=nthing://auth/callback&response_type=code
3. Capacitor Browser.open({ url, presentationStyle: 'popover' })
4. Kakao auth in InAppBrowser → callback with code
5. App opens deep link `nthing://auth/callback?code=...`
6. React Router catches /auth/callback → extract code
7. POST /auth/login/{provider} { code } → JWT
8. authStore.setToken(jwt) + Preferences.set('token', jwt)
9. Navigate to /home
```

**Deep link 설정**:
- iOS: `URL Types` in Info.plist → `nthing`
- Android: `intent-filter` in AndroidManifest → scheme `nthing`
- Capacitor `App` plugin의 `appUrlOpen` 이벤트 리스너로 처리

### 디자인 시스템 (Tailwind 매핑)

`tailwind.config.ts`:

```ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16A34A',     // BrandGreen
          pressed: '#15803D',
          surface: '#DCFCE7',
          'surface-dark': '#14271A',
          'dark-adj': '#22C55E',
        },
        gray: {
          50:  '#FAFAFA', 100: '#F4F4F5', 200: '#E4E4E7',
          300: '#D4D4D8', 400: '#A1A1AA', 500: '#71717A',
          600: '#52525B', 700: '#3F3F46', 800: '#27272A',
          900: '#18181B', 950: '#09090B',
        },
        success: { DEFAULT: '#0EA5E9', dark: '#38BDF8' },   // sky, brand 그린과 분리
        warning: { DEFAULT: '#F59E0B', dark: '#FBBF24' },
        error:   { DEFAULT: '#DC2626', dark: '#EF4444' },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display:  ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h1:       ['22px', { lineHeight: '30px', fontWeight: '700' }],
        h2:       ['18px', { lineHeight: '26px', fontWeight: '600' }],
        body:     ['15px', { lineHeight: '22px', fontWeight: '400' }],
        bodyEmph: ['15px', { lineHeight: '22px', fontWeight: '600' }],
        caption:  ['13px', { lineHeight: '18px', fontWeight: '400' }],
        meta:     ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: {
        sm: '8px', md: '10px', lg: '12px', xl: '16px', pill: '999px',
      },
      // spacing은 기본 Tailwind 4px scale + 우리는 8px 그리드 우선 사용 (gap-2, gap-4, gap-6, gap-8, ...)
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        raised: '0 4px 12px rgba(0,0,0,0.08)',
        overlay: '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  darkMode: 'class',
};
```

Pretendard import: `src/styles/index.css` 상단에 `@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');`

### 컴포넌트 ↔ Mockup 매핑

| Claude Design Mockup | React 위치 |
|----------------------|------------|
| 5.1 LoginScreen | `routes/Login.tsx` |
| 5.2 HomeTab | `routes/Home.tsx` |
| 5.3 MapTab | `routes/Map.tsx` |
| 5.4a/b ProfileTab | `routes/Profile.tsx` (분기) |
| 5.5 CreateSplitScreen | `routes/CreateSplit.tsx` |
| 5.6 SplitDetailScreen | `routes/SplitDetail.tsx` |
| 5.7a/b SplitListScreen | `routes/SplitList.tsx` (variant + Empty) |
| Primary/Secondary Button | `shared/components/Button.tsx` |
| Card | `shared/components/Card.tsx` |
| Chip / StatusBadge | `shared/components/Badge.tsx` |
| TextField | `shared/components/TextField.tsx` |
| AppBar | `shared/components/AppBar.tsx` |
| BottomNav | `shared/components/BottomNav.tsx` |
| FAB | `shared/components/Fab.tsx` |
| SplitCard | `features/splits/SplitCard.tsx` |

### Mockup 검증 시 발견된 조정 사항

Claude Design mockup이 브리프와 거의 100% 일치했으나 2가지 조정 필요:

1. **마감임박 배지**가 모집중과 동일한 BrandGreen으로 처리됨 → React 이식 시 **warning amber** (`bg-warning/10` + `text-warning`) 또는 별도 추가 토큰으로 차별. 본 spec에선 `warning` 토큰(#F59E0B)으로 표현.
2. **네이버 OAuth 컬러** `#03C75A` 사용 (2023 리뉴얼) — 브리프의 `#03A94D`보다 최신. **`#03C75A`로 채택**, 브리프는 후속 업데이트.

## 4. Phase별 작업 범위

### Phase 1 — MVP 동등 기능

기존 KMP가 제공하던 모든 기능을 React로 재구현:

- [ ] Vite + React + TypeScript 프로젝트 scaffold
- [ ] Tailwind + 디자인 토큰 셋업 + Pretendard
- [ ] `shared/api/oneBiteApi.ts` (HTTP 클라이언트)
- [ ] Zustand stores (auth, location)
- [ ] React Router 트리
- [ ] 디자인 시스템 컴포넌트 (Button/Card/Badge/TextField/AppBar/BottomNav/FAB)
- [ ] 7 화면 이식 (Login/Home/Map/Profile/Create/Detail/List)
- [ ] OAuth 4종 (웹 redirect + deep link)
- [ ] 카카오맵 JS SDK 통합
- [ ] Capacitor 셸 셋업 (iOS + Android)
- [ ] Capacitor Plugins 통합 (Camera/Geolocation/Preferences/Browser/App)
- [ ] S3 presigned 업로드 (기존 플로우 그대로)
- [ ] iOS/Android 실기기 스모크
- [ ] 빌드 + 배포 (TestFlight / Play Internal)

### Phase 2 — 푸시 + 채팅 (CLAUDE.md 기준)

- [ ] `@capacitor/push-notifications` 통합
- [ ] 서버에 FCM/APNs 전송 모듈 (PostgreSQL 운영 전환 + PostGIS 이후)
- [ ] 위치 기반 트리거 알림 시나리오 (서버: 새 반띵 → 반경 N m 활성 유저 조회 → 푸시)
- [ ] 인앱 채팅 (별도 spec)

### Phase 3 — 백그라운드 위치 등

- [ ] `@capacitor-community/background-geolocation` (또는 자작 Plugin)
- [ ] "지나가다가 알림" 시나리오

## 5. 마이그레이션 절차 (High level)

1. **현재 `mobile/`을 `mobile-kmp/`로 git mv** (히스토리 보존)
2. **`mobile/` 새로 Vite 프로젝트 생성** (`pnpm create vite mobile --template react-ts`)
3. **Capacitor 셋업** (`pnpm add @capacitor/core @capacitor/cli` → `npx cap init` → `npx cap add ios && npx cap add android`)
4. **Tailwind + 디자인 토큰** 셋업
5. **공용 layer 구축** (api, stores, components, hooks)
6. **화면 차례로 이식** — Login → Home/Map/Profile → Create/Detail/List 순
7. **Capacitor Plugin 통합** (Camera/Geolocation/Preferences/Browser/App)
8. **OAuth deep link 셋업** (iOS Info.plist + Android intent-filter + App plugin)
9. **카카오맵 통합** (key는 `local.properties`에서 React `import.meta.env`로 이전)
10. **실기기 스모크** (iOS/Android 둘 다)
11. **CI/CD 업데이트** — 기존 GitHub Actions 워크플로우 검토 + 신규 빌드 잡 (Phase 2)
12. **`mobile-kmp/` 삭제** (마이그레이션 완료 + 안정화 확인 후)

## 6. KMP에서 살릴 자산

| KMP 자산 | 활용 방법 |
|----------|-----------|
| API 명세 (`docs/api-spec.md`) | 그대로 |
| `OneBiteApi.kt` 메소드 시그니처 | TypeScript로 1:1 이식 참고 |
| OAuth 키 (`local.properties`) | React `import.meta.env.VITE_KAKAO_KEY` 등으로 이전 |
| 카카오/네이버 SDK 가이드 (KMP는 네이티브 SDK였음) | OAuth 웹 redirect URL 구성 시 client_id 등 참고 |
| Compose 화면 코드 | UI 구조/상태 흐름 참고 (실제 코드는 React로 새로 작성) |
| `docs/design/claude-design-brief.md` | 그대로 활용 |
| Claude Design mockup HTML | React 컴포넌트 이식의 시각 참고 |
| `cancelSplit` PATCH 메소드 (기존 KMP에서 버그 수정한 부분) | 그대로 적용 |

## 7. 비기능 요구

- TypeScript `strict: true`
- React 18.x
- React Router 6.x
- Capacitor 6.x (최신)
- Tailwind CSS 3.4+
- pnpm 9+
- iOS 최소: 13.0 (Capacitor 6 요구사항)
- Android minSdk: 24 (기존 KMP와 동일)
- Bundle id / App id: `co.nthing.app`
- 카피톤: CLAUDE.md "카피톤" 섹션 표준 따름 (워드마크 "Nthing", CTA "반띵할게요" 등)

## 8. 환경 변수

```
VITE_API_BASE_URL=http://<EIP>/api       # 또는 도메인 확정 후 https://api.nthing.co/
VITE_KAKAO_JS_KEY=...
VITE_KAKAO_REST_KEY=...
VITE_NAVER_CLIENT_ID=...
VITE_NAVER_REDIRECT_URI=...
VITE_GOOGLE_CLIENT_ID=...
VITE_APPLE_CLIENT_ID=...
VITE_KAKAOMAP_APP_KEY=...                # 카카오맵 JS SDK
```

`mobile/.env.example` 작성 (단 사용자 메모리: ".example 파일 생성 금지" — 대신 README에 환경변수 목록 기재).

## 9. 리스크

1. **카카오맵 JS SDK** 모바일 webview에서 제스처/줌 이슈 가능 → 실기기 테스트 필수
2. **OAuth deep link callback** — iOS Universal Links 셋업까지는 안 가더라도 custom scheme(`onebite://`) 처리는 안정적이어야 함
3. **PostgreSQL 운영 전환 시점** — Phase 2 푸시 작업과 맞물림 (서버 spec 별도)
4. **카카오/네이버 OAuth redirect_uri 화이트리스트** — 개발자센터에 `nthing://auth/callback` 등록 가능 여부 확인 (일부 provider는 https만 허용 → 백엔드 콜백으로 받아 deep link로 forward 패턴 필요)
5. **마감임박 배지** 같은 디자인 미세조정은 React 이식 단계에서 함께 처리 (별도 round-trip 안 함)

## 10. Out of scope

- 서버 변경 (그대로)
- 인프라 변경 (그대로)
- PC 웹 별도 빌드 (Vite 결과를 그대로 PWA로 제공 — SSR 등은 안 함)
- 백그라운드 위치 추적 (Phase 3)
- 인앱 채팅 (Phase 2)
- 푸시 알림 (Phase 2)
- 결제/안전거래 (Phase 2)
