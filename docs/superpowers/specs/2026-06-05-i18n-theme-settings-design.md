# i18n + 다크/라이트 테마 설정 — 설계 문서

- 날짜: 2026-06-05
- 영역: 영역 2 (모바일 클라이언트 `mobile/`)
- 상태: 설계 승인됨, 구현 대기

## 목표

하드코딩된 한글 UI 레이블을 전부 다국어(i18n) 처리하고, 앱 설정 화면에서
**테마(라이트/다크/시스템)** 와 **언어(한국어/영어/일본어/중국어 간체)** 를
전환할 수 있게 한다.

## 의사결정 요약

| 항목 | 결정 |
|------|------|
| i18n 라이브러리 | `react-i18next` + `i18next` + `i18next-browser-languagedetector` |
| 지원 언어 | `ko`, `en`, `ja`, `zh`(간체, zh-CN) |
| 기본 언어 | 디바이스 로케일 자동 감지 → 미지원 시 `ko` 폴백 |
| 테마 모드 | Light / Dark / System (시스템은 `prefers-color-scheme` 실시간 추종) |
| 번역 범위 | 사용자가 읽는 모든 UI 텍스트(레이블·버튼·empty/error/loading·toast·푸시 카피·검증 메시지). **코드 주석/콘솔 로그는 한글 유지** |
| 설정 위치 | 신규 `/settings` 풀스크린 라우트. Profile의 기존 톱니 아이콘에서 진입. 기존 `근처 알림` 토글을 이곳으로 이전 |
| 영어/일본어/중국어 번역 | AI 번역으로 제공(전문 검수 아님 — 추후 원어민 검수 여지) |

## 아키텍처

### 1. i18n 인프라

```
src/shared/i18n/
├── index.ts                 # i18next 초기화 + 언어 변경 시 <html lang> 동기화
├── config.ts                # 지원 언어 목록/타입, Preferences 키 상수
└── locales/
    ├── ko.json              # 원본(현재 카피 그대로) — source of truth
    ├── en.json
    ├── ja.json
    └── zh.json
```

- **네임스페이스(키 그룹)**: 단일 `translation` 네임스페이스 안에서 영역별 top-level 키로 구성:
  `common`, `nav`, `login`, `home`, `map`, `profile`, `settings`, `create`,
  `detail`, `list`, `catalog`, `states`, `toast`, `push`, `validation`.
- **감지 순서**(languagedetector custom): 저장된 선택값(Capacitor Preferences `nthing.lang`)
  → 디바이스 로케일(`navigator.language` / Capacitor `Device` 불필요, web/native 모두 navigator로 충분)
  → 폴백 `ko`. 미지원 로케일(`fr` 등)은 `ko`로 떨어진다.
- **초기화 시점**: `main.tsx`에서 React 렌더 이전에 `i18n` import(동기 init).
  사전 번들된 JSON을 `resources`로 정적 import → 네트워크 지연/플래시 없음.
- **동적 문자열**: 보간(interpolation) 사용.
  예) `home.nearbyPushBody: "{{name}}님이 {{distance}}m 근처에서 {{title}}을 반띵하길 원해요"`.
- **복수 처리**: 인원/수량은 i18next plural 규칙 사용
  (ko/ja/zh는 plural 형태가 동일하므로 `_other`만, en은 `_one/_other`).
  예) `detail.peopleCount`.

### 2. 테마 시스템

```
src/shared/stores/themeStore.ts     # Zustand: mode + setMode + applyTheme + hydrate
```

- 상태: `mode: 'light' | 'dark' | 'system'`, Preferences 키 `nthing.theme`에 영속.
- `applyTheme()`:
  - `light` → `documentElement.classList.remove('dark')`
  - `dark` → `add('dark')`
  - `system` → `matchMedia('(prefers-color-scheme: dark)').matches`에 따라 toggle,
    그리고 `change` 리스너 등록으로 OS 변경 실시간 반영. `system` 외 모드로 바뀌면 리스너 해제.
