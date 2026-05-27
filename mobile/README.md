# mobile/ — Nthing 클라이언트 (Vite + React + Capacitor)

Phase 1.1 Foundation 완료 상태. 다음 plan들에서 디자인 시스템 컴포넌트 / API / 화면 / 카카오맵 등 추가.

## Stack
- Vite 8 + React 19 + TypeScript 6 (strict)
- Tailwind CSS 3.4 + Pretendard
- Zustand 5 + TanStack Query 5
- React Router 7
- Capacitor 8 (iOS + Android, SPM 사용 — CocoaPods 불필요)
- Vitest 4 + React Testing Library 16
- ESLint 10 (flat config)

## Setup
```bash
pnpm install
```

### Android 빌드 사전 조건
Capacitor 8은 **Java 21**을 요구합니다. macOS 기준:
```bash
brew install openjdk@21
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
```
(shell profile에 `JAVA_HOME` export 추가 권장. `java -version`은 11/17 그대로 둬도 무방 — Gradle은 `JAVA_HOME` 우선.)

## Scripts
```bash
pnpm dev            # Vite dev 서버 (브라우저)
pnpm build          # 정적 빌드 → dist/
pnpm preview        # 빌드 결과 미리보기
pnpm lint           # ESLint
pnpm format         # Prettier 적용
pnpm format:check   # Prettier 검사
pnpm test           # Vitest watch
pnpm test:run       # Vitest 1회
```

## Mobile (Capacitor)
```bash
pnpm build && npx cap sync           # 모든 플랫폼 동기화
npx cap open ios                     # Xcode 열기
npx cap open android                 # Android Studio 열기
```

## Environment Variables (다음 plan에서 채워질 .env)
- `VITE_API_BASE_URL` — 서버 base URL (예: http://<EIP>/api 또는 https://api.nthing.co)
- `VITE_KAKAO_JS_KEY`
- `VITE_KAKAO_REST_KEY`
- `VITE_NAVER_CLIENT_ID`
- `VITE_NAVER_REDIRECT_URI`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_APPLE_CLIENT_ID`
- `VITE_KAKAOMAP_APP_KEY`

(.env는 .gitignore에 포함. 로컬에서는 `mobile/.env`로 관리.)

## Deep link scheme
- `nthing://` — OAuth 콜백 등에 사용 (Info.plist + AndroidManifest 셋업됨)

## 환경변수 (`.env.local` 로 주입, 커밋 금지)

| 변수 | 용도 | dev 기본값 |
|------|------|-----------|
| `VITE_API_BASE_URL` | API 베이스 URL | 미설정 시 `http://localhost:8080/api` |
| `VITE_KAKAO_REST_KEY` | 카카오 REST 키 (authorize client_id) | (실값 필요) |
| `VITE_NAVER_CLIENT_ID` | 네이버 client_id | (실값 필요) |
| `VITE_GOOGLE_CLIENT_ID` | 구글 OAuth client_id | (실값 필요) |
| `VITE_APPLE_CLIENT_ID` | 애플 client_id (Apple 로그인은 아직 보류) | (후속) |

## 인증 / OAuth

- 방식: **서버 릴레이**. authorize `redirect_uri = {VITE_API_BASE_URL}/auth/callback/{provider}` → 서버가
  `nthing://auth/callback?provider=..&code=..` 커스텀 스킴으로 딥링크 → 앱이 받아 `POST /auth/{provider}` 로 코드 교환.
- 커스텀 스킴 딥링크는 **네이티브(iOS/Android)에서만** 동작. 웹/브라우저 dev 에서는 **dev 전용 "테스트 로그인"** 버튼으로 검증.
- dev 로그인: 서버 `@Profile("!prod")` 의 `POST /api/auth/dev-login` 이 시드 유저 JWT 발급. (prod 빌드엔 미존재)
- 실제 OAuth 라운드트립은 실 client_id + provider 콘솔의 redirect_uri 화이트리스트 등록 후 가능.

## 로컬 웹 dev (브라우저) — dev 로그인 루프 확인

`vite.config.ts` 는 `/api` 를 `http://localhost:8080` 로 프록시한다(브라우저 CORS 회피).
브라우저에서 dev 로그인 루프를 확인하려면 **상대 base URL** 로 띄운다:

```bash
# 터미널 A: 서버
cd server && ./gradlew bootRun
# 터미널 B: 클라 (상대 base URL → vite 프록시 경유 → 8080)
cd mobile && VITE_API_BASE_URL=/api pnpm dev
```

→ http://localhost:5173 → 토큰 없으면 `/login` → "테스트 로그인 (개발용)" 클릭 → `/home`("개발테스터님").
새로고침해도 유지(Preferences hydrate=자동 로그인), 로그아웃 시 `/login` 복귀.
(네이티브 빌드는 절대 `VITE_API_BASE_URL` 사용. 프로덕션 Capacitor 웹뷰는 별도 CORS/네이티브 HTTP 검토 — infra 단계.)

## Reference
- 마이그레이션 spec: `docs/superpowers/specs/2026-05-18-client-rewrite-design.md`
- Phase 1.1 plan: `docs/superpowers/plans/2026-05-19-nthing-phase1-foundation.md`
- 디자인 brief: `docs/design/claude-design-brief.md`
