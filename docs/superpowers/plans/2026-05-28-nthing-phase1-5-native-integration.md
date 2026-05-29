# Nthing Phase 1.5 — Native Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1.4가 placeholder/스텁으로 둔 3개 네이티브 기능을 실제로 연결한다 — 실 GPS(`@capacitor/geolocation`), 카카오맵 JS SDK(지도+핀+슬라이드업), 사진 촬영+S3 업로드(`@capacitor/camera`).

**Architecture:** 의존 순서로 쌓는다 — (1) `locationStore.request()`로 실 좌표 캡처 → MainLayout 진입 시 1회, (2) `kakaoLoader`(env 키로 SDK 동적 로드, 키 없으면 null→placeholder) + `KakaoMap` 래퍼 + `BottomSheet`로 Map 탭 실연동, (3) `pickImage`(카메라)+`uploadImage`(presign→S3 PUT)로 CreateSplit 사진 업로드. 모든 외부 의존(플러그인/SDK/fetch)은 테스트에서 모킹 → 브라우저 우선 검증, 기기 스모크는 후속.

**Tech Stack:** React 19 + Capacitor 8 (`@capacitor/geolocation`/`@capacitor/camera`) + KakaoMap JS SDK + TanStack Query 5 + Zustand 5 + Vitest/RTL. 서버 변경 없음.

---

## Scope & Decisions (먼저 읽을 것)

1. **범위 = 네이티브 3종** (사용자 확정): Geolocation, KakaoMap JS, Camera+S3. **Apple/실 OAuth 라운드트립은 범위 밖**(도메인+실키+redirect 화이트리스트 = infra 선행). 1.3 보류 상태 그대로 둠.
2. **dev = 실 S3** (사용자 AWS 설정됨): `signUpload`가 실 presigned URL 발급 → 브라우저에서 S3 `PUT`까지 로컬 검증.
3. **KakaoMap 키**: `VITE_KAKAOMAP_APP_KEY`(JavaScript 앱키, `mobile/.env.local`, gitignore). 키 없으면 placeholder로 graceful fallback(코드 동일). 콘솔 Web 도메인에 `http://localhost:5173` 등록 필요. **키 값은 코드/문서/커밋에 절대 넣지 않는다.**
4. **브라우저 우선 검증**: 플러그인 web fallback(camera=파일선택, geolocation=navigator) + KakaoMap JS(web) + 실 S3. 기기(iOS/Android) 스모크는 Task 11 체크리스트(별도, 네이티브 origin/권한 포함).
5. **스펙 대비 네이밍 미세조정**: 스펙의 `useImagePicker`는 React state가 필요 없어 순수 async 함수 `pickImage()`(`features/upload/imagePicker.ts`)로 둔다.

---

## ⚠️ 실행 환경 규칙 (모든 task 준수 — 매우 중요)

이 작업은 git **worktree**에서 진행한다. worktree 루트:
`/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration` (이하 `<WT>`)

- **메인 체크아웃 `/Users/mzc01-tngur1120/dev/toy/one-bite` 에서 절대 `cd`/git 실행 금지** (커밋이 main에 떨어져 오염됨 — 1.4때 실제 사고).
- pnpm 은 `pnpm --dir <WT>/mobile ...`, git 은 `git -C <WT> ...` 로 워크트리에 고정(현재 디렉토리 무관). `cd <WT>/mobile` 후 실행도 OK(인라인 실행 시). 단 `cd` 메인 루트는 금지.
- 커밋은 현재 브랜치 `worktree-phase1-5-native-integration` 에만.
- 각 task 커밋 후: `git -C <WT> log --oneline -1` 이 브랜치에 떨어졌는지, `git -C <WT> log --oneline -1 main` 이 안 바뀌었는지 확인 권장.

> 본 plan의 명령은 `pnpm --dir <WT>/mobile` / `git -C <WT>` 형태로 표기. `<WT>` = 위 경로.

---

## File Structure

### 신규 (Create)
- `mobile/src/features/location/useEnsureLocation.ts` (+ `.test.tsx`) — MainLayout 진입 시 1회 위치 요청 훅
- `mobile/src/features/map/kakaoLoader.ts` (+ `.test.ts`) — KakaoMap JS SDK 동적 로더 + 최소 타입
- `mobile/src/features/map/KakaoMap.tsx` (+ `.test.tsx`) — 지도 래퍼(핀/클릭/현재위치, 키 없으면 placeholder)
- `mobile/src/shared/components/BottomSheet.tsx` (+ `.test.tsx`) — 하단 슬라이드업 시트
- `mobile/src/features/upload/imagePicker.ts` (+ `.test.ts`) — `pickImage()` (@capacitor/camera, web fallback)
- `mobile/src/features/upload/uploadImage.ts` (+ `.test.ts`) — `uploadImage()` (signUpload → S3 PUT → publicUrl)

### 수정 (Modify)
- `mobile/src/env.d.ts` — `VITE_KAKAOMAP_APP_KEY?` 추가
- `mobile/src/shared/lib/env.ts` — `kakaoMapKey` 추가
- `mobile/src/shared/stores/locationStore.ts` (+ 기존 `.test.ts` 확장) — `request()` 추가
- `mobile/src/routes/MainLayout.tsx` (+ 기존 `.test.tsx` 보정) — `useEnsureLocation()` 호출
- `mobile/src/routes/Map.tsx` (+ `Map.test.tsx` 교체) — 실 지도
- `mobile/src/routes/CreateSplit.tsx` (+ `CreateSplit.test.tsx` 확장) — 사진 업로드
- `mobile/package.json` — `@capacitor/camera`/`@capacitor/geolocation`
- `mobile/ios/App/App/Info.plist`, `mobile/android/app/src/main/AndroidManifest.xml` — 권한 문구

### 서버: 변경 없음

### 공유 타입/시그니처 (모든 task 가 따른다 — 일관성 고정)

```ts
// shared/stores/locationStore.ts (확장 후)
type LocationState = {
  current: Coords | null;
  setCurrent: (coords: Coords) => void;
  request: () => Promise<boolean>;   // 성공 시 setCurrent+true, 실패/거부 시 current 유지+false
};

// shared/lib/env.ts (확장 후) — env.kakaoMapKey 추가

// features/map/kakaoLoader.ts
export type KakaoLatLng = object;
export type KakaoMapInstance = { setCenter: (latlng: KakaoLatLng) => void };
export type KakaoMarker = object;
export type KakaoMaps = {
  load: (cb: () => void) => void;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMapInstance }) => KakaoMarker;
  event: { addListener: (target: object, type: string, handler: () => void) => void };
};
export function loadKakaoMaps(key?: string): Promise<KakaoMaps | null>;

// features/map/KakaoMap.tsx
export type MapMarker = { id: number; lat: number; lng: number };
export function KakaoMap(props: { center: Coords; markers: MapMarker[]; onMarkerClick: (id: number) => void }): JSX.Element;

// shared/components/BottomSheet.tsx
export function BottomSheet(props: { open: boolean; onClose: () => void; children: ReactNode }): JSX.Element | null;

// features/upload/imagePicker.ts
export type PickedImage = { blob: Blob; contentType: 'image/jpeg' | 'image/png' | 'image/webp' };
export function pickImage(): Promise<PickedImage | null>;   // 취소 시 null

// features/upload/uploadImage.ts
export function uploadImage(image: PickedImage): Promise<string>;   // publicUrl 반환, 실패 시 throw
```

