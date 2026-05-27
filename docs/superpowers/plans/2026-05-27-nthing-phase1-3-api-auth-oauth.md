# Nthing Phase 1.3 — API + Auth + OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마이그레이션된 `mobile/` (Vite+React+Capacitor) 클라이언트에 HTTP 클라이언트 + 인증 스토어 + 소셜 OAuth 로그인 플로우를 붙여, "로그인 → JWT 발급/저장 → 내 정보 → 인증된 화면 → 로그아웃 → 자동 로그인"의 인증 수직 슬라이스를 완성한다.

**Architecture:** OAuth는 **서버 릴레이 방식**. 클라가 provider authorize URL을 `redirect_uri = {server}/api/auth/callback/{provider}` 로 열고(Capacitor Browser), 서버 `/api/auth/callback/{provider}` 가 인가코드를 커스텀 스킴 `nthing://auth/callback?provider=..&code=..&state=..` 로 딥링크하여 앱에 되돌려준다. 앱은 Capacitor App `appUrlOpen` 으로 받아 React Router `/auth/callback` 로 넘기고, 거기서 `POST /api/auth/{provider}` 로 코드를 교환해 JWT를 받는다. 토큰은 Zustand `authStore` + Capacitor Preferences 에 저장. OAuth 실값/redirect 화이트리스트가 없는 dev 환경 검증을 위해 서버에 `@Profile("!prod")` 전용 `POST /api/auth/dev-login`(시드 유저 실제 JWT 발급)을 추가하고 클라에 dev 전용 "테스트 로그인" 버튼을 둔다.

**Tech Stack:** React 19 + React Router 7 + Zustand 5 + TanStack Query 5 + fetch + Capacitor 8(`@capacitor/preferences`/`browser`/`app`) + Vitest/RTL. 서버: Kotlin + Spring Boot 3.5 + MockMvc.

---

## Scope & Decisions (반드시 먼저 읽을 것)

1. **OAuth redirect = 서버 릴레이 + `nthing://`** (사용자 확정). 서버 `AuthController` 의 릴레이 스킴을 하드코딩 `com.onebite.app://oauth/{provider}` → 설정값 `app.oauth.callback-url`(기본 `nthing://auth/callback`)로 바꾸고, `provider` 를 쿼리 파라미터로 실어 보낸다.
2. **dev 검증 = 서버 dev-login 엔드포인트** (사용자 확정). `@Profile("!prod")` 전용 `POST /api/auth/dev-login` 이 시드 유저의 **실제 JWT** 를 발급. 클라 Login 화면의 dev 버튼이 이걸 호출 → 브라우저에서 실제 로그인 루프 클릭 검증 + Phase 1.4 화면 개발 unblock.
3. **Apple은 이번 Phase 보류**. 서버 릴레이(`oauthCallbackLogin`)도 Apple 미지원이고 Apple은 form_post + id_token 으로 흐름이 다름. Login 화면에 Apple 버튼은 **렌더하되 비활성("준비 중")**, `nthingApi.loginApple(idToken)` 메소드 시그니처만 마련. 실제 Sign in with Apple 배선은 후속(실키 + 서버 작업과 함께).
4. **API 클라이언트 범위 = auth + me 만**. `splits`/`uploads` 메소드는 이를 소비하는 화면이 생기는 **Phase 1.4** 에서 함께 추가(YAGNI, 함께 바뀌는 코드는 함께).
5. **임시 `/home` 화면**. Phase 1.3 의 인증 후 착지점으로 닉네임 + 로그아웃만 있는 임시 `Home.tsx` 를 둔다. Phase 1.4 에서 MainLayout(AppBar+BottomNav+FAB)으로 교체. 코드에 `// TEMP (Phase 1.4 에서 교체)` 주석 명시.
6. **웹(브라우저) 한계**: 커스텀 스킴 딥링크는 네이티브에서만 동작. 웹 dev 에서는 dev-login 버튼으로 검증한다(실 OAuth 라운드트립은 실기기 + 실키 단계). 이 제약을 README 에 적는다.
7. **실값 미존재로 못 하는 것(이번 범위 밖, 명시)**: 실제 Kakao/Naver/Google 라운드트립, redirect_uri 화이트리스트, 서버 `*.redirect-uri` 설정을 릴레이 경로(`/api/auth/callback/{provider}`)에 맞추는 작업. → 인프라 "OAuth 실값 교체" 체크리스트로 이월.

---

## File Structure (이 plan에서 생기는/바뀌는 파일)

### 서버 (server/)
- **Modify** `src/main/kotlin/com/onebite/server/auth/AuthController.kt` — 릴레이 스킴 설정값화 + `provider` 쿼리 추가
- **Modify** `src/main/kotlin/com/onebite/server/auth/AuthService.kt` — `devLogin()` 추가
- **Create** `src/main/kotlin/com/onebite/server/auth/DevAuthController.kt` — `@Profile("!prod")` `POST /api/auth/dev-login`
- **Modify** `src/main/resources/application.properties` — `app.oauth.callback-url=nthing://auth/callback`
- **Create** `src/test/kotlin/com/onebite/server/auth/AuthCallbackRelayTest.kt`
- **Create** `src/test/kotlin/com/onebite/server/auth/DevAuthControllerTest.kt`

### 클라이언트 (mobile/)
- **Create** `src/env.d.ts` — `ImportMetaEnv` 타입
- **Create** `src/shared/lib/env.ts` — 환경변수 단일 접근점
- **Create** `src/shared/api/types.ts` — `AuthResponse`/`Me`/`AuthUser`/`Provider`/`ApiError`
- **Create** `src/shared/api/http.ts` (+ `http.test.ts`) — fetch 래퍼 + 토큰 주입 + 에러/401
- **Create** `src/shared/api/nthingApi.ts` (+ `nthingApi.test.ts`) — auth + devLogin + me
- **Create** `src/shared/stores/authStore.ts` (+ `authStore.test.ts`) — Zustand + Preferences + hydrate
- **Create** `src/features/auth/oauth.ts` (+ `oauth.test.ts`) — authorize URL 빌더 + startOAuth
- **Create** `src/features/auth/deepLink.ts` (+ `deepLink.test.ts`) — `nthing://auth/callback` 파서
- **Create** `src/features/auth/guards.tsx` — `RootRedirect`/`RequireAuth`
- **Create** `src/features/auth/DeepLinkListener.tsx` — Capacitor App `appUrlOpen` → 라우터
- **Create** `src/routes/Login.tsx` (+ `Login.test.tsx`)
- **Create** `src/routes/AuthCallback.tsx` (+ `AuthCallback.test.tsx`)
- **Create** `src/routes/Home.tsx` — 임시 인증 후 화면
- **Modify** `src/App.tsx` — hydrate + 딥링크 리스너 + 라우트(`/login`,`/auth/callback`,`/home`,`/`)
- **Modify** `README.md` — 환경변수 + OAuth/dev-login 문서
- **Modify** `package.json` — `@capacitor/preferences|browser|app` (pnpm add 로 갱신)