- **하이드레이션**: `App.tsx`의 auth `hydrate`와 함께, 첫 페인트 전에 저장된 모드를 적용해
  다크 모드 플래시(FOUC)를 방지한다. (`isHydrated` 게이트 활용)
- Tailwind는 이미 `darkMode: 'class'`로 설정되어 추가 설정 불필요.

### 3. 설정 화면

- 신규 라우트 `/settings` — 풀스크린(셸 없음), 자체 `AppBar` + back 버튼(CreateSplit 패턴 동일).
  `App.tsx`에 `RequireAuth` 하위로 추가.
- Profile의 톱니 아이콘 `onClick → navigate('/settings')`로 활성화.
- 구성(각 섹션은 `Card`):
  1. **언어**: 4개 옵션 라디오 리스트(선택 항목에 체크 아이콘). 선택 즉시
     `i18n.changeLanguage(lng)` + Preferences 저장.
  2. **테마**: Light / Dark / System 라디오 리스트(또는 세그먼트). 선택 즉시 store `setMode`.
  3. **알림**(native 전용): 기존 `근처 알림` 토글 이전. 로직(`setNearbyAlerts`, Preferences
     `nthing.push.nearby`)은 그대로, 위치만 이동.

### 4. 문자열 마이그레이션 대상

사용자 노출 한글이 있는 파일을 영역별로 처리(주석/콘솔 로그 제외):

- 라우트: `Login`, `Home`, `Map`, `Profile`, `CreateSplit`, `SplitDetail`,
  `SplitList`, `Catalog`, `AuthCallback`, `MainLayout`
- 공용 컴포넌트: `AppBar`(기본/aria), `BottomNav`, `Badge`, `states/EmptyState`,
  `states/ErrorState`, `states/LoadingState`, `Toaster`
- 기능: `notifications/PushPrimingSheet`, `notifications/pushService`(toast),
  `notifications/usePushPriming`, `auth/oauth`(에러 toast), `auth/guards`,
  `location/useEnsureLocation`, `upload/imagePicker`(에러)
- 스토어/유틸 중 사용자 노출 텍스트: `toastStore`, `authStore`,
  `lib/queryClient`(에러 메시지), `api/http`(사용자 노출 에러), `lib/format`(상대시간 등 — 로케일 의존 표현은 t() 또는 Intl로)

> 스토어/모듈 등 React 훅을 쓸 수 없는 곳에서는 `i18n.t(...)`(인스턴스 직접 호출)로 처리.

### 5. 테스트

- 단위: `themeStore`(모드 전환, system matchMedia 리스너 등록/해제), i18n init
  (감지·폴백), `Settings` 화면(언어 변경 시 DOM 텍스트 변화 + Preferences 저장, 테마 변경 시
  `documentElement` 클래스 변화).
- 기존 컴포넌트 테스트: 한글 리터럴을 단언하던 테스트는 기본 언어 `ko`로 i18n이 초기화된
  상태에서 동일 텍스트가 렌더되도록 유지(테스트 셋업 `src/test/setup.ts`에서 i18n 초기화 import).
  필요한 경우 `t()` 키 기반으로 단언을 갱신.

## 트레이드오프 / 리스크

- `react-i18next`는 런타임 의존성 2개 추가하지만 보간·복수·감지를 무료로 제공 — 4개 언어에 합당.
- 가장 큰 작업량은 ~25개 파일에 걸친 기계적 문자열 추출. 영역별로 나눠 각 파일을 리뷰 가능한
  단위로 유지한다.
- AI 번역(en/ja/zh)은 추후 원어민 검수 여지 — 키 구조는 유지되므로 값만 교체 가능.

## 범위 밖 (YAGNI)

- 우→좌(RTL) 언어, 통화/숫자 로케일 포맷 고도화, 번역 lazy-loading/원격 로딩, 언어별
  폰트 전환(Pretendard 유지). 추후 필요 시 별도 작업.