> **컨벤션**: 상대경로 import, `import { type X }`(verbatimModuleSyntax), enum 금지(erasableSyntaxOnly — 라이브러리 enum 값 사용은 OK), `noUnusedLocals/Parameters`, `no-explicit-any`(→ `unknown`/구체 타입), 테스트는 명시 vitest import + RTL. 컴포넌트 색상 className override 금지(cn=clsx). 커밋: Conventional Commits + `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` 트레일러.

---

## Task 0: Capacitor 플러그인 설치 + env 키 배선

**Files:**
- Modify: `mobile/package.json` (pnpm add 결과)
- Modify: `mobile/src/env.d.ts`
- Modify: `mobile/src/shared/lib/env.ts`

- [ ] **Step 1: 플러그인 설치 (Capacitor 8 라인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile add @capacitor/camera@^8 @capacitor/geolocation@^8
```
Expected: `package.json` dependencies 에 `@capacitor/camera`, `@capacitor/geolocation` 추가(메이저 8, `@capacitor/core ^8`과 일치). `^8` 태그가 없으면 버전 없이 설치 후 메이저 8 확인.

- [ ] **Step 2: 네이티브 셸 동기화**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile && npx cap sync
```
Expected: `Found N Capacitor plugins` 출력에 `@capacitor/camera`, `@capacitor/geolocation` 포함. (CocoaPods/Java 경고는 무방 — plugins 인식되면 OK.)

- [ ] **Step 3: `env.d.ts` 에 키 추가**

`mobile/src/env.d.ts` 의 `ImportMetaEnv` 에 한 줄 추가(기존 줄 유지):
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_KAKAO_REST_KEY?: string;
  readonly VITE_NAVER_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APPLE_CLIENT_ID?: string;
  readonly VITE_KAKAOMAP_APP_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 4: `env.ts` 에 `kakaoMapKey` 추가**

`mobile/src/shared/lib/env.ts` 전체 교체:
```ts
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  kakaoRestKey: import.meta.env.VITE_KAKAO_REST_KEY ?? '',
  naverClientId: import.meta.env.VITE_NAVER_CLIENT_ID ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  appleClientId: import.meta.env.VITE_APPLE_CLIENT_ID ?? '',
  kakaoMapKey: import.meta.env.VITE_KAKAOMAP_APP_KEY ?? '',
} as const;
```

- [ ] **Step 5: 타입체크 + 커밋**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile exec tsc -b
```
Expected: 0 errors.

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/package.json mobile/pnpm-lock.yaml mobile/src/env.d.ts mobile/src/shared/lib/env.ts mobile/ios mobile/android
git -C "$WT" commit -m "$(cat <<'EOF'
build(mobile): add capacitor camera/geolocation + VITE_KAKAOMAP_APP_KEY env

Phase 1.5 준비: 카메라/위치 플러그인 설치 + cap sync, env 에 kakaoMapKey 배선.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 1: locationStore.request() — 실 GPS 캡처

**Files:**
- Modify: `mobile/src/shared/stores/locationStore.ts`
- Test: `mobile/src/shared/stores/locationStore.test.ts` (기존 파일 확장)

- [ ] **Step 1: 실패 테스트 추가**

`locationStore.test.ts` 상단 import 아래에 `@capacitor/geolocation` 모킹 + 새 describe 추가. 파일 맨 위(기존 `import` 들 위)에 mock 을 두고, 기존 테스트는 유지:
```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
  },
}));

import { Geolocation } from '@capacitor/geolocation';
import { useLocationStore, DEFAULT_COORDS } from './locationStore';