### 공유 타입/시그니처 (모든 client task가 이 정의를 따른다 — 일관성 고정)

```ts
// shared/api/types.ts 가 export 하는 계약
export type Provider = 'kakao' | 'naver' | 'google' | 'apple';
export type AuthResponse = { token: string; userId: number; nickname: string; isNewUser: boolean };
export type Me = { id: number; nickname: string; profileImageUrl: string | null; createdAt: string };
export type UpdateMeRequest = { nickname: string };
export type AuthUser = { id: number; nickname: string; profileImageUrl?: string | null };
export class ApiError extends Error { status: number; /* ctor(status, message) */ }

// shared/api/http.ts
export function setAuthToken(token: string | null): void;
export function setUnauthorizedHandler(fn: (() => void) | null): void;
export function apiFetch<T>(path: string, options?: { method?: string; body?: unknown; auth?: boolean }): Promise<T>;

// shared/lib/env.ts
export const env: { apiBaseUrl: string; kakaoRestKey: string; naverClientId: string; googleClientId: string; appleClientId: string };

// shared/api/nthingApi.ts
export const nthingApi: {
  loginKakao(code: string): Promise<AuthResponse>;
  loginNaver(code: string, state: string): Promise<AuthResponse>;
  loginGoogle(code: string): Promise<AuthResponse>;
  loginApple(idToken: string): Promise<AuthResponse>;
  devLogin(): Promise<AuthResponse>;
  getMe(): Promise<Me>;
  updateMe(req: UpdateMeRequest): Promise<Me>;
};

// shared/stores/authStore.ts
useAuthStore: { token: string|null; user: AuthUser|null; isHydrated: boolean;
  setAuth(res: AuthResponse): Promise<void>; logout(): Promise<void>; hydrate(): Promise<void>; };

// features/auth/oauth.ts
export function buildAuthorizeUrl(provider: Provider, state?: string): string;  // apple → throw
export function startOAuth(provider: Provider): Promise<void>;

// features/auth/deepLink.ts
export type AuthCallbackParams = { provider: Provider; code?: string; state?: string; error?: string };
export function parseAuthCallback(url: string): AuthCallbackParams | null;
```

> **컨벤션 (모든 task 준수)**: 상대경로 import(별칭 `@/` 안 씀). 타입 import 는 `import { type X } from '...'` 또는 `import type`. `erasableSyntaxOnly` 때문에 **enum/네임스페이스/생성자 파라미터 프로퍼티 금지**(클래스 필드는 본문에서 대입). 테스트는 `import { describe, it, expect, vi } from 'vitest'` 명시 import. `noUnusedLocals/Parameters` 위반 금지.

---

## Task 0: Capacitor 플러그인 설치 + 환경변수 타입/문서

**Files:**
- Modify: `mobile/package.json` (pnpm add 결과)
- Create: `mobile/src/env.d.ts`
- Modify: `mobile/README.md`

- [ ] **Step 1: 플러그인 설치 (Capacitor 8 라인에 맞춤)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm add @capacitor/preferences@^8 @capacitor/browser@^8 @capacitor/app@^8
```
Expected: `package.json` dependencies 에 3개 추가, `@capacitor/core ^8.3.4` 와 메이저 일치. (만약 `^8` 태그가 없으면 `pnpm add @capacitor/preferences @capacitor/browser @capacitor/app` 로 latest 설치 후 메이저가 8인지 확인.)

- [ ] **Step 2: 네이티브 셸에 플러그인 동기화**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
npx cap sync
```
Expected: `[info] Found 3 Capacitor plugins ...: @capacitor/app, @capacitor/browser, @capacitor/preferences` 류 출력, ios/android 동기화 성공. (CocoaPods/Java 미설치로 일부 경고가 떠도 sync 자체가 plugins 를 인식하면 OK.)

- [ ] **Step 3: `src/env.d.ts` 생성**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_REST_KEY?: string;
  readonly VITE_NAVER_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APPLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 4: README 환경변수/인증 섹션 추가**

`mobile/README.md` 끝에 아래 섹션을 추가(사용자 메모리상 `.env.example` 파일은 만들지 않고 README 에 문서화):

```markdown
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
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/package.json mobile/pnpm-lock.yaml mobile/src/env.d.ts mobile/README.md mobile/ios mobile/android
git commit -m "$(cat <<'EOF'
build(mobile): add capacitor preferences/browser/app + env typings & auth docs

Phase 1.3 준비: 토큰 저장(Preferences)·OAuth(Browser)·딥링크(App) 플러그인 설치,
ImportMetaEnv 타입, README 환경변수/OAuth 릴레이/dev-login 문서화.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1: [server] OAuth 릴레이 스킴 설정값화 (`nthing://`)

**Files:**
- Modify: `server/src/main/kotlin/com/onebite/server/auth/AuthController.kt:11-33`
- Modify: `server/src/main/resources/application.properties`
- Test: `server/src/test/kotlin/com/onebite/server/auth/AuthCallbackRelayTest.kt`

- [ ] **Step 1: 실패 테스트 작성**

`AuthCallbackRelayTest.kt`:
```kotlin
package com.onebite.server.auth

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class AuthCallbackRelayTest {

    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun `callback 은 nthing 스킴으로 provider 와 code 를 실어 리다이렉트한다`() {
        mockMvc.get("/api/auth/callback/kakao") {
            param("code", "ABC123")
        }.andExpect {
            status { is3xxRedirection() }
            redirectedUrl("nthing://auth/callback?provider=kakao&code=ABC123")
        }
    }

    @Test
    fun `code 가 없으면 error 를 실어 리다이렉트한다`() {
        mockMvc.get("/api/auth/callback/naver") {
            param("error", "access_denied")
        }.andExpect {
            status { is3xxRedirection() }
            redirectedUrl("nthing://auth/callback?provider=naver&error=access_denied")
        }
    }
}
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server
./gradlew test --tests "com.onebite.server.auth.AuthCallbackRelayTest"
```
Expected: FAIL — 현재 스킴이 `com.onebite.app://oauth/kakao?code=ABC123` 라 `redirectedUrl` 불일치.

- [ ] **Step 3: AuthController 수정**