const geo = Geolocation as unknown as Record<string, ReturnType<typeof vi.fn>>;
```
(기존 `import { useLocationStore, DEFAULT_COORDS } from './locationStore';` 와 `import { describe, it, expect, beforeEach } from 'vitest';` 가 이미 있으면 중복 제거하고 위 형태로 통합.)

기존 describe 아래에 추가:
```ts
describe('locationStore.request', () => {
  beforeEach(() => {
    useLocationStore.setState({ current: null });
    geo.checkPermissions.mockReset();
    geo.requestPermissions.mockReset();
    geo.getCurrentPosition.mockReset();
  });

  it('권한 granted + 위치 성공 → setCurrent 하고 true 반환', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'granted' });
    geo.getCurrentPosition.mockResolvedValue({ coords: { latitude: 37.1, longitude: 127.2 } });

    const ok = await useLocationStore.getState().request();

    expect(ok).toBe(true);
    expect(useLocationStore.getState().current).toEqual({ lat: 37.1, lng: 127.2 });
  });

  it('권한 prompt → requestPermissions granted 면 위치 캡처', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'prompt' });
    geo.requestPermissions.mockResolvedValue({ location: 'granted' });
    geo.getCurrentPosition.mockResolvedValue({ coords: { latitude: 1, longitude: 2 } });

    const ok = await useLocationStore.getState().request();

    expect(geo.requestPermissions).toHaveBeenCalled();
    expect(ok).toBe(true);
    expect(useLocationStore.getState().current).toEqual({ lat: 1, lng: 2 });
  });

  it('권한 거부 → false, current 유지(null)', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'denied' });
    geo.requestPermissions.mockResolvedValue({ location: 'denied' });

    const ok = await useLocationStore.getState().request();

    expect(ok).toBe(false);
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('getCurrentPosition 예외 → false, current 유지', async () => {
    geo.checkPermissions.mockResolvedValue({ location: 'granted' });
    geo.getCurrentPosition.mockRejectedValue(new Error('timeout'));

    const ok = await useLocationStore.getState().request();

    expect(ok).toBe(false);
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('DEFAULT_COORDS 는 서울시청 (회귀)', () => {
    expect(DEFAULT_COORDS).toEqual({ lat: 37.5665, lng: 126.978 });
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/shared/stores/locationStore.test.ts
```
Expected: FAIL — `request` 미존재(`getState().request` undefined).

- [ ] **Step 3: locationStore.ts 전체 교체**

`mobile/src/shared/stores/locationStore.ts`:
```ts
import { create } from 'zustand';
import { Geolocation } from '@capacitor/geolocation';

export type Coords = { lat: number; lng: number };

// GPS 미연동 기본 좌표(서울시청). request() 실패/거부 시 폴백으로 사용됨.
export const DEFAULT_COORDS: Coords = { lat: 37.5665, lng: 126.978 };

type LocationState = {
  current: Coords | null;
  setCurrent: (coords: Coords) => void;
  request: () => Promise<boolean>;
};

export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  setCurrent: (coords) => set({ current: coords }),
  request: async () => {
    try {
      let status = await Geolocation.checkPermissions();
      if (status.location !== 'granted') {
        status = await Geolocation.requestPermissions();
      }
      if (status.location !== 'granted') return false;
      const pos = await Geolocation.getCurrentPosition({ timeout: 10000 });
      set({ current: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      return true;
    } catch {
      return false;
    }
  },
}));
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/shared/stores/locationStore.test.ts
```
Expected: PASS (초기 null/ setCurrent/ DEFAULT 회귀 3 + request 5 = 8 tests). (기존 테스트 개수에 따라 합산.)

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/shared/stores/locationStore.ts mobile/src/shared/stores/locationStore.test.ts
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/stores): add locationStore.request() via @capacitor/geolocation

권한 확인/요청 후 현재 좌표 캡처 → setCurrent. 거부/실패 시 false + current 유지(DEFAULT 폴백).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: useEnsureLocation + MainLayout 진입 시 1회 요청

**Files:**
- Create: `mobile/src/features/location/useEnsureLocation.ts`
- Test: `mobile/src/features/location/useEnsureLocation.test.tsx`
- Modify: `mobile/src/routes/MainLayout.tsx`
- Modify: `mobile/src/routes/MainLayout.test.tsx` (훅 모킹 추가)

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/location/useEnsureLocation.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocationStore } from '../../shared/stores/locationStore';
import { useEnsureLocation } from './useEnsureLocation';

describe('useEnsureLocation', () => {
  beforeEach(() => {
    useLocationStore.setState({ current: null });
    vi.restoreAllMocks();
  });

  it('current 가 없으면 마운트 시 request() 를 1회 호출', () => {
    const spy = vi.spyOn(useLocationStore.getState(), 'request').mockResolvedValue(true);
    renderHook(() => useEnsureLocation());
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('current 가 이미 있으면 request() 를 호출하지 않음', () => {
    useLocationStore.setState({ current: { lat: 1, lng: 2 } });
    const spy = vi.spyOn(useLocationStore.getState(), 'request').mockResolvedValue(true);
    renderHook(() => useEnsureLocation());
    expect(spy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/location/useEnsureLocation.test.tsx
```
Expected: FAIL — `./useEnsureLocation` 없음.

- [ ] **Step 3: useEnsureLocation.ts 구현**

`mobile/src/features/location/useEnsureLocation.ts`:
```ts
import { useEffect, useRef } from 'react';
import { useLocationStore } from '../../shared/stores/locationStore';

// 인증된 탭 진입점(MainLayout)에서 1회 호출. current 가 비어 있을 때만 실 위치를 요청한다.
export function useEnsureLocation(): void {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (useLocationStore.getState().current) return;
    void useLocationStore.getState().request();
  }, []);
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/location/useEnsureLocation.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: MainLayout 에 훅 배선 + 테스트 보정**

`mobile/src/routes/MainLayout.tsx` 전체 교체(기존 + `useEnsureLocation()` 한 줄):
```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../shared/components/BottomNav';
import { Fab } from '../shared/components/Fab';
import { useEnsureLocation } from '../features/location/useEnsureLocation';

type Tab = 'home' | 'map' | 'profile';

const PATH_BY_TAB: Record<Tab, string> = {
  home: '/home',
  map: '/map',
  profile: '/profile',
};

function tabFromPath(pathname: string): Tab {
  if (pathname.startsWith('/map')) return 'map';
  if (pathname.startsWith('/profile')) return 'profile';
  return 'home';
}

export function MainLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = tabFromPath(pathname);
  const showFab = current === 'home' || current === 'map';

  useEnsureLocation();

  return (
    <div className="relative mx-auto flex h-screen max-w-md flex-col bg-white dark:bg-gray-950">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      {showFab && (
        <Fab
          label="반띵 등록하기"
          onClick={() => navigate('/splits/new')}
          className="absolute bottom-20 right-4"
        />
      )}
      <BottomNav current={current} onSelect={(tab) => navigate(PATH_BY_TAB[tab])} />
    </div>
  );
}
```

`mobile/src/routes/MainLayout.test.tsx` 의 import 영역 최상단(다른 import 보다 먼저)에 훅 모킹을 추가(실 위치 요청이 테스트에서 안 돌게):
```tsx
import { vi } from 'vitest';
vi.mock('../features/location/useEnsureLocation', () => ({ useEnsureLocation: vi.fn() }));
```
(기존 `import { describe, it, expect } from 'vitest';` 가 있으면 `vi` 를 합쳐 `import { describe, it, expect, vi } from 'vitest';` 로 만들고, `vi.mock(...)` 한 줄을 import 들 바로 아래에 둔다. 나머지 테스트 본문은 그대로.)

- [ ] **Step 6: 테스트 실행 (pass) — MainLayout 회귀 포함**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/routes/MainLayout.test.tsx src/features/location/useEnsureLocation.test.tsx
```
Expected: PASS (MainLayout 3 + useEnsureLocation 2).

- [ ] **Step 7: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/features/location/useEnsureLocation.ts mobile/src/features/location/useEnsureLocation.test.tsx mobile/src/routes/MainLayout.tsx mobile/src/routes/MainLayout.test.tsx
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/location): request real location once on MainLayout entry

useEnsureLocation: current 비어 있으면 마운트 시 1회 locationStore.request().
Home/Map/Create 가 실 좌표를 쓰게 됨(거부 시 DEFAULT_COORDS 폴백 유지).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: KakaoMap JS SDK 로더 (`features/map/kakaoLoader.ts`)

**Files:**
- Create: `mobile/src/features/map/kakaoLoader.ts`
- Test: `mobile/src/features/map/kakaoLoader.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/map/kakaoLoader.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadKakaoMaps } from './kakaoLoader';

describe('loadKakaoMaps', () => {
  beforeEach(() => {
    document.getElementById('kakao-maps-sdk')?.remove();
    delete (window as { kakao?: unknown }).kakao;
  });

  it('키가 없으면 스크립트 없이 null 반환', async () => {
    await expect(loadKakaoMaps('')).resolves.toBeNull();
    expect(document.getElementById('kakao-maps-sdk')).toBeNull();
  });

  it('window.kakao.maps 가 이미 있으면 그걸 반환(스크립트 추가 안 함)', async () => {
    const maps = { sentinel: true } as unknown;
    (window as unknown as { kakao: { maps: unknown } }).kakao = { maps };
    await expect(loadKakaoMaps('KEY')).resolves.toBe(maps);
    expect(document.getElementById('kakao-maps-sdk')).toBeNull();
  });

  it('키가 있으면 SDK 스크립트 주입 + onload→load 콜백 후 maps 반환', async () => {
    const promise = loadKakaoMaps('KEY123');
    const script = document.getElementById('kakao-maps-sdk') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.src).toContain('dapi.kakao.com');
    expect(script.src).toContain('appkey=KEY123');
    expect(script.src).toContain('autoload=false');

    (window as unknown as { kakao: { maps: { load: (cb: () => void) => void } } }).kakao = {
      maps: { load: (cb: () => void) => cb() },
    };
    script.onload?.(new Event('load'));

    await expect(promise).resolves.toBeTruthy();
  });

  it('스크립트 로드 실패(onerror) → null', async () => {
    const promise = loadKakaoMaps('KEY123');
    const script = document.getElementById('kakao-maps-sdk') as HTMLScriptElement;
    script.onerror?.(new Event('error'));
    await expect(promise).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/map/kakaoLoader.test.ts
```
Expected: FAIL — `./kakaoLoader` 없음.

- [ ] **Step 3: kakaoLoader.ts 구현**

`mobile/src/features/map/kakaoLoader.ts`:
```ts
import { env } from '../../shared/lib/env';

export type KakaoLatLng = object;
export type KakaoMapInstance = { setCenter: (latlng: KakaoLatLng) => void };
export type KakaoMarker = object;
export type KakaoMaps = {
  load: (cb: () => void) => void;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMapInstance }) => KakaoMarker;
  event: { addListener: (target: object, type: string, handler: () => void) => void };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const SCRIPT_ID = 'kakao-maps-sdk';

// JS SDK 동적 로드. 키 없으면(또는 로드 실패) null 반환 → 호출부는 placeholder 로 폴백.
export function loadKakaoMaps(key: string = env.kakaoMapKey): Promise<KakaoMaps | null> {
  return new Promise((resolve) => {
    if (!key) {
      resolve(null);
      return;
    }
    if (window.kakao?.maps) {
      resolve(window.kakao.maps);
      return;
    }
    const onReady = () => window.kakao!.maps.load(() => resolve(window.kakao!.maps));
    const onError = () => resolve(null);

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', onError);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = onReady;
    script.onerror = onError;
    document.head.appendChild(script);
  });
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/map/kakaoLoader.test.ts
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/features/map/kakaoLoader.ts mobile/src/features/map/kakaoLoader.test.ts
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/map): add KakaoMap JS SDK dynamic loader

env 키로 sdk.js 1회 주입(autoload=false → maps.load). 키 없음/로드 실패 시 null(→placeholder).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: BottomSheet 컴포넌트 (`shared/components/BottomSheet.tsx`)

**Files:**
- Create: `mobile/src/shared/components/BottomSheet.tsx`
- Test: `mobile/src/shared/components/BottomSheet.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/shared/components/BottomSheet.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('open=false 면 아무것도 렌더하지 않음', () => {
    const { container } = render(
      <BottomSheet open={false} onClose={() => {}}>
        <p>내용</p>
      </BottomSheet>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('open=true 면 children 렌더', () => {
    render(
      <BottomSheet open onClose={() => {}}>
        <p>시트내용</p>
      </BottomSheet>,
    );
    expect(screen.getByText('시트내용')).toBeInTheDocument();
  });

  it('backdrop(닫기) 클릭 시 onClose 호출', async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <p>x</p>
      </BottomSheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/shared/components/BottomSheet.test.tsx
```
Expected: FAIL — `./BottomSheet` 없음.

- [ ] **Step 3: BottomSheet.tsx 구현**

`mobile/src/shared/components/BottomSheet.tsx`:
```tsx
import { type ReactNode } from 'react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative rounded-t-xl bg-white p-4 shadow-overlay dark:bg-gray-900">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/shared/components/BottomSheet.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/shared/components/BottomSheet.tsx mobile/src/shared/components/BottomSheet.test.tsx
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/components): add BottomSheet (slide-up sheet + backdrop close)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: KakaoMap 래퍼 (`features/map/KakaoMap.tsx`)

**Files:**
- Create: `mobile/src/features/map/KakaoMap.tsx`
- Test: `mobile/src/features/map/KakaoMap.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/map/KakaoMap.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('./kakaoLoader', () => ({ loadKakaoMaps: vi.fn() }));

import { loadKakaoMaps } from './kakaoLoader';
import { KakaoMap } from './KakaoMap';

const loadMock = loadKakaoMaps as unknown as ReturnType<typeof vi.fn>;

describe('KakaoMap', () => {
  beforeEach(() => loadMock.mockReset());

  it('로더가 null 이면 placeholder 렌더', async () => {
    loadMock.mockResolvedValue(null);
    render(<KakaoMap center={{ lat: 37.5, lng: 127 }} markers={[]} onMarkerClick={vi.fn()} />);
    expect(await screen.findByText('지도를 불러올 수 없어요')).toBeInTheDocument();
  });

  it('로더 성공 시 Map/Marker 생성 + 핀 클릭 → onMarkerClick(id)', async () => {
    const listeners: Array<() => void> = [];
    const fakeMaps = {
      load: (cb: () => void) => cb(),
      LatLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
      Map: vi.fn(() => ({ setCenter: vi.fn() })),
      Marker: vi.fn(() => ({})),
      event: {
        addListener: vi.fn((_t: object, _type: string, h: () => void) => {
          listeners.push(h);
        }),
      },
    };
    loadMock.mockResolvedValue(fakeMaps);
    const onMarkerClick = vi.fn();

    render(
      <KakaoMap
        center={{ lat: 37.5, lng: 127 }}
        markers={[{ id: 7, lat: 37.5, lng: 127 }]}
        onMarkerClick={onMarkerClick}
      />,
    );

    await waitFor(() => expect(fakeMaps.Map).toHaveBeenCalled());
    expect(fakeMaps.Marker).toHaveBeenCalledTimes(2); // 현재위치 1 + split 1
    expect(listeners).toHaveLength(1);
    listeners[0]();
    expect(onMarkerClick).toHaveBeenCalledWith(7);
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/map/KakaoMap.test.tsx
```
Expected: FAIL — `./KakaoMap` 없음.

- [ ] **Step 3: KakaoMap.tsx 구현**

`mobile/src/features/map/KakaoMap.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadKakaoMaps } from './kakaoLoader';
import { type Coords } from '../../shared/stores/locationStore';

export type MapMarker = { id: number; lat: number; lng: number };

type KakaoMapProps = {
  center: Coords;
  markers: MapMarker[];
  onMarkerClick: (id: number) => void;
};

export function KakaoMap({ center, markers, onMarkerClick }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const maps = await loadKakaoMaps();
      if (cancelled) return;
      const el = containerRef.current;
      if (!maps || !el) {
        setFailed(true);
        return;
      }
      const map = new maps.Map(el, {
        center: new maps.LatLng(center.lat, center.lng),
        level: 5,
      });
      // 현재 위치 마커
      new maps.Marker({ position: new maps.LatLng(center.lat, center.lng), map });
      // split 핀
      for (const m of markers) {
        const marker = new maps.Marker({ position: new maps.LatLng(m.lat, m.lng), map });
        maps.event.addListener(marker, 'click', () => onMarkerClick(m.id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, markers, onMarkerClick]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <MapPin className="size-10 text-gray-300" aria-hidden />
        <p className="text-body text-gray-500 dark:text-gray-400">지도를 불러올 수 없어요</p>
        <p className="text-caption text-gray-400">카카오맵 키 설정 후 다시 시도해 주세요</p>
      </div>
    );
  }
  return <div ref={containerRef} className="size-full" data-testid="kakao-map" />;
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/map/KakaoMap.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/features/map/KakaoMap.tsx mobile/src/features/map/KakaoMap.test.tsx
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/map): add KakaoMap wrapper (markers + current location + click)

로더 성공 시 지도 생성 + 현재위치/split 마커, 핀 클릭 → onMarkerClick(id). 로더 null → placeholder.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Map 탭 실연동 (`routes/Map.tsx` 교체)

**Files:**
- Modify (전체 교체): `mobile/src/routes/Map.tsx`
- Modify (전체 교체): `mobile/src/routes/Map.test.tsx`

- [ ] **Step 1: 실패 테스트 작성 (기존 placeholder 테스트 교체)**

`mobile/src/routes/Map.test.tsx` 전체 교체:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/splits/queries', () => ({ useSplits: vi.fn() }));
vi.mock('../features/map/KakaoMap', () => ({
  KakaoMap: ({
    markers,
    onMarkerClick,
  }: {
    markers: Array<{ id: number }>;
    onMarkerClick: (id: number) => void;
  }) => (
    <div>
      {markers.map((m) => (
        <button key={m.id} onClick={() => onMarkerClick(m.id)}>
          pin-{m.id}
        </button>
      ))}
    </div>
  ),
}));

import { useSplits } from '../features/splits/queries';
import { Map } from './Map';

const useSplitsMock = useSplits as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 7, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5, longitude: 127, address: '역삼동', status: 'WAITING',
  author: { id: 1, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-28T10:00:00', participants: [], currentParticipants: 1, distanceKm: 0.3,
};

function renderMap() {
  return render(
    <MemoryRouter>
      <Map />
    </MemoryRouter>,
  );
}

describe('Map', () => {
  beforeEach(() => useSplitsMock.mockReset());

  it('로딩 중에는 로딩 상태', () => {
    useSplitsMock.mockReturnValue({ isPending: true });
    renderMap();
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();
  });

  it('핀 클릭 → BottomSheet 에 SplitCard + 반띵할게요', async () => {
    useSplitsMock.mockReturnValue({ isPending: false, isError: false, data: { content: [SPLIT] } });
    renderMap();
    await userEvent.click(screen.getByRole('button', { name: 'pin-7' }));
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '반띵할게요' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/routes/Map.test.tsx
```
Expected: FAIL — 현재 Map 은 placeholder("지도는 곧 제공돼요")라 핀/BottomSheet 미존재.

- [ ] **Step 3: Map.tsx 전체 교체**

`mobile/src/routes/Map.tsx`:
```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { BottomSheet } from '../shared/components/BottomSheet';
import { SplitCard } from '../features/splits/SplitCard';
import { KakaoMap, type MapMarker } from '../features/map/KakaoMap';
import { useSplits } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';

export function Map() {
  const navigate = useNavigate();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;
  const query = useSplits({ lat: coords.lat, lng: coords.lng, radiusKm: 3 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const splits = query.data?.content ?? [];
  const markers: MapMarker[] = useMemo(
    () => splits.map((s) => ({ id: s.id, lat: s.latitude, lng: s.longitude })),
    [splits],
  );
  const selected = splits.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <AppBar title="지도" />
      <div className="relative flex-1">
        {query.isPending ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState message="반띵을 불러오지 못했어요" onRetry={() => void query.refetch()} />
        ) : (
          <KakaoMap center={coords} markers={markers} onMarkerClick={setSelectedId} />
        )}
      </div>

      <BottomSheet open={selected !== null} onClose={() => setSelectedId(null)}>
        {selected && (
          <div className="flex flex-col gap-3">
            <SplitCard split={selected} />
            <Button fullWidth onClick={() => navigate(`/splits/${selected.id}`)}>
              반띵할게요
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/routes/Map.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/routes/Map.tsx mobile/src/routes/Map.test.tsx
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/routes): wire real KakaoMap into Map tab (pins + slide-up)

현재위치 중심 + useSplits 핀, 핀 탭 → BottomSheet(SplitCard + 반띵할게요 → 상세).
키 없으면 KakaoMap 내부 placeholder.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 사진 선택 (`features/upload/imagePicker.ts`)

**Files:**
- Create: `mobile/src/features/upload/imagePicker.ts`
- Test: `mobile/src/features/upload/imagePicker.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/upload/imagePicker.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Prompt: 'PROMPT' },
}));

import { Camera } from '@capacitor/camera';
import { pickImage } from './imagePicker';

const getPhoto = (Camera as unknown as { getPhoto: ReturnType<typeof vi.fn> }).getPhoto;

describe('pickImage', () => {
  beforeEach(() => {
    getPhoto.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('사진 선택 → blob + contentType 반환', async () => {
    getPhoto.mockResolvedValue({ webPath: 'blob:http://x/abc', format: 'jpeg' });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      blob: async () => new Blob(['x'], { type: 'image/jpeg' }),
    });
    const result = await pickImage();
    expect(result?.contentType).toBe('image/jpeg');
    expect(result?.blob).toBeInstanceOf(Blob);
  });

  it('취소(plugin throw) → null', async () => {
    getPhoto.mockRejectedValue(new Error('User cancelled photos app'));
    expect(await pickImage()).toBeNull();
  });

  it('webPath 없으면 null', async () => {
    getPhoto.mockResolvedValue({ format: 'jpeg' });
    expect(await pickImage()).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/upload/imagePicker.test.ts
```
Expected: FAIL — `./imagePicker` 없음.

- [ ] **Step 3: imagePicker.ts 구현**

`mobile/src/features/upload/imagePicker.ts`:
```ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export type PickedImage = { blob: Blob; contentType: 'image/jpeg' | 'image/png' | 'image/webp' };

const ALLOWED: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

function normalizeType(t: string): PickedImage['contentType'] {
  return ALLOWED.includes(t) ? (t as PickedImage['contentType']) : 'image/jpeg';
}

// 카메라/갤러리에서 사진 1장 선택. 취소/실패 시 null. (web fallback = 파일선택)
export async function pickImage(): Promise<PickedImage | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
    });
    if (!photo.webPath) return null;
    const res = await fetch(photo.webPath);
    const blob = await res.blob();
    return { blob, contentType: normalizeType(blob.type) };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/upload/imagePicker.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/features/upload/imagePicker.ts mobile/src/features/upload/imagePicker.test.ts
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/upload): add pickImage (@capacitor/camera, web fallback)

카메라/갤러리 → blob + contentType. 취소/실패 시 null. JPEG 0.85.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: S3 업로드 (`features/upload/uploadImage.ts`)

**Files:**
- Create: `mobile/src/features/upload/uploadImage.ts`
- Test: `mobile/src/features/upload/uploadImage.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/upload/uploadImage.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../shared/api/nthingApi', () => ({ nthingApi: { signUpload: vi.fn() } }));

import { nthingApi } from '../../shared/api/nthingApi';
import { uploadImage } from './uploadImage';

const signUpload = (nthingApi as unknown as { signUpload: ReturnType<typeof vi.fn> }).signUpload;

describe('uploadImage', () => {
  beforeEach(() => {
    signUpload.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it('signUpload → S3 PUT → publicUrl 반환', async () => {
    signUpload.mockResolvedValue({
      uploadUrl: 'https://s3/put?sig',
      publicUrl: 'https://s3/img.jpg',
      key: 'k',
      expiresInSeconds: 300,
    });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 });

    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const url = await uploadImage({ blob, contentType: 'image/jpeg' });

    expect(signUpload).toHaveBeenCalledWith({ contentType: 'image/jpeg', size: blob.size });
    const [putUrl, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(putUrl).toBe('https://s3/put?sig');
    expect((init as RequestInit).method).toBe('PUT');
    expect((init as RequestInit).body).toBe(blob);
    expect((init as RequestInit).headers).toMatchObject({ 'Content-Type': 'image/jpeg' });
    expect(url).toBe('https://s3/img.jpg');
  });

  it('PUT 실패(비2xx) → throw', async () => {
    signUpload.mockResolvedValue({
      uploadUrl: 'https://s3/put',
      publicUrl: 'https://s3/img.jpg',
      key: 'k',
      expiresInSeconds: 300,
    });
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 403 });
    await expect(
      uploadImage({ blob: new Blob(['x'], { type: 'image/jpeg' }), contentType: 'image/jpeg' }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/upload/uploadImage.test.ts
```
Expected: FAIL — `./uploadImage` 없음.

- [ ] **Step 3: uploadImage.ts 구현**

`mobile/src/features/upload/uploadImage.ts`:
```ts
import { nthingApi } from '../../shared/api/nthingApi';
import { type PickedImage } from './imagePicker';

// presigned URL 발급 → S3 PUT → publicUrl 반환. 실패 시 throw.
export async function uploadImage(image: PickedImage): Promise<string> {
  const { uploadUrl, publicUrl } = await nthingApi.signUpload({
    contentType: image.contentType,
    size: image.blob.size,
  });
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': image.contentType },
    body: image.blob,
  });
  if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);
  return publicUrl;
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/features/upload/uploadImage.test.ts
```
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/features/upload/uploadImage.ts mobile/src/features/upload/uploadImage.test.ts
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/upload): add uploadImage (signUpload → S3 PUT → publicUrl)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: CreateSplit 사진 업로드 배선 (`routes/CreateSplit.tsx`)