`AuthController.kt` 의 클래스 시그니처와 `oauthCallback` 본문을 교체:
```kotlin
package com.onebite.server.auth

import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.oauth.callback-url:nthing://auth/callback}") private val callbackUrl: String
) {
    // GET /api/auth/callback/{provider} — OAuth 릴레이.
    // provider 콘솔에는 이 https URL 을 redirect_uri 로 등록. 서버가 인가코드를
    // 앱 커스텀 스킴(nthing://auth/callback?provider=..&code=..)으로 딥링크해 되돌린다.
    @GetMapping("/callback/{provider}")
    fun oauthCallback(
        @PathVariable provider: String,
        @RequestParam code: String?,
        @RequestParam state: String?,
        @RequestParam error: String?,
        response: HttpServletResponse
    ) {
        fun enc(v: String) = java.net.URLEncoder.encode(v, "UTF-8")
        val query = buildString {
            append("provider=").append(enc(provider))
            if (error != null || code == null) {
                append("&error=").append(enc(error ?: "no_code"))
            } else {
                append("&code=").append(enc(code))
                if (state != null) append("&state=").append(enc(state))
            }
        }
        response.sendRedirect("$callbackUrl?$query")
    }

    // POST /api/auth/kakao — 카카오 로그인 (인가코드 or 액세스토큰)
    @PostMapping("/kakao")
    fun kakaoLogin(@RequestBody request: KakaoLoginRequest): AuthResponse =
        if (request.accessToken != null)
            authService.kakaoLoginWithToken(request.accessToken)
        else
            authService.kakaoLogin(request.code!!)

    // POST /api/auth/naver — 네이버 인가코드로 로그인
    @PostMapping("/naver")
    fun naverLogin(@RequestBody request: NaverLoginRequest): AuthResponse =
        authService.naverLogin(request.code, request.state)

    // POST /api/auth/google — Google 로그인 (인가코드 or ID 토큰)
    @PostMapping("/google")
    fun googleLogin(@RequestBody request: GoogleLoginRequest): AuthResponse =
        if (request.idToken != null)
            authService.googleLoginWithToken(request.idToken)
        else
            authService.googleLogin(request.code!!)

    // POST /api/auth/apple — Apple ID 토큰으로 로그인
    @PostMapping("/apple")
    fun appleLogin(@RequestBody request: AppleLoginRequest): AuthResponse =
        authService.appleLogin(request.idToken)
}

data class KakaoLoginRequest(
    val code: String? = null,
    val accessToken: String? = null
)

data class NaverLoginRequest(
    val code: String,
    val state: String
)

data class GoogleLoginRequest(
    val code: String? = null,
    val idToken: String? = null
)

data class AppleLoginRequest(
    val idToken: String
)
```

- [ ] **Step 4: application.properties 에 설정 추가**

`server/src/main/resources/application.properties` 의 JWT 블록 아래에 추가:
```properties
# OAuth 딥링크 릴레이 대상 (모바일 앱이 등록한 커스텀 스킴)
app.oauth.callback-url=nthing://auth/callback
```

- [ ] **Step 5: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server
./gradlew test --tests "com.onebite.server.auth.AuthCallbackRelayTest"
```
Expected: PASS (2 tests).

- [ ] **Step 6: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add server/src/main/kotlin/com/onebite/server/auth/AuthController.kt server/src/main/resources/application.properties server/src/test/kotlin/com/onebite/server/auth/AuthCallbackRelayTest.kt
git commit -m "$(cat <<'EOF'
feat(server/auth): make OAuth relay scheme configurable (default nthing://)

릴레이 콜백이 하드코딩 com.onebite.app:// 대신 app.oauth.callback-url 설정값을 쓰고,
provider 를 쿼리로 실어 nthing://auth/callback?provider=..&code=.. 형태로 딥링크.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: [server] dev-login 엔드포인트 (`@Profile("!prod")`)

**Files:**
- Modify: `server/src/main/kotlin/com/onebite/server/auth/AuthService.kt:50-54` (devLogin 추가)
- Create: `server/src/main/kotlin/com/onebite/server/auth/DevAuthController.kt`
- Test: `server/src/test/kotlin/com/onebite/server/auth/DevAuthControllerTest.kt`

- [ ] **Step 1: 실패 테스트 작성**

`DevAuthControllerTest.kt`:
```kotlin
package com.onebite.server.auth

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
class DevAuthControllerTest {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    @Test
    fun `dev-login 은 실제 JWT 를 발급하고 그 토큰으로 내 정보 조회가 된다`() {
        val body = mockMvc.post("/api/auth/dev-login").andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
            jsonPath("$.nickname") { value("개발테스터") }
        }.andReturn().response.contentAsString

        val token = objectMapper.readTree(body).get("token").asText()

        mockMvc.get("/api/users/me") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.nickname") { value("개발테스터") }
        }
    }
}
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server
./gradlew test --tests "com.onebite.server.auth.DevAuthControllerTest"
```
Expected: FAIL — `/api/auth/dev-login` 404 (엔드포인트 없음).

- [ ] **Step 3: AuthService 에 devLogin 추가**

`AuthService.kt` 의 `appleLogin(...)` 함수 **바로 아래**(line 54 다음)에 추가:
```kotlin
    // dev 전용 로그인: 시드 유저(개발테스터) find-or-create 후 실제 JWT 발급.
    // DevAuthController(@Profile("!prod"))에서만 호출됨.
    fun devLogin(): AuthResponse =
        loginOrRegister(AuthProvider.KAKAO, SocialUserInfo("dev-local-user", "개발테스터", null))
```
(`loginOrRegister` 는 같은 클래스의 private 메소드라 호출 가능. 기존 import `com.onebite.server.user.AuthProvider` 그대로 사용.)

- [ ] **Step 4: DevAuthController 생성**

`DevAuthController.kt`:
```kotlin
package com.onebite.server.auth

import org.springframework.context.annotation.Profile
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

// 개발 전용 로그인. prod 프로파일에서는 빈 등록 자체가 안 됨(@Profile("!prod")).
// /api/auth/** 는 SecurityConfig 에서 이미 permitAll.
@Profile("!prod")
@RestController
@RequestMapping("/api/auth")
class DevAuthController(
    private val authService: AuthService
) {
    @PostMapping("/dev-login")
    fun devLogin(): AuthResponse = authService.devLogin()
}
```

- [ ] **Step 5: 테스트 실행 (pass) + 서버 전체 회귀**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server
./gradlew test --tests "com.onebite.server.auth.DevAuthControllerTest"
./gradlew test
```
Expected: dev-login 테스트 PASS, 그리고 전체 테스트 스위트 PASS (기존 Auth/Split/User 테스트 회귀 없음).

- [ ] **Step 6: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add server/src/main/kotlin/com/onebite/server/auth/AuthService.kt server/src/main/kotlin/com/onebite/server/auth/DevAuthController.kt server/src/test/kotlin/com/onebite/server/auth/DevAuthControllerTest.kt
git commit -m "$(cat <<'EOF'
feat(server/auth): add @Profile("!prod") POST /api/auth/dev-login

OAuth 실키 없이 클라 인증 루프를 검증하기 위한 dev 전용 로그인.
시드 유저(개발테스터)를 find-or-create 하여 실제 JWT 발급. prod 빌드엔 미포함.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: [client] env 접근점 + HTTP 클라이언트