**Files:**
- Modify (전체 교체): `mobile/src/routes/CreateSplit.tsx`
- Modify (전체 교체): `mobile/src/routes/CreateSplit.test.tsx` (기존 3 + 사진 1 = 4 tests)

- [ ] **Step 1: 실패 테스트 작성 (기존 테스트 확장)**

`mobile/src/routes/CreateSplit.test.tsx` 전체 교체:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mutate = vi.fn();
vi.mock('../features/splits/queries', () => ({ useCreateSplit: vi.fn() }));
vi.mock('../features/upload/imagePicker', () => ({ pickImage: vi.fn() }));
vi.mock('../features/upload/uploadImage', () => ({ uploadImage: vi.fn() }));

import { useCreateSplit } from '../features/splits/queries';
import { pickImage } from '../features/upload/imagePicker';
import { uploadImage } from '../features/upload/uploadImage';
import { CreateSplit } from './CreateSplit';

const useCreateSplitMock = useCreateSplit as unknown as ReturnType<typeof vi.fn>;
const pickImageMock = pickImage as unknown as ReturnType<typeof vi.fn>;
const uploadImageMock = uploadImage as unknown as ReturnType<typeof vi.fn>;

function renderCreate() {
  return render(
    <MemoryRouter>
      <CreateSplit />
    </MemoryRouter>,
  );
}