**Files:**
- Create: `mobile/src/shared/lib/env.ts`
- Create: `mobile/src/shared/api/types.ts`
- Create: `mobile/src/shared/api/http.ts`
- Test: `mobile/src/shared/api/http.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`http.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, setAuthToken, setUnauthorizedHandler, ApiError } from './http';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    setAuthToken(null);
    setUnauthorizedHandler(null);
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('GET 은 base URL 에 path 를 붙이고 JSON 을 반환한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ ok: 1 }));
    const data = await apiFetch<{ ok: number }>('/users/me');
    expect(data).toEqual({ ok: 1 });
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/users/me');
    expect((init as RequestInit).method).toBe('GET');
  });

  it('토큰이 있으면 Authorization 헤더를 주입한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
    setAuthToken('jwt-123');
    await apiFetch('/users/me');
    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-123');
  });

  it('auth:false 면 토큰을 안 붙이고 body 를 JSON 직렬화한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));
    setAuthToken('jwt-123');
    await apiFetch('/auth/kakao', { method: 'POST', body: { code: 'C' }, auth: false });
    const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    expect(init.body).toBe(JSON.stringify({ code: 'C' }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('비2xx 면 서버 message 로 ApiError 를 던진다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ status: 400, error: 'Bad Request', message: '상품명은 필수입니다' }, 400),
    );
    await expect(apiFetch('/splits')).rejects.toMatchObject({ status: 400, message: '상품명은 필수입니다' });
    await expect(apiFetch('/splits')).rejects.toBeInstanceOf(ApiError);
  });

  it('401 이면 onUnauthorized 콜백을 호출한다', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ message: '인증 필요' }, 401));
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    await expect(apiFetch('/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/api/http.test.ts
```
Expected: FAIL — `./http` 모듈/exports 없음.

- [ ] **Step 3: env.ts 구현**

`shared/lib/env.ts`:
```ts
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  kakaoRestKey: import.meta.env.VITE_KAKAO_REST_KEY ?? '',
  naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID ?? '',
} as const;
```

- [ ] **Step 4: types.ts 구현**

`shared/api/types.ts`:
```ts
export type Provider = 'kakao' | 'naver' | 'google' | 'apple';

export type AuthResponse = {
  token: string;
  userId: number;
  nickname: string;
  isNewUser: boolean;
};

export type Me = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: string;
};

export type UpdateMeRequest = { nickname: string };

export type AuthUser = {
  id: number;
  nickname: string;
  profileImageUrl?: string | null;
};

// erasableSyntaxOnly: 생성자 파라미터 프로퍼티 금지 → 필드 선언 + 본문 대입
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
```

- [ ] **Step 5: http.ts 구현**

`shared/api/http.ts`:
```ts
import { env } from '../lib/env';
import { ApiError } from './types';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) onUnauthorized?.();

  if (!res.ok) {
    let message = `요청 실패 (${res.status})`;
    try {
      const err = (await res.json()) as { message?: string };
      if (err?.message) message = err.message;
    } catch {
      // 본문이 JSON 이 아니면 기본 메시지 유지
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

- [ ] **Step 6: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/api/http.test.ts
```
Expected: PASS (5 tests).

- [ ] **Step 7: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/shared/lib/env.ts mobile/src/shared/api/types.ts mobile/src/shared/api/http.ts mobile/src/shared/api/http.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/api): add fetch-based http client with token interceptor

env 단일 접근점 + ApiError + apiFetch(토큰 자동 주입, 비2xx→ApiError, 401→핸들러).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: [client] nthingApi (auth + devLogin + me)

**Files:**
- Create: `mobile/src/shared/api/nthingApi.ts`
- Test: `mobile/src/shared/api/nthingApi.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`nthingApi.test.ts` — `http` 모듈의 `apiFetch` 를 모킹하고 각 메소드가 올바른 path/method/body/auth 로 호출하는지 검증:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./http', () => ({ apiFetch: vi.fn() }));

import { apiFetch } from './http';
import { nthingApi } from './nthingApi';

const mockFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

describe('nthingApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ token: 't', userId: 1, nickname: 'n', isNewUser: false });
  });

  it('loginKakao 는 POST /auth/kakao { code } 를 auth 없이 호출', async () => {
    await nthingApi.loginKakao('CODE');
    expect(mockFetch).toHaveBeenCalledWith('/auth/kakao', { method: 'POST', body: { code: 'CODE' }, auth: false });
  });

  it('loginNaver 는 POST /auth/naver { code, state }', async () => {
    await nthingApi.loginNaver('CODE', 'STATE');
    expect(mockFetch).toHaveBeenCalledWith('/auth/naver', { method: 'POST', body: { code: 'CODE', state: 'STATE' }, auth: false });
  });

  it('loginGoogle 는 POST /auth/google { code }', async () => {
    await nthingApi.loginGoogle('CODE');
    expect(mockFetch).toHaveBeenCalledWith('/auth/google', { method: 'POST', body: { code: 'CODE' }, auth: false });
  });

  it('loginApple 는 POST /auth/apple { idToken }', async () => {
    await nthingApi.loginApple('IDTOKEN');
    expect(mockFetch).toHaveBeenCalledWith('/auth/apple', { method: 'POST', body: { idToken: 'IDTOKEN' }, auth: false });
  });

  it('devLogin 은 POST /auth/dev-login (auth 없음)', async () => {
    await nthingApi.devLogin();
    expect(mockFetch).toHaveBeenCalledWith('/auth/dev-login', { method: 'POST', auth: false });
  });

  it('getMe 는 GET /users/me', async () => {
    mockFetch.mockResolvedValue({ id: 1, nickname: 'n', profileImageUrl: null, createdAt: '2026-01-01T00:00:00' });
    await nthingApi.getMe();
    expect(mockFetch).toHaveBeenCalledWith('/users/me');
  });

  it('updateMe 는 PATCH /users/me { nickname }', async () => {
    mockFetch.mockResolvedValue({ id: 1, nickname: 'x', profileImageUrl: null, createdAt: '2026-01-01T00:00:00' });
    await nthingApi.updateMe({ nickname: 'x' });
    expect(mockFetch).toHaveBeenCalledWith('/users/me', { method: 'PATCH', body: { nickname: 'x' } });
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/api/nthingApi.test.ts
```
Expected: FAIL — `./nthingApi` 없음.

- [ ] **Step 3: nthingApi.ts 구현**

`shared/api/nthingApi.ts`:
```ts
import { apiFetch } from './http';
import { type AuthResponse, type Me, type UpdateMeRequest } from './types';

export const nthingApi = {
  loginKakao: (code: string) =>
    apiFetch<AuthResponse>('/auth/kakao', { method: 'POST', body: { code }, auth: false }),

  loginNaver: (code: string, state: string) =>
    apiFetch<AuthResponse>('/auth/naver', { method: 'POST', body: { code, state }, auth: false }),

  loginGoogle: (code: string) =>
    apiFetch<AuthResponse>('/auth/google', { method: 'POST', body: { code }, auth: false }),

  loginApple: (idToken: string) =>
    apiFetch<AuthResponse>('/auth/apple', { method: 'POST', body: { idToken }, auth: false }),

  devLogin: () =>
    apiFetch<AuthResponse>('/auth/dev-login', { method: 'POST', auth: false }),

  getMe: () => apiFetch<Me>('/users/me'),

  updateMe: (req: UpdateMeRequest) =>
    apiFetch<Me>('/users/me', { method: 'PATCH', body: req }),
};
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/api/nthingApi.test.ts
```
Expected: PASS (7 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/shared/api/nthingApi.ts mobile/src/shared/api/nthingApi.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/api): add nthingApi (auth/devLogin/me) over http client

api-spec.md 계약 1:1: /auth/{kakao,naver,google,apple}, /auth/dev-login, /users/me(GET/PATCH).
splits/uploads 는 화면이 붙는 Phase 1.4 에서 추가.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: [client] authStore (Zustand + Preferences + hydrate)

**Files:**
- Create: `mobile/src/shared/stores/authStore.ts`
- Test: `mobile/src/shared/stores/authStore.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`authStore.test.ts` — `@capacitor/preferences` 를 인메모리로 모킹. (http 토큰 주입은 `http.test` 가 커버하므로 여기서는 store 상태 + 영속화만 검증 — named-import 바인딩 spy 의존성 회피):
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const store: Record<string, string> = {};
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => { store[key] = value; }),
    get: vi.fn(async ({ key }: { key: string }) => ({ value: store[key] ?? null })),
    remove: vi.fn(async ({ key }: { key: string }) => { delete store[key]; }),
  },
}));