async function fillRequired() {
  await userEvent.type(screen.getByLabelText('상품명'), '두쫀쿠');
  await userEvent.type(screen.getByLabelText('전체 가격'), '20000');
  await userEvent.type(screen.getByLabelText('전체 수량'), '4');
  await userEvent.type(screen.getByLabelText('나눌 인원'), '2');
  await userEvent.type(screen.getByLabelText('주소'), '역삼동 GS25');
}

describe('CreateSplit', () => {
  beforeEach(() => {
    mutate.mockReset();
    pickImageMock.mockReset();
    uploadImageMock.mockReset();
    useCreateSplitMock.mockReturnValue({ mutate, isPending: false });
  });

  it('필수 입력 전 제출 버튼은 비활성', () => {
    renderCreate();
    expect(screen.getByRole('button', { name: '내 반띵 올리기' })).toBeDisabled();
  });

  it('가격/인원 입력 시 1인당 미리보기를 계산', async () => {
    renderCreate();
    await userEvent.type(screen.getByLabelText('전체 가격'), '20000');
    await userEvent.type(screen.getByLabelText('나눌 인원'), '2');
    expect(screen.getByText('₩10,000')).toBeInTheDocument();
  });

  it('유효 입력 후 제출 시 createSplit 페이로드로 mutate (imageUrl 없음)', async () => {
    renderCreate();
    await fillRequired();
    const submit = screen.getByRole('button', { name: '내 반띵 올리기' });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      productName: '두쫀쿠',
      totalPrice: 20000,
      totalQty: 4,
      splitCount: 2,
      latitude: 37.5665,
      longitude: 126.978,
      address: '역삼동 GS25',
    });
  });

  it('사진 추가 → 업로드 성공 시 imageUrl 이 payload 에 포함', async () => {
    pickImageMock.mockResolvedValue({
      blob: new Blob(['x'], { type: 'image/jpeg' }),
      contentType: 'image/jpeg',
    });
    uploadImageMock.mockResolvedValue('https://s3/img.jpg');
    renderCreate();

    await userEvent.click(screen.getByRole('button', { name: /사진 추가/ }));
    await waitFor(() => expect(uploadImageMock).toHaveBeenCalled());

    await fillRequired();
    await userEvent.click(screen.getByRole('button', { name: '내 반띵 올리기' }));
    expect(mutate.mock.calls[0][0]).toMatchObject({ imageUrl: 'https://s3/img.jpg' });
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/routes/CreateSplit.test.tsx
```
Expected: FAIL — 사진 슬롯이 `disabled` 스텁이라 클릭해도 `pickImage` 미호출 → 4번째 테스트 실패.

- [ ] **Step 3: CreateSplit.tsx 전체 교체**

`mobile/src/routes/CreateSplit.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { TextField } from '../shared/components/TextField';
import { Button } from '../shared/components/Button';
import { useCreateSplit } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import { formatPrice } from '../shared/lib/format';
import { pickImage } from '../features/upload/imagePicker';
import { uploadImage } from '../features/upload/uploadImage';

export function CreateSplit() {
  const navigate = useNavigate();
  const create = useCreateSplit();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;

  const [productName, setProductName] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [splitCount, setSplitCount] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const priceNum = Number(totalPrice);
  const qtyNum = Number(totalQty);
  const countNum = Number(splitCount);
  const perPerson = priceNum > 0 && countNum >= 2 ? Math.floor(priceNum / countNum) : 0;

  const canSubmit =
    productName.trim() !== '' &&
    priceNum >= 1 &&
    qtyNum >= 1 &&
    countNum >= 2 &&
    address.trim() !== '' &&
    !uploading &&
    !create.isPending;

  const onPickPhoto = () => {
    void (async () => {
      const picked = await pickImage();
      if (!picked) return;
      setUploadError(null);
      setUploading(true);
      try {
        const url = await uploadImage(picked);
        setImageUrl(url);
      } catch {
        setUploadError('사진 업로드에 실패했어요. 다시 시도해 주세요.');
      } finally {
        setUploading(false);
      }
    })();
  };

  const onSubmit = () => {
    create.mutate(
      {
        productName: productName.trim(),
        totalPrice: priceNum,
        totalQty: qtyNum,
        splitCount: countNum,
        latitude: coords.lat,
        longitude: coords.lng,
        address: address.trim(),
        ...(imageUrl ? { imageUrl } : {}),
      },
      { onSuccess: (created) => navigate(`/splits/${created.id}`, { replace: true }) },
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <AppBar title="내 반띵 올리기" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* 사진 슬롯 — 탭하면 카메라/갤러리 → S3 업로드 */}
          <button
            type="button"
            onClick={onPickPhoto}
            disabled={uploading}
            className="relative flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="첨부 사진"
                className="absolute inset-0 size-full object-cover"
              />
            ) : uploading ? (
              <>
                <Loader2 className="size-7 animate-spin" aria-hidden />
                <span className="text-caption">업로드 중…</span>
              </>
            ) : (
              <>
                <Camera className="size-7" aria-hidden />
                <span className="text-caption">사진 추가</span>
              </>
            )}
          </button>
          {uploadError && <p className="text-caption text-error">{uploadError}</p>}

          <TextField
            label="상품명"
            value={productName}
            onChange={setProductName}
            placeholder="예: 두쫀쿠 4개입"
          />
          <TextField
            label="전체 가격"
            value={totalPrice}
            onChange={setTotalPrice}
            placeholder="20000"
            inputMode="numeric"
          />
          <TextField
            label="전체 수량"
            value={totalQty}
            onChange={setTotalQty}
            placeholder="4"
            inputMode="numeric"
          />
          <TextField
            label="나눌 인원"
            value={splitCount}
            onChange={setSplitCount}
            placeholder="2"
            inputMode="numeric"
            supportingText="최소 2명"
          />
          <TextField label="주소" value={address} onChange={setAddress} placeholder="만날 위치" />

          {/* 인당 가격 미리보기 — Card 대신 plain div (brand-surface 배경 충돌 회피) */}
          <div className="flex items-center justify-between rounded-lg bg-brand-surface p-4 dark:bg-brand-surface-dark">
            <span className="text-body text-gray-700 dark:text-gray-200">1인당 예상 가격</span>
            <span className="text-h1 text-brand dark:text-brand-dark-adj">
              {formatPrice(perPerson)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <Button fullWidth disabled={!canSubmit} loading={create.isPending} onClick={onSubmit}>
          내 반띵 올리기
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile test:run src/routes/CreateSplit.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/src/routes/CreateSplit.tsx mobile/src/routes/CreateSplit.test.tsx
git -C "$WT" commit -m "$(cat <<'EOF'
feat(mobile/routes): wire photo capture + S3 upload into CreateSplit

사진 슬롯 활성화 → pickImage → uploadImage(presign→PUT) → imageUrl 미리보기/포함.
업로드 중 비활성 + 실패 메시지. 사진 없이도 등록 가능(imageUrl 선택).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: 네이티브 권한 설정 (iOS Info.plist + Android manifest)

**Files:**
- Modify: `mobile/ios/App/App/Info.plist`
- Modify: `mobile/android/app/src/main/AndroidManifest.xml`

> 설정(config) task — 단위 테스트 없음. 검증 = 파일에 키 존재 + `npx cap sync` 성공. 실제 권한 다이얼로그는 기기 스모크(Task 11 체크리스트)에서 확인.

- [ ] **Step 1: iOS Info.plist 에 사용 설명 추가**

`mobile/ios/App/App/Info.plist` 를 읽고, 루트 `<dict>` 안(닫는 `</dict>` 바로 위)에 아래 키를 추가:
```xml
	<key>NSCameraUsageDescription</key>
	<string>반띵 상품 사진을 촬영하기 위해 카메라를 사용합니다.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>반띵 상품 사진을 첨부하기 위해 사진 보관함에 접근합니다.</string>
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>촬영한 사진을 저장하기 위해 사진 보관함에 접근합니다.</string>
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>근처 반띵을 보여주기 위해 현재 위치를 사용합니다.</string>
```

- [ ] **Step 2: Android manifest 에 권한 추가**

`mobile/android/app/src/main/AndroidManifest.xml` 를 읽고, `<manifest>` 의 자식으로(`<application>` 태그 바로 위)에 아래를 추가(이미 있는 권한은 중복 추가 금지):
```xml
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```
(Android 13+ 갤러리 직접 접근이 필요하면 `READ_MEDIA_IMAGES` 추가 — 단 시스템 picker(`CameraSource.Prompt`) 경로는 불필요하므로 생략.)

- [ ] **Step 3: 동기화 + 키 존재 확인**

Run:
```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
cd "$WT/mobile" && npx cap sync
grep -c "NSLocationWhenInUseUsageDescription\|NSCameraUsageDescription" "$WT/mobile/ios/App/App/Info.plist"
grep -c "ACCESS_FINE_LOCATION\|android.permission.CAMERA" "$WT/mobile/android/app/src/main/AndroidManifest.xml"
```
Expected: `cap sync` 성공, grep 카운트 ≥ 2 / ≥ 2.

- [ ] **Step 4: 커밋**

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add mobile/ios/App/App/Info.plist mobile/android/app/src/main/AndroidManifest.xml
git -C "$WT" commit -m "$(cat <<'EOF'
chore(mobile/native): add camera/location permission strings (iOS plist + Android manifest)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: 최종 검증 + 스모크 + 보고

**Files:** `CLAUDE.md` (체크리스트) 외 검증/보고.

- [ ] **Step 1: 클라 전체 검증**

Run:
```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
pnpm --dir "$WT/mobile" format:check
pnpm --dir "$WT/mobile" lint
pnpm --dir "$WT/mobile" test:run
pnpm --dir "$WT/mobile" build
```
Expected: 4개 모두 통과. 신규 테스트 합계(1.4의 115 + Task1 +5 + Task2 +2 + Task3 +4 + Task4 +3 + Task5 +2 + Task6 Map 교체(±0, 1→2) + Task7 +3 + Task8 +2 + Task9 +1) 등 전부 PASS. (format:check 실패 시 `pnpm --dir "$WT/mobile" format` 후 재커밋.)

- [ ] **Step 2: dev 브라우저 스모크 (수동)**

`mobile/.env.local` 에 `VITE_KAKAOMAP_APP_KEY` 가 있고 카카오 콘솔 Web 도메인에 `http://localhost:5173` 가 등록된 상태에서:
```bash
# 터미널 A
cd /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/server && ./gradlew bootRun
# 터미널 B
pnpm --dir /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration/mobile dev
```
브라우저 `http://localhost:5173` (dev-login):
1. **지도 탭** → 현재 위치(권한 허용 시) 중심 지도 렌더, 등록된 반띵이 있으면 핀 → 핀 탭 → 슬라이드업 카드 + "반띵할게요" → 상세. 키/도메인 미설정이면 "지도를 불러올 수 없어요" placeholder(정상).
2. **등록(FAB)** → "사진 추가" 탭 → 파일 선택 → "업로드 중…" → 썸네일 표시(실 S3 PUT, AWS 설정 필요) → 폼 작성 → 등록 → 상세에 이미지 표시.
3. 위치 권한 거부 시에도 앱 동작(서울 기본 좌표).

> 서버는 main(1.4 머지본)과 동일. AWS 프로필 없으면 업로드만 실패(나머지 정상) — 그 경우 EC2/기기에서 검증.

- [ ] **Step 3: 기기 스모크 체크리스트 (후속, 별도 — 코드 아님)**

- [ ] `npx cap sync` 후 `npx cap open ios` / `open android` → 시뮬레이터/기기 실행
- [ ] 카메라/위치 권한 다이얼로그(plist/manifest 문구) 실제 노출 확인
- [ ] 카카오 콘솔 Web 도메인에 네이티브 origin 등록(Android `https://localhost`, iOS `capacitor://localhost` — `capacitor://` 거부 시 Capacitor `server` 설정 또는 운영 도메인)
- [ ] 지도 제스처/줌, 카메라 촬영, GPS 정확도 확인

- [ ] **Step 4: CLAUDE.md 체크리스트 갱신 + 커밋**

루트 `CLAUDE.md` "모바일 (Vite + React + Capacitor — 마이그레이션 Phase 1)" 에서 아래 두 줄 교체:
```
- [ ] 카카오맵 JS SDK (Phase 1.5)
- [~] Capacitor Plugins: Preferences/Browser/App (Phase 1.3) — Camera/Geolocation는 1.5
```
→
```
- [x] 카카오맵 JS SDK (Phase 1.5) — 지도/핀/슬라이드업, 키 없으면 placeholder
- [x] Capacitor Plugins: Preferences/Browser/App (1.3) + Camera/Geolocation (1.5)
```

```bash
WT=/Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration
git -C "$WT" add CLAUDE.md
git -C "$WT" commit -m "$(cat <<'EOF'
docs: mark Phase 1.5 (native integration) complete in CLAUDE.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: 결과 보고**

Run:
```bash
git -C /Users/mzc01-tngur1120/dev/toy/one-bite/.claude/worktrees/phase1-5-native-integration log --oneline f018d3c..HEAD
```
기대: Phase 1.5 커밋 ~12개(spec + Task0~11). 다음: **기기 스모크 + OAuth 실값/도메인(infra) + 푸시(Phase 2)**.

---

## Self-Review

**1. Spec coverage** (spec 각 절 → task)
- §4.1 Geolocation(`request()` + 진입 1회) → Task 1, 2. ✔
- §4.2 KakaoMap(env 키, 로더, 래퍼, Map 탭, BottomSheet) → Task 0(env), 3, 4, 5, 6. ✔
- §4.3 Camera+Upload(pickImage, uploadImage, CreateSplit) → Task 7, 8, 9. ✔
- §4.4 Capacitor 셋업 + 권한 → Task 0(설치/sync), 10(plist/manifest). ✔
- §5 Data flow(위치→useSplits→지도/등록) → Task 2/6/9. ✔
- §6 Error handling(권한 거부→false, 키 없음→placeholder, 업로드 실패→메시지) → Task 1/5/9 테스트. ✔
- §7 Testing(브라우저 우선 + 기기 후속) → Task 11. ✔
- §2 Out of scope(Apple/OAuth, 푸시) → 본문 명시, task 없음(의도). ✔

**2. Placeholder scan**: "TBD/TODO/추후" 없음. 모든 step 에 실제 코드/명령/기대출력. Task 10 은 config(테스트 없음)이며 정확한 XML 스니펫 제공 — placeholder 아님. ✔

**3. Type consistency**: `Coords`(locationStore) / `request(): Promise<boolean>` / `env.kakaoMapKey` / `KakaoMaps`·`MapMarker`(kakaoLoader↔KakaoMap↔Map) / `PickedImage`(imagePicker↔uploadImage↔CreateSplit) / `nthingApi.signUpload({contentType,size})→{uploadUrl,publicUrl}`(1.4 PresignRequest/Response 와 일치) — task 간 명칭/시그니처 일관. ✔

**4. 리스크 메모(실행자)**:
- KakaoMap.tsx 의 `markers` 의존성으로 인한 재초기화: Map.tsx 가 `useMemo` 로 markers 안정화하므로 data 변화 시에만 재구성(허용). 기기에서 깜빡임 있으면 후속 polish.
- `pickImage` 의 catch 가 취소+실제오류를 모두 null 처리 — MVP 허용(이미지 없이 진행). 세분화는 후속.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-28-nthing-phase1-5-native-integration.md` (worktree branch `worktree-phase1-5-native-integration`, 위 spec `907dafd` 위에 스택).

Two execution options:

1. **Subagent-Driven (recommended)** — 태스크당 fresh subagent + 2단계 리뷰(spec→quality), 빠른 반복. (1.4 사고 예방으로 모든 명령이 `git -C`/`pnpm --dir` 워크트리 고정.)
2. **Inline Execution** — 이 세션에서 executing-plans 로 배치 실행 + 체크포인트.

어느 쪽으로 진행할까요?