import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    useAuthStore.setState({ token: null, user: null, isHydrated: false });
  });

  it('setAuth 는 토큰/유저를 상태와 Preferences 에 저장한다', async () => {
    await useAuthStore.getState().setAuth({ token: 'jwt-1', userId: 7, nickname: '엔띵', isNewUser: true });

    const s = useAuthStore.getState();
    expect(s.token).toBe('jwt-1');
    expect(s.user).toEqual({ id: 7, nickname: '엔띵' });
    expect(store['nthing.auth']).toContain('jwt-1');
    expect(JSON.parse(store['nthing.auth'])).toEqual({ token: 'jwt-1', user: { id: 7, nickname: '엔띵' } });
  });

  it('hydrate 는 Preferences 에서 복원하고 isHydrated 를 true 로 만든다', async () => {
    store['nthing.auth'] = JSON.stringify({ token: 'jwt-2', user: { id: 3, nickname: '복원' } });
    await useAuthStore.getState().hydrate();

    const s = useAuthStore.getState();
    expect(s.token).toBe('jwt-2');
    expect(s.user).toEqual({ id: 3, nickname: '복원' });
    expect(s.isHydrated).toBe(true);
  });

  it('저장된 게 없으면 hydrate 후 token 은 null, isHydrated 는 true', async () => {
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.isHydrated).toBe(true);
  });

  it('logout 은 상태와 저장소를 비운다', async () => {
    await useAuthStore.getState().setAuth({ token: 'jwt-1', userId: 7, nickname: '엔띵', isNewUser: false });
    await useAuthStore.getState().logout();

    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(store['nthing.auth']).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/stores/authStore.test.ts
```
Expected: FAIL — `./authStore` 없음.

- [ ] **Step 3: authStore.ts 구현**

`shared/stores/authStore.ts`:
```ts
import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';
import { setAuthToken } from '../api/http';
import { type AuthResponse, type AuthUser } from '../api/types';

const STORAGE_KEY = 'nthing.auth';

type PersistedAuth = { token: string; user: AuthUser };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  setAuth: (res: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  setAuth: async (res) => {
    const user: AuthUser = { id: res.userId, nickname: res.nickname };
    setAuthToken(res.token);
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify({ token: res.token, user } satisfies PersistedAuth),
    });
    set({ token: res.token, user });
  },

  logout: async () => {
    setAuthToken(null);
    await Preferences.remove({ key: STORAGE_KEY });
    set({ token: null, user: null });
  },

  hydrate: async () => {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) {
      try {
        const parsed = JSON.parse(value) as PersistedAuth;
        setAuthToken(parsed.token);
        set({ token: parsed.token, user: parsed.user, isHydrated: true });
        return;
      } catch {
        // 손상된 값이면 무시하고 비로그인 상태로 진행
      }
    }
    set({ isHydrated: true });
  },
}));
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/stores/authStore.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/shared/stores/authStore.ts mobile/src/shared/stores/authStore.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/stores): add authStore (zustand + Capacitor Preferences)

setAuth/logout/hydrate — 토큰+유저를 Preferences 에 영속화하고 http 인터셉터 토큰 동기화.
hydrate 로 앱 재실행 시 자동 로그인.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: [client] OAuth authorize URL 빌더 + startOAuth

**Files:**
- Create: `mobile/src/features/auth/oauth.ts`
- Test: `mobile/src/features/auth/oauth.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`oauth.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn() } }));

import { Browser } from '@capacitor/browser';
import { buildAuthorizeUrl, startOAuth } from './oauth';

const REDIRECT = encodeURIComponent('http://localhost:8080/api/auth/callback');

describe('buildAuthorizeUrl', () => {
  it('kakao: authorize 엔드포인트 + client_id + redirect_uri + code', () => {
    const url = buildAuthorizeUrl('kakao');
    expect(url).toContain('https://kauth.kakao.com/oauth/authorize');
    expect(url).toContain('response_type=code');
    expect(url).toContain(`redirect_uri=${REDIRECT}%2Fkakao`);
  });

  it('google: openid 스코프 포함', () => {
    const url = buildAuthorizeUrl('google');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('scope=');
    expect(url).toContain(`redirect_uri=${REDIRECT}%2Fgoogle`);
  });

  it('naver: state 를 그대로 싣는다', () => {
    const url = buildAuthorizeUrl('naver', 'STATE-XYZ');
    expect(url).toContain('https://nid.naver.com/oauth2.0/authorize');
    expect(url).toContain('state=STATE-XYZ');
  });

  it('apple 은 아직 미지원이라 throw', () => {
    expect(() => buildAuthorizeUrl('apple')).toThrow();
  });
});

describe('startOAuth', () => {
  beforeEach(() => (Browser.open as ReturnType<typeof vi.fn>).mockReset());

  it('kakao 는 Browser.open 을 authorize URL 로 호출', async () => {
    await startOAuth('kakao');
    const arg = (Browser.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as { url: string };
    expect(arg.url).toContain('kauth.kakao.com');
  });

  it('naver 는 state 를 생성해 sessionStorage 에 저장', async () => {
    await startOAuth('naver');
    expect(sessionStorage.getItem('nthing.naver.state')).toBeTruthy();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/auth/oauth.test.ts
```
Expected: FAIL — `./oauth` 없음.

- [ ] **Step 3: oauth.ts 구현**

`features/auth/oauth.ts`:
```ts
import { Browser } from '@capacitor/browser';
import { env } from '../../shared/lib/env';
import { type Provider } from '../../shared/api/types';

const REDIRECT_BASE = `${env.apiBaseUrl}/auth/callback`; // → .../api/auth/callback/{provider}
export const NAVER_STATE_KEY = 'nthing.naver.state';

function redirectUri(provider: Provider): string {
  return `${REDIRECT_BASE}/${provider}`;
}

// 순수 함수: provider authorize URL 을 만든다. apple 은 아직 미지원.
export function buildAuthorizeUrl(provider: Provider, state?: string): string {
  const redirect = encodeURIComponent(redirectUri(provider));
  switch (provider) {
    case 'kakao':
      return (
        'https://kauth.kakao.com/oauth/authorize' +
        `?client_id=${env.kakaoRestKey}&redirect_uri=${redirect}&response_type=code`
      );
    case 'google':
      return (
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${env.googleClientId}&redirect_uri=${redirect}&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}`
      );
    case 'naver':
      return (
        'https://nid.naver.com/oauth2.0/authorize' +
        `?response_type=code&client_id=${env.naverClientId}&redirect_uri=${redirect}` +
        `&state=${encodeURIComponent(state ?? '')}`
      );
    case 'apple':
      throw new Error('Apple 로그인은 준비 중입니다');
  }
}

// 네이티브: authorize URL 을 인앱 브라우저로 연다. 콜백은 딥링크로 돌아온다.
export async function startOAuth(provider: Provider): Promise<void> {
  let state: string | undefined;
  if (provider === 'naver') {
    state = crypto.randomUUID();
    sessionStorage.setItem(NAVER_STATE_KEY, state);
  }
  const url = buildAuthorizeUrl(provider, state);
  await Browser.open({ url });
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/auth/oauth.test.ts
```
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/features/auth/oauth.ts mobile/src/features/auth/oauth.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/auth): add OAuth authorize URL builder + startOAuth(Browser)

redirect_uri 를 서버 릴레이(/api/auth/callback/{provider})로 구성. kakao/naver/google 코드 플로우,
naver state(CSRF) 생성·저장. apple 은 미지원 throw(후속).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: [client] 딥링크 콜백 파서

**Files:**
- Create: `mobile/src/features/auth/deepLink.ts`
- Test: `mobile/src/features/auth/deepLink.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`deepLink.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseAuthCallback } from './deepLink';

describe('parseAuthCallback', () => {
  it('정상 콜백에서 provider/code/state 추출', () => {
    const r = parseAuthCallback('nthing://auth/callback?provider=naver&code=ABC&state=XYZ');
    expect(r).toEqual({ provider: 'naver', code: 'ABC', state: 'XYZ', error: undefined });
  });

  it('error 콜백 추출', () => {
    const r = parseAuthCallback('nthing://auth/callback?provider=kakao&error=access_denied');
    expect(r).toMatchObject({ provider: 'kakao', error: 'access_denied' });
    expect(r?.code).toBeUndefined();
  });

  it('우리 콜백이 아닌 URL 은 null', () => {
    expect(parseAuthCallback('nthing://other?x=1')).toBeNull();
    expect(parseAuthCallback('https://example.com/auth/callback?provider=kakao&code=A')).toBeNull();
  });

  it('provider 없으면 null', () => {
    expect(parseAuthCallback('nthing://auth/callback?code=A')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/auth/deepLink.test.ts
```
Expected: FAIL — `./deepLink` 없음.

- [ ] **Step 3: deepLink.ts 구현**

`features/auth/deepLink.ts`:
```ts
import { type Provider } from '../../shared/api/types';

const CALLBACK_PREFIX = 'nthing://auth/callback';

export type AuthCallbackParams = {
  provider: Provider;
  code?: string;
  state?: string;
  error?: string;
};

export function parseAuthCallback(url: string): AuthCallbackParams | null {
  if (!url.startsWith(CALLBACK_PREFIX)) return null;
  const queryString = url.split('?')[1] ?? '';
  const params = new URLSearchParams(queryString);
  const provider = params.get('provider');
  if (!provider) return null;
  return {
    provider: provider as Provider,
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
  };
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/auth/deepLink.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/features/auth/deepLink.ts mobile/src/features/auth/deepLink.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/auth): add nthing:// auth callback deep-link parser

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: [client] Login 화면

**Files:**
- Create: `mobile/src/routes/Login.tsx`
- Test: `mobile/src/routes/Login.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`Login.test.tsx` — `startOAuth` 와 `nthingApi` 모킹, MemoryRouter 로 렌더:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/auth/oauth', () => ({ startOAuth: vi.fn() }));
vi.mock('../shared/api/nthingApi', () => ({
  nthingApi: { devLogin: vi.fn().mockResolvedValue({ token: 't', userId: 1, nickname: '개발테스터', isNewUser: false }) },
}));

import { startOAuth } from '../features/auth/oauth';
import { Login } from './Login';

function renderLogin(showDevLogin = false) {
  return render(
    <MemoryRouter>
      <Login showDevLogin={showDevLogin} />
    </MemoryRouter>,
  );
}

describe('Login', () => {
  beforeEach(() => (startOAuth as ReturnType<typeof vi.fn>).mockReset());

  it('워드마크와 4개 provider 버튼을 렌더', () => {
    renderLogin();
    expect(screen.getByText('Nthing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /네이버/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apple/ })).toBeInTheDocument();
  });

  it('Apple 버튼은 비활성(준비 중)', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Apple/ })).toBeDisabled();
  });

  it('카카오 버튼 클릭 시 startOAuth("kakao") 호출', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /카카오/ }));
    expect(startOAuth).toHaveBeenCalledWith('kakao');
  });

  it('showDevLogin=false 면 dev 버튼 없음, true 면 노출', () => {
    const { unmount } = renderLogin(false);
    expect(screen.queryByRole('button', { name: /테스트 로그인/ })).toBeNull();
    unmount();
    renderLogin(true);
    expect(screen.getByRole('button', { name: /테스트 로그인/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Login.test.tsx
```
Expected: FAIL — `./Login` 없음.

- [ ] **Step 3: Login.tsx 구현**

`routes/Login.tsx` (디자인 토큰 사용, provider 색상은 인라인 className):
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOAuth } from '../features/auth/oauth';
import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { type Provider } from '../shared/api/types';
import { cn } from '../shared/lib/cn';

type LoginProps = { showDevLogin?: boolean };

const PROVIDER_LABEL: Record<Provider, string> = {
  kakao: '카카오로 시작하기',
  naver: '네이버로 시작하기',
  google: 'Google로 시작하기',
  apple: 'Apple로 시작하기',
};

const PROVIDER_CLASS: Record<Provider, string> = {
  kakao: 'bg-[#FEE500] text-[#191600]',
  naver: 'bg-[#03C75A] text-white',
  google: 'border border-gray-300 bg-white text-gray-800',
  apple: 'bg-black text-white',
};

export function Login({ showDevLogin = import.meta.env.DEV }: LoginProps) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [busy, setBusy] = useState(false);

  const onProvider = async (provider: Provider) => {
    if (provider === 'apple') return; // 준비 중
    await startOAuth(provider);
  };

  const onDevLogin = async () => {
    setBusy(true);
    try {
      const res = await nthingApi.devLogin();
      await setAuth(res);
      navigate('/home', { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 pb-10 pt-24">
      <header className="space-y-3">
        <h1 className="text-display text-brand">Nthing</h1>
        <p className="text-h2 text-gray-900">반띵하자</p>
        <p className="text-body text-gray-500">근처에서 N분의 1, 같이 사요</p>
      </header>

      <div className="space-y-3">
        {(Object.keys(PROVIDER_LABEL) as Provider[]).map((provider) => {
          const isApple = provider === 'apple';
          return (
            <button
              key={provider}
              type="button"
              disabled={isApple || busy}
              onClick={() => void onProvider(provider)}
              className={cn(
                'flex h-[52px] w-full items-center justify-center rounded-md text-body-em transition-opacity',
                'disabled:cursor-not-allowed disabled:opacity-40',
                PROVIDER_CLASS[provider],
              )}
            >
              {PROVIDER_LABEL[provider]}
              {isApple && <span className="ml-2 text-meta opacity-70">(준비 중)</span>}
            </button>
          );
        })}

        {showDevLogin && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDevLogin()}
            className="flex h-11 w-full items-center justify-center rounded-md border border-dashed border-gray-300 text-caption text-gray-500 disabled:opacity-40"
          >
            테스트 로그인 (개발용)
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Login.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/Login.tsx mobile/src/routes/Login.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add Login screen (4 social buttons + dev login)

카피톤 준수(워드마크/슬로건/서브카피). kakao/naver/google → startOAuth,
apple 은 비활성(준비 중), DEV 빌드에서만 테스트 로그인 버튼.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: [client] AuthCallback 라우트 + 라우트 가드

**Files:**
- Create: `mobile/src/features/auth/guards.tsx`
- Create: `mobile/src/routes/AuthCallback.tsx`
- Test: `mobile/src/routes/AuthCallback.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`AuthCallback.test.tsx` — 쿼리로 진입 시 알맞은 api 호출 + setAuth + /home 이동 검증:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../shared/api/nthingApi', () => ({
  nthingApi: {
    loginKakao: vi.fn().mockResolvedValue({ token: 't', userId: 1, nickname: 'k', isNewUser: false }),
    loginNaver: vi.fn().mockResolvedValue({ token: 't', userId: 1, nickname: 'n', isNewUser: false }),
    loginGoogle: vi.fn(),
  },
}));

import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { AuthCallback } from './AuthCallback';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<div>HOME</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.spyOn(useAuthStore.getState(), 'setAuth').mockResolvedValue(undefined);
    sessionStorage.clear();
  });

  it('kakao code 로 진입 → loginKakao 호출 후 /home', async () => {
    renderAt('/auth/callback?provider=kakao&code=ABC');
    await waitFor(() => expect(nthingApi.loginKakao).toHaveBeenCalledWith('ABC'));
    expect(await screen.findByText('HOME')).toBeInTheDocument();
  });

  it('naver: state 가 sessionStorage 와 일치할 때만 loginNaver', async () => {
    sessionStorage.setItem('nthing.naver.state', 'S1');
    renderAt('/auth/callback?provider=naver&code=ABC&state=S1');
    await waitFor(() => expect(nthingApi.loginNaver).toHaveBeenCalledWith('ABC', 'S1'));
  });

  it('error 파라미터면 /login 으로', async () => {
    renderAt('/auth/callback?provider=kakao&error=access_denied');
    expect(await screen.findByText('LOGIN')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/AuthCallback.test.tsx
```
Expected: FAIL — `./AuthCallback` 없음.

- [ ] **Step 3: guards.tsx 구현**

`features/auth/guards.tsx`:
```tsx
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/stores/authStore';

// "/" 진입 시 토큰 유무로 분기
export function RootRedirect() {
  const token = useAuthStore((s) => s.token);
  return <Navigate to={token ? '/home' : '/login'} replace />;
}

// 인증 필요한 라우트 감싸기
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 4: AuthCallback.tsx 구현**

`routes/AuthCallback.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { nthingApi } from '../shared/api/nthingApi';
import { useAuthStore } from '../shared/stores/authStore';
import { NAVER_STATE_KEY } from '../features/auth/oauth';
import { type AuthResponse, type Provider } from '../shared/api/types';

async function exchange(provider: Provider, code: string, state: string | null): Promise<AuthResponse> {
  switch (provider) {
    case 'kakao':
      return nthingApi.loginKakao(code);
    case 'google':
      return nthingApi.loginGoogle(code);
    case 'naver': {
      const expected = sessionStorage.getItem(NAVER_STATE_KEY);
      sessionStorage.removeItem(NAVER_STATE_KEY);
      if (!state || state !== expected) throw new Error('네이버 state 불일치');
      return nthingApi.loginNaver(code, state);
    }
    case 'apple':
      throw new Error('Apple 로그인은 준비 중입니다');
  }
}

export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode 이중 실행 방지
    ran.current = true;

    const provider = params.get('provider') as Provider | null;
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (!provider || error || !code) {
      navigate('/login', { replace: true });
      return;
    }

    void (async () => {
      try {
        const res = await exchange(provider, code, state);
        await setAuth(res);
        navigate('/home', { replace: true });
      } catch {
        setFailed(true);
        navigate('/login', { replace: true });
      }
    })();
  }, [params, navigate, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-body text-gray-500">{failed ? '로그인에 실패했어요' : '로그인 중...'}</p>
    </div>
  );
}
```

- [ ] **Step 5: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/AuthCallback.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 6: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/features/auth/guards.tsx mobile/src/routes/AuthCallback.tsx mobile/src/routes/AuthCallback.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/auth): add AuthCallback route + RootRedirect/RequireAuth guards

콜백에서 provider별 코드 교환(naver state 검증) → setAuth → /home. 실패 시 /login.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: [client] 임시 Home + App.tsx 배선 (hydrate · 딥링크 · 라우트)

**Files:**
- Create: `mobile/src/routes/Home.tsx`
- Create: `mobile/src/features/auth/DeepLinkListener.tsx`
- Modify: `mobile/src/App.tsx`

- [ ] **Step 1: 임시 Home.tsx 작성**

`routes/Home.tsx`:
```tsx
// TEMP: Phase 1.3 인증 후 착지점. Phase 1.4 에서 MainLayout(AppBar+BottomNav+FAB)으로 교체.
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/authStore';
import { Button } from '../shared/components/Button';

export function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-h1 text-gray-900">{user?.nickname ?? '게스트'}님</p>
        <p className="text-body text-gray-500">반띵하자 — 로그인 성공 (임시 화면)</p>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          void (async () => {
            await logout();
            navigate('/login', { replace: true });
          })();
        }}
      >
        로그아웃
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: DeepLinkListener.tsx 작성**

`features/auth/DeepLinkListener.tsx`:
```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { parseAuthCallback } from './deepLink';

// 네이티브에서 nthing://auth/callback 딥링크를 받아 라우터 /auth/callback 으로 넘긴다.
export function DeepLinkListener() {
  const navigate = useNavigate();

  useEffect(() => {
    let handle: PluginListenerHandle | undefined;
    void CapApp.addListener('appUrlOpen', (event) => {
      const parsed = parseAuthCallback(event.url);
      if (!parsed) return;
      const qs = new URLSearchParams();
      qs.set('provider', parsed.provider);
      if (parsed.code) qs.set('code', parsed.code);
      if (parsed.state) qs.set('state', parsed.state);
      if (parsed.error) qs.set('error', parsed.error);
      navigate(`/auth/callback?${qs.toString()}`, { replace: true });
    }).then((h) => {
      handle = h;
    });
    return () => {
      void handle?.remove();
    };
  }, [navigate]);

  return null;
}
```

- [ ] **Step 3: App.tsx 교체**

`App.tsx` 전체를 교체:
```tsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/lib/queryClient';
import { setUnauthorizedHandler } from './shared/api/http';
import { useAuthStore } from './shared/stores/authStore';
import { DeepLinkListener } from './features/auth/DeepLinkListener';
import { RootRedirect, RequireAuth } from './features/auth/guards';
import { Login } from './routes/Login';
import { AuthCallback } from './routes/AuthCallback';
import { Home } from './routes/Home';
import { Catalog } from './routes/Catalog';

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void useAuthStore.getState().logout();
    });
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) return null; // 토큰 복원 전 짧은 공백 (스플래시 대체)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <DeepLinkListener />
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

> 참고: 기존 `routes/Hello.tsx` 와 `Hello.test.tsx` 는 더 이상 라우트에 안 쓰이지만, 삭제는 Phase 1.4 정리 때 한다(이 task 범위에서는 남겨둠 — `*` 와 `/` 가드가 대체).

- [ ] **Step 4: 타입체크 + 빌드 + 린트**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm build
pnpm lint
```
Expected: `tsc -b` 통과(미사용 import/타입 에러 0), vite build 성공, eslint 0 error.
(만약 `Hello.tsx` 의 미사용 등으로 막히면, App 라우트에서 빠졌을 뿐 파일 자체는 유효하므로 통과해야 함. 에러 시 해당 파일만 수정.)

- [ ] **Step 5: 전체 테스트 실행**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run
```
Expected: 신규 + 기존(디자인 시스템 컴포넌트) 테스트 전부 PASS.

- [ ] **Step 6: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/Home.tsx mobile/src/features/auth/DeepLinkListener.tsx mobile/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): wire auth routes + hydrate + deep-link listener into App

루트 가드(/ → home|login), /login·/auth/callback·/home(RequireAuth) 라우트,
앱 시작 시 authStore.hydrate(자동 로그인) + 401 핸들러, Capacitor appUrlOpen 딥링크 라우팅.
임시 Home(닉네임+로그아웃)은 Phase 1.4 에서 MainLayout 으로 교체.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: 최종 검증 + dev 루프 수동 확인 + 보고

**Files:** 없음 (검증/보고)

- [ ] **Step 1: 클라 전체 검증 (format/lint/test/build)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm format:check
pnpm lint
pnpm test:run
pnpm build
```
Expected: 4개 모두 통과. (format:check 실패 시 `pnpm format` 후 재커밋.)

- [ ] **Step 2: 서버 전체 테스트**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server
./gradlew test
```
Expected: 전체 PASS (신규 AuthCallbackRelayTest, DevAuthControllerTest 포함).

- [ ] **Step 3: dev 로그인 루프 수동 검증 (브라우저)**

서버 + 클라 둘 다 띄워서 실제 클릭 검증:
```bash
# 터미널 A
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server && ./gradlew bootRun
# 터미널 B
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile && pnpm dev
```
브라우저 `http://localhost:5173` 접속 후 확인:
1. `/` → 토큰 없으니 `/login` 으로 리다이렉트, 워드마크/슬로건/4버튼 + "테스트 로그인" 노출
2. "테스트 로그인 (개발용)" 클릭 → `/home` 이동, "개발테스터님" 표시
3. 새로고침 → `/home` 유지 (Preferences hydrate = 자동 로그인 동작)
4. "로그아웃" → `/login` 복귀, 새로고침해도 `/login` 유지

> 이 단계는 사용자(또는 실행 에이전트)가 눈으로 확인. 실제 카카오/네이버/구글 라운드트립은 실 client_id + provider 콘솔 redirect_uri 화이트리스트 등록 후 실기기에서 별도 검증(인프라 체크리스트).

- [ ] **Step 4: CLAUDE.md 체크리스트 갱신 + 커밋**

루트 `CLAUDE.md` 의 "모바일 (Vite + React + Capacitor — 마이그레이션 Phase 1)" 항목에서 아래를 `[x]` 로:
- `[x] API 클라이언트 + Zustand stores + TanStack Query` (TanStack은 Provider 배선까지 — queries 는 1.4)
- OAuth 항목은 부분 완료 주석: `- [~] OAuth 4종 (kakao/naver/google 릴레이 배선 완료, Apple·실키 라운드트립 후속)`

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: mark Phase 1.3 (API+auth+OAuth scaffolding) progress in CLAUDE.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: 결과 보고**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git log --oneline -14
```
기대 결과:
- Phase 1.3 커밋 ~11개 (Task 0 deps, Task 1 릴레이, Task 2 dev-login, Task 3-10 클라, Task 11 docs)
- `mobile/src/shared/api/` (http/types/nthingApi), `shared/stores/authStore`, `features/auth/` (oauth/deepLink/guards/DeepLinkListener), `routes/` (Login/AuthCallback/Home)
- 서버: 릴레이 스킴 설정값화 + dev-login
- dev 로그인 루프가 브라우저에서 클릭으로 동작
- 다음: **Phase 1.4 — Main Shell + 7화면** (MainLayout + splits/uploads API + TanStack queries)

---

## Phase 1.3 완료 후 다음 단계

- **Phase 1.4 — Main Shell + Screens**: MainLayout(AppBar+BottomNav+FAB) + Home/Map/Profile/Create/Detail/List 7화면, `nthingApi` 에 splits/uploads 추가, TanStack Query 키 컨벤션(spec 참고)으로 목록/상세/mutation 배선. 임시 `Home.tsx` 교체.
- **Phase 1.5 — 네이티브 통합**: 카카오맵 JS SDK, Camera, Geolocation, S3 presigned 업로드.
- **OAuth 실값 단계 (인프라)**: 도메인/HTTPS 확보 → provider 콘솔에 `{https}/api/auth/callback/{provider}` redirect_uri 등록 + 실 client_id 주입 + 서버 `*.redirect-uri` 를 릴레이 경로로 정렬 → 실기기 라운드트립. Apple Sign in 배선.
