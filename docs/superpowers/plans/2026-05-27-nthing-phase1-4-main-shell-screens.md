# Nthing Phase 1.4 — Main Shell + Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1.3 의 auth/api foundation 위에 메인 셸(MainLayout = AppBar+BottomNav+FAB)과 7화면(Home/Map/Profile/CreateSplit/SplitDetail/SplitList)을 올려, "근처 반띵 조회 → 상세 → 참여/취소 → 등록 → 내/참여 목록" 의 핵심 루프를 React로 완성한다. 임시 `Home.tsx` 를 실제 셸로 교체.

**Architecture:** `nthingApi` 에 splits/uploads 메소드를 추가하고, `features/splits/queries.ts` 의 TanStack Query 훅(쿼리 키 팩토리 `splitKeys`)으로 목록/상세/mutation 을 배선한다. 화면은 `routes/` 에, 도메인 카드(`SplitCard`)와 훅은 `features/splits/` 에 둔다. 인증된 3탭은 `MainLayout` 아래 중첩 라우트(`<Outlet/>`)로, 풀스크린(등록/상세/목록)은 `RequireAuth` 단독 라우트로 배치. 위치는 `locationStore` 스텁(`current` 보관 + `DEFAULT_COORDS`)에서 읽고, **실제 GPS/카메라/S3 PUT/카카오맵은 Phase 1.5** 로 경계를 둔다.

**Tech Stack:** React 19 + React Router 7 + TanStack Query 5 + Zustand 5 + Tailwind 3.4 + lucide-react + Vitest/RTL. 서버는 변경 없음(기존 Spring Boot 계약 소비만).

---

## Scope & Decisions (반드시 먼저 읽을 것)

1. **서버 실제 계약이 `docs/api-spec.md` 와 다르다 — 서버를 정답으로 빌드한다.** 서버 코드(`SplitController.kt`/`SplitDto.kt`) 확인 결과:
   - **`GET /splits` 는 배열이 아니라 `PageResponse<SplitResponse>` 를 반환**하고 `page`/`size` 파라미터도 받는다. (api-spec 의 "bare array" 는 구버전)
   - **`POST /splits/{id}/join` 은 `{splitId,status,partnerName}` 가 아니라 갱신된 `SplitResponse` 전체**를 반환한다. (api-spec 구버전)
   - `SplitResponse` 에는 api-spec 에 없는 `participants[]`, `currentParticipants`, `distanceKm` 필드가 있고 `imageUrl` 은 nullable.
   → 타입과 API 메소드는 **서버 DTO 기준**으로 정의한다(아래 "공유 타입" 참고). api-spec 갱신은 후속 docs 작업으로 이월.
2. **Phase 1.5 로 미루는 네이티브(이번 범위 밖, placeholder 로 둠)**:
   - 카카오맵 JS SDK 실연동 → `Map.tsx` 는 "곧 제공" placeholder 탭.
   - `@capacitor/camera` 촬영 / `@capacitor/geolocation` 실 GPS → `CreateSplit` 사진 슬롯은 **disabled 스텁**, 위치는 `locationStore.current ?? DEFAULT_COORDS`(서울시청).
   - S3 presigned 실제 PUT 업로드 → `nthingApi.signUpload` 메소드는 **추가하되**(1.5 가 바로 소비) 화면에서 호출하지 않음. `createSplit` 의 `imageUrl` 은 1.4 에선 보내지 않음(서버에서 nullable).
   - `locationStore.request()`(GPS 요청) 는 1.5 에서 추가(YAGNI — 1.4 엔 호출자 없음). 1.4 스텁은 `current` + `setCurrent` 만.
3. **Apple 로그인 / 실 OAuth 라운드트립** 은 1.3 보류 그대로 — 이 plan 에서 건드리지 않음.
4. **Home 필터 칩 = `전체`/`모집중` 만 배선**. `음식`/`생필품`/`마감임박` 은 서버에 카테고리/마감 필드가 없어 MVP 미지원 → 1.4 범위 밖(렌더하지 않음). 디자인 brief 의 카테고리 칩은 서버 필드 추가 후 후속.
5. **SplitList 세그먼트(진행중/완료)** 는 서버가 상태 무관 전체를 주므로 1.4 에선 생략(전체 표시). 클라 필터 세그먼트는 후속 시각 보강.
6. **취소 버튼 error 컬러 강조 생략** — `cn()` 이 `clsx` 만 쓰고(**tailwind-merge 아님**, `shared/lib/cn.ts` 확인) 색 유틸 충돌이 비결정적이라, 컴포넌트 기본 색을 className 으로 덮어쓰지 않는다(아래 컨벤션). 취소는 `variant="secondary"` 기본색 사용.

---

## File Structure (이 plan 에서 생기는/바뀌는 파일)

### 신규 (Create)
- `mobile/src/shared/lib/format.ts` (+ `format.test.ts`) — `formatPrice`/`formatDistance`/`formatRelativeTime` 순수 함수
- `mobile/src/shared/stores/locationStore.ts` (+ `locationStore.test.ts`) — `useLocationStore` + `DEFAULT_COORDS`
- `mobile/src/features/splits/queries.ts` (+ `queries.test.tsx`) — `splitKeys` + query/mutation 훅
- `mobile/src/features/splits/SplitCard.tsx` (+ `SplitCard.test.tsx`) — 도메인 카드
- `mobile/src/routes/MainLayout.tsx` (+ `MainLayout.test.tsx`) — 셸(Outlet + BottomNav + FAB)
- `mobile/src/routes/Map.tsx` (+ `Map.test.tsx`) — 지도 탭 placeholder(1.5)
- `mobile/src/routes/Profile.tsx` (+ `Profile.test.tsx`) — 나의 반띵
- `mobile/src/routes/CreateSplit.tsx` (+ `CreateSplit.test.tsx`) — 등록 폼
- `mobile/src/routes/SplitDetail.tsx` (+ `SplitDetail.test.tsx`) — 상세 + 참여/취소
- `mobile/src/routes/SplitList.tsx` (+ `SplitList.test.tsx`) — 내/참여 목록

### 수정 (Modify)
- `mobile/src/shared/api/types.ts` — Split/Page/Upload 타입 **추가**(append)
- `mobile/src/shared/api/nthingApi.ts` (+ `nthingApi.test.ts`) — splits/uploads 메소드 **추가**(전체 재작성)
- `mobile/src/routes/Home.tsx` — 임시 → 실제 피드로 **교체**(+ `Home.test.tsx` 신규)
- `mobile/src/App.tsx` — 라우트 확장(중첩 MainLayout + 풀스크린 라우트)

### 삭제 (Delete)
- `mobile/src/routes/Hello.tsx`, `mobile/src/routes/Hello.test.tsx` — 1.3 가 남겨둔 미사용 scaffold 정리(App 라우트에서 이미 빠짐)

### 공유 타입/시그니처 (모든 task 가 이 정의를 따른다 — 일관성 고정)

```ts
// shared/api/types.ts 에 추가되는 계약 (서버 SplitDto.kt 기준)
export type SplitStatus = 'WAITING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';
export type Author = { id: number; nickname: string; profileImageUrl: string | null };
export type Participant = { userId: number; nickname: string; profileImageUrl: string | null; joinedAt: string };
export type Split = {
  id: number; productName: string; totalPrice: number; totalQty: number; splitCount: number;
  pricePerPerson: number; qtyPerPerson: number; imageUrl: string | null;
  latitude: number; longitude: number; address: string; status: SplitStatus;
  author: Author; createdAt: string;
  participants: Participant[]; currentParticipants: number; distanceKm: number | null;
};
export type PageResponse<T> = {
  content: T[]; page: number; size: number; totalElements: number; totalPages: number; hasNext: boolean;
};
export type CreateSplitRequest = {
  productName: string; totalPrice: number; totalQty: number; splitCount: number;
  imageUrl?: string | null; latitude: number; longitude: number; address: string;
};
export type GetSplitsParams = { status?: SplitStatus; lat?: number; lng?: number; radiusKm?: number; page?: number; size?: number };
export type PresignRequest = { contentType: 'image/jpeg' | 'image/png' | 'image/webp'; size: number };
export type PresignResponse = { uploadUrl: string; publicUrl: string; key: string; expiresInSeconds: number };

// shared/api/nthingApi.ts 에 추가되는 메소드 (auth/devLogin/me 는 1.3 에서 이미 존재)
nthingApi.getSplits(params?: GetSplitsParams): Promise<PageResponse<Split>>;   // GET /splits?...
nthingApi.getSplit(id: number): Promise<Split>;                                // GET /splits/{id}
nthingApi.createSplit(req: CreateSplitRequest): Promise<Split>;                // POST /splits
nthingApi.joinSplit(id: number): Promise<Split>;                               // POST /splits/{id}/join
nthingApi.cancelSplit(id: number): Promise<Split>;                             // PATCH /splits/{id}/cancel
nthingApi.getMySplits(page?: number, size?: number): Promise<PageResponse<Split>>;          // GET /splits/my
nthingApi.getParticipatedSplits(page?: number, size?: number): Promise<PageResponse<Split>>;// GET /splits/participated
nthingApi.signUpload(req: PresignRequest): Promise<PresignResponse>;           // POST /uploads/sign (1.5 가 소비)

// features/splits/queries.ts
export const splitKeys = {
  all: ['splits'] as const,
  list: (params: GetSplitsParams) => ['splits', params] as const,
  detail: (id: number) => ['splits', id] as const,
  my: () => ['splits', 'my'] as const,
  participated: () => ['splits', 'participated'] as const,
};
export function useSplits(params: GetSplitsParams): UseQueryResult<PageResponse<Split>>;
export function useSplit(id: number): UseQueryResult<Split>;
export function useMySplits(page?: number): UseQueryResult<PageResponse<Split>>;
export function useParticipatedSplits(page?: number): UseQueryResult<PageResponse<Split>>;
export function useCreateSplit(): UseMutationResult<Split, Error, CreateSplitRequest>;
export function useJoinSplit(): UseMutationResult<Split, Error, number>;
export function useCancelSplit(): UseMutationResult<Split, Error, number>;

// shared/stores/locationStore.ts
export type Coords = { lat: number; lng: number };
export const DEFAULT_COORDS: Coords; // 서울시청 { lat: 37.5665, lng: 126.978 }
useLocationStore: { current: Coords | null; setCurrent(coords: Coords): void };
```

> **컨벤션 (모든 task 준수)**:
> - 상대경로 import(별칭 `@/` 안 씀). 타입은 `import { type X } from '...'`(verbatimModuleSyntax).
> - `erasableSyntaxOnly`: **enum/네임스페이스/생성자 파라미터 프로퍼티 금지**. 상태는 유니온 타입 + `const` 맵으로.
> - `noUnusedLocals/Parameters` 위반 금지. import 한 건 전부 사용.
> - 테스트는 `import { describe, it, expect, vi } from 'vitest'` 명시 import + RTL(`render`/`screen`/`waitFor`/`renderHook`), `userEvent`.
> - **`cn()` 은 clsx 래퍼(tailwind-merge 아님)** — 컴포넌트(Button/Card 등)의 색/배경 유틸을 className 으로 덮어쓰지 말 것(충돌 비결정적). 다른 배경이 필요하면 그 컴포넌트 대신 plain `<div>` 사용.
> - 디자인 토큰 클래스명 정확히: 강조 본문은 **`text-body-em`**(NOT `text-bodyEmph`), 브랜드색 `text-brand`/`bg-brand`/`dark:text-brand-dark-adj`, 배지 배경 `bg-brand-surface`/`dark:bg-brand-surface-dark`.
> - 재사용 컴포넌트 prop API(확인됨): `Button{variant:'primary'|'secondary'|'text',size:'md'|'lg',fullWidth,loading,...btnAttrs}`, `Card{padding:'sm'|'md'|'lg',interactive,...divAttrs}`, `Badge{tone}`, `StatusBadge{status:'WAITING'|'MATCHED'|'COMPLETED'|'CANCELLED'|'URGENT'}`, `Chip{active,onClick}`, `TextField{label,value,onChange:(v:string)=>void,error?,supportingText?,trailing?,...inputAttrs}`, `AppBar{title,onBack?,actions?,transparent?,align?}`, `BottomNav{current:'home'|'map'|'profile',onSelect}`, `Fab{onClick,label,icon?,className?}`, `EmptyState{title,subtitle?,action?}`, `ErrorState{message,onRetry?}`, `LoadingState{message?}`.
> - 카피톤(CLAUDE.md): 워드마크 "Nthing", CTA "반띵할게요", 등록 "내 반띵 올리기"/"반띵 등록하기", 홈 타이틀 "근처 반띵", 프로필 헤더 "나의 반띵", Empty "아직 반띵이 없어요"/"첫 반띵을 올려보세요", 마감 "마감된 반띵".

---

## Task 1: 포맷 유틸 (`shared/lib/format.ts`)

**Files:**
- Create: `mobile/src/shared/lib/format.ts`
- Test: `mobile/src/shared/lib/format.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/shared/lib/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatPrice, formatDistance, formatRelativeTime } from './format';

describe('formatPrice', () => {
  it('천 단위 콤마 + 원화 기호', () => {
    expect(formatPrice(10000)).toBe('₩10,000');
    expect(formatPrice(0)).toBe('₩0');
    expect(formatPrice(1234567)).toBe('₩1,234,567');
  });
});

describe('formatDistance', () => {
  it('1km 미만은 m, 이상은 소수1자리 km', () => {
    expect(formatDistance(0.3)).toBe('300m');
    expect(formatDistance(1.25)).toBe('1.3km');
    expect(formatDistance(12)).toBe('12.0km');
  });
  it('null/undefined 면 빈 문자열', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-05-27T12:00:00');
  it('구간별 상대 시간', () => {
    expect(formatRelativeTime('2026-05-27T11:59:40', now)).toBe('방금 전');
    expect(formatRelativeTime('2026-05-27T11:30:00', now)).toBe('30분 전');
    expect(formatRelativeTime('2026-05-27T09:00:00', now)).toBe('3시간 전');
    expect(formatRelativeTime('2026-05-25T12:00:00', now)).toBe('2일 전');
  });
  it('7일 이상이면 YYYY.MM.DD', () => {
    expect(formatRelativeTime('2026-05-01T12:00:00', now)).toBe('2026.05.01');
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/lib/format.test.ts
```
Expected: FAIL — `./format` 모듈 없음.

- [ ] **Step 3: format.ts 구현**

`mobile/src/shared/lib/format.ts`:
```ts
// 가격: ₩10,000 (ICU 비의존 — 수동 천단위 콤마)
export function formatPrice(value: number): string {
  return `₩${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// 거리: 1km 미만 → m(반올림), 이상 → 소수1자리 km. null/undefined → ''
export function formatDistance(km: number | null | undefined): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

// 상대 시간: 방금 전 / N분 전 / N시간 전 / N일 전 / YYYY.MM.DD (7일 이상)
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const min = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  const y = then.getFullYear();
  const m = String(then.getMonth() + 1).padStart(2, '0');
  const d = String(then.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/lib/format.test.ts
```
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/shared/lib/format.ts mobile/src/shared/lib/format.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/lib): add price/distance/relative-time formatters

SplitCard·상세에서 쓸 순수 포맷 함수. ICU 비의존 가격 콤마, m/km 거리, 상대 시간.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Split/Upload 타입 + nthingApi splits/uploads 메소드

**Files:**
- Modify: `mobile/src/shared/api/types.ts` (append)
- Modify: `mobile/src/shared/api/nthingApi.ts` (전체 재작성 — 1.3 auth/me 유지 + splits/uploads 추가)
- Test: `mobile/src/shared/api/nthingApi.test.ts` (append — 1.3 의 mock 셋업 재사용)

- [ ] **Step 1: 실패 테스트 작성 (기존 파일에 describe 블록 추가)**

`mobile/src/shared/api/nthingApi.test.ts` **끝에** 아래 describe 를 추가(파일 상단 `vi.mock('./http', ...)` 와 `mockFetch` 는 1.3 에서 이미 존재):
```ts
describe('nthingApi splits/uploads', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ id: 1 });
  });

  it('getSplits 는 파라미터를 쿼리스트링으로 GET /splits', async () => {
    await nthingApi.getSplits({ lat: 37.5, lng: 127, radiusKm: 3, status: 'WAITING' });
    expect(mockFetch).toHaveBeenCalledWith('/splits?status=WAITING&lat=37.5&lng=127&radiusKm=3');
  });

  it('getSplits 는 빈 파라미터면 쿼리 없이 GET /splits', async () => {
    await nthingApi.getSplits();
    expect(mockFetch).toHaveBeenCalledWith('/splits');
  });

  it('getSplit 는 GET /splits/{id}', async () => {
    await nthingApi.getSplit(7);
    expect(mockFetch).toHaveBeenCalledWith('/splits/7');
  });

  it('createSplit 는 POST /splits (body)', async () => {
    const req = { productName: '두쫀쿠', totalPrice: 20000, totalQty: 4, splitCount: 2, latitude: 37.5, longitude: 127, address: '역삼동' };
    await nthingApi.createSplit(req);
    expect(mockFetch).toHaveBeenCalledWith('/splits', { method: 'POST', body: req });
  });

  it('joinSplit 는 POST /splits/{id}/join', async () => {
    await nthingApi.joinSplit(3);
    expect(mockFetch).toHaveBeenCalledWith('/splits/3/join', { method: 'POST' });
  });

  it('cancelSplit 는 PATCH /splits/{id}/cancel', async () => {
    await nthingApi.cancelSplit(3);
    expect(mockFetch).toHaveBeenCalledWith('/splits/3/cancel', { method: 'PATCH' });
  });

  it('getMySplits 는 GET /splits/my?page&size', async () => {
    await nthingApi.getMySplits();
    expect(mockFetch).toHaveBeenCalledWith('/splits/my?page=0&size=20');
  });

  it('getParticipatedSplits 는 GET /splits/participated?page&size', async () => {
    await nthingApi.getParticipatedSplits(2, 10);
    expect(mockFetch).toHaveBeenCalledWith('/splits/participated?page=2&size=10');
  });

  it('signUpload 는 POST /uploads/sign (body)', async () => {
    await nthingApi.signUpload({ contentType: 'image/jpeg', size: 123 });
    expect(mockFetch).toHaveBeenCalledWith('/uploads/sign', { method: 'POST', body: { contentType: 'image/jpeg', size: 123 } });
  });
});
```

> 참고: 1.3 의 `nthingApi.test.ts` 는 상단에 `vi.mock('./http', () => ({ apiFetch: vi.fn() }))` 와 `const mockFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;` 를 이미 둔다. `beforeEach`/`describe`/`it`/`expect` import 도 이미 있음. 새 describe 만 append.

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/api/nthingApi.test.ts
```
Expected: FAIL — `nthingApi.getSplits` 등 미존재(메소드 undefined 호출 에러).

- [ ] **Step 3: types.ts 에 Split/Page/Upload 타입 추가**

`mobile/src/shared/api/types.ts` **끝에** 추가(1.3 의 Provider/AuthResponse/Me/AuthUser/UpdateMeRequest/ApiError 는 그대로 둠):
```ts
// ── Split 도메인 (서버 SplitDto.kt 기준) ──
export type SplitStatus = 'WAITING' | 'MATCHED' | 'COMPLETED' | 'CANCELLED';

export type Author = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type Participant = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  joinedAt: string;
};

export type Split = {
  id: number;
  productName: string;
  totalPrice: number;
  totalQty: number;
  splitCount: number;
  pricePerPerson: number;
  qtyPerPerson: number;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  address: string;
  status: SplitStatus;
  author: Author;
  createdAt: string;
  participants: Participant[];
  currentParticipants: number;
  distanceKm: number | null;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type CreateSplitRequest = {
  productName: string;
  totalPrice: number;
  totalQty: number;
  splitCount: number;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  address: string;
};

export type GetSplitsParams = {
  status?: SplitStatus;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  size?: number;
};

// ── Upload (서버 UploadDto.kt 기준) ──
export type PresignRequest = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
};

export type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSeconds: number;
};
```

- [ ] **Step 4: nthingApi.ts 전체 재작성 (1.3 메소드 유지 + 추가)**

`mobile/src/shared/api/nthingApi.ts` 전체를 아래로 교체:
```ts
import { apiFetch } from './http';
import {
  type AuthResponse,
  type CreateSplitRequest,
  type GetSplitsParams,
  type Me,
  type PageResponse,
  type PresignRequest,
  type PresignResponse,
  type Split,
  type UpdateMeRequest,
} from './types';

// undefined/'' 는 제외하고 쿼리스트링 조립 (0 은 포함)
function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const nthingApi = {
  // ── auth (Phase 1.3) ──
  loginKakao: (code: string) =>
    apiFetch<AuthResponse>('/auth/kakao', { method: 'POST', body: { code }, auth: false }),

  loginNaver: (code: string, state: string) =>
    apiFetch<AuthResponse>('/auth/naver', { method: 'POST', body: { code, state }, auth: false }),

  loginGoogle: (code: string) =>
    apiFetch<AuthResponse>('/auth/google', { method: 'POST', body: { code }, auth: false }),

  loginApple: (idToken: string) =>
    apiFetch<AuthResponse>('/auth/apple', { method: 'POST', body: { idToken }, auth: false }),

  devLogin: () => apiFetch<AuthResponse>('/auth/dev-login', { method: 'POST', auth: false }),

  // ── me (Phase 1.3) ──
  getMe: () => apiFetch<Me>('/users/me'),

  updateMe: (req: UpdateMeRequest) => apiFetch<Me>('/users/me', { method: 'PATCH', body: req }),

  // ── splits (Phase 1.4) ──
  // GET /splits, /splits/{id} 는 서버에서 비인증 허용(둘러보기). 토큰 있으면 함께 가도 무방.
  getSplits: (params: GetSplitsParams = {}) =>
    apiFetch<PageResponse<Split>>(
      `/splits${toQuery({
        status: params.status,
        lat: params.lat,
        lng: params.lng,
        radiusKm: params.radiusKm,
        page: params.page,
        size: params.size,
      })}`,
    ),

  getSplit: (id: number) => apiFetch<Split>(`/splits/${id}`),

  createSplit: (req: CreateSplitRequest) =>
    apiFetch<Split>('/splits', { method: 'POST', body: req }),

  joinSplit: (id: number) => apiFetch<Split>(`/splits/${id}/join`, { method: 'POST' }),

  cancelSplit: (id: number) => apiFetch<Split>(`/splits/${id}/cancel`, { method: 'PATCH' }),

  getMySplits: (page = 0, size = 20) =>
    apiFetch<PageResponse<Split>>(`/splits/my${toQuery({ page, size })}`),

  getParticipatedSplits: (page = 0, size = 20) =>
    apiFetch<PageResponse<Split>>(`/splits/participated${toQuery({ page, size })}`),

  // ── uploads (Phase 1.4 시그니처만; 실제 PUT 업로드는 1.5) ──
  signUpload: (req: PresignRequest) =>
    apiFetch<PresignResponse>('/uploads/sign', { method: 'POST', body: req }),
};
```

- [ ] **Step 5: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/api/nthingApi.test.ts
```
Expected: PASS (1.3 의 auth/me 7개 + 신규 splits/uploads 9개 = 16 tests).

- [ ] **Step 6: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/shared/api/types.ts mobile/src/shared/api/nthingApi.ts mobile/src/shared/api/nthingApi.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/api): add splits/uploads types + nthingApi methods

서버 실제 계약 기준(PageResponse, join→Split). getSplits/getSplit/createSplit/joinSplit/
cancelSplit/getMySplits/getParticipatedSplits + signUpload(1.5 소비). api-spec.md 구버전과
의 차이(배열→PageResponse, join 응답) 는 plan Scope&Decisions 에 기록.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: locationStore 스텁 (`shared/stores/locationStore.ts`)

**Files:**
- Create: `mobile/src/shared/stores/locationStore.ts`
- Test: `mobile/src/shared/stores/locationStore.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/shared/stores/locationStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useLocationStore, DEFAULT_COORDS } from './locationStore';

describe('locationStore', () => {
  beforeEach(() => useLocationStore.setState({ current: null }));

  it('초기 current 는 null', () => {
    expect(useLocationStore.getState().current).toBeNull();
  });

  it('setCurrent 가 좌표를 보관한다', () => {
    useLocationStore.getState().setCurrent({ lat: 37.1, lng: 127.2 });
    expect(useLocationStore.getState().current).toEqual({ lat: 37.1, lng: 127.2 });
  });

  it('DEFAULT_COORDS 는 서울시청', () => {
    expect(DEFAULT_COORDS).toEqual({ lat: 37.5665, lng: 126.978 });
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/stores/locationStore.test.ts
```
Expected: FAIL — `./locationStore` 없음.

- [ ] **Step 3: locationStore.ts 구현**

`mobile/src/shared/stores/locationStore.ts`:
```ts
import { create } from 'zustand';

export type Coords = { lat: number; lng: number };

// GPS 미연동 기본 좌표(서울시청). 실제 위치 캡처(request)는 Phase 1.5 @capacitor/geolocation.
export const DEFAULT_COORDS: Coords = { lat: 37.5665, lng: 126.978 };

type LocationState = {
  current: Coords | null;
  setCurrent: (coords: Coords) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  setCurrent: (coords) => set({ current: coords }),
}));
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/shared/stores/locationStore.test.ts
```
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/shared/stores/locationStore.ts mobile/src/shared/stores/locationStore.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile/stores): add locationStore stub (current coords + DEFAULT_COORDS)

좌표 보관 + 서울시청 기본값. 실제 GPS 요청(request)은 Phase 1.5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: TanStack Query 훅 (`features/splits/queries.ts`)

**Files:**
- Create: `mobile/src/features/splits/queries.ts`
- Test: `mobile/src/features/splits/queries.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/splits/queries.test.tsx` — `nthingApi` 를 모킹하고 fresh QueryClient wrapper 로 훅 검증:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../shared/api/nthingApi', () => ({
  nthingApi: {
    getSplits: vi.fn(),
    getSplit: vi.fn(),
    getMySplits: vi.fn(),
    getParticipatedSplits: vi.fn(),
    createSplit: vi.fn(),
    joinSplit: vi.fn(),
    cancelSplit: vi.fn(),
  },
}));

import { nthingApi } from '../../shared/api/nthingApi';
import {
  splitKeys,
  useSplits,
  useSplit,
  useCreateSplit,
  useJoinSplit,
} from './queries';

const api = nthingApi as unknown as Record<string, ReturnType<typeof vi.fn>>;

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    qc,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    ),
  };
}

const PAGE = { content: [{ id: 1 }], page: 0, size: 20, totalElements: 1, totalPages: 1, hasNext: false };

describe('splitKeys', () => {
  it('스펙 컨벤션 키', () => {
    expect(splitKeys.all).toEqual(['splits']);
    expect(splitKeys.list({ lat: 1, lng: 2 })).toEqual(['splits', { lat: 1, lng: 2 }]);
    expect(splitKeys.detail(5)).toEqual(['splits', 5]);
    expect(splitKeys.my()).toEqual(['splits', 'my']);
    expect(splitKeys.participated()).toEqual(['splits', 'participated']);
  });
});

describe('useSplits / useSplit', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useSplits 는 getSplits 결과를 반환', async () => {
    api.getSplits.mockResolvedValue(PAGE);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSplits({ lat: 1, lng: 2 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getSplits).toHaveBeenCalledWith({ lat: 1, lng: 2 });
    expect(result.current.data).toEqual(PAGE);
  });

  it('useSplit 는 getSplit(id) 결과를 반환', async () => {
    api.getSplit.mockResolvedValue({ id: 9 });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSplit(9), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getSplit).toHaveBeenCalledWith(9);
  });
});

describe('mutations invalidate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useCreateSplit 성공 시 splits 쿼리를 무효화', async () => {
    api.createSplit.mockResolvedValue({ id: 1 });
    const { qc, wrapper } = makeWrapper();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateSplit(), { wrapper });
    result.current.mutate({
      productName: 'x', totalPrice: 100, totalQty: 2, splitCount: 2,
      latitude: 1, longitude: 2, address: 'a',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(spy).toHaveBeenCalledWith({ queryKey: splitKeys.all });
  });

  it('useJoinSplit 성공 시 상세 캐시를 갱신', async () => {
    api.joinSplit.mockResolvedValue({ id: 4, status: 'MATCHED' });
    const { qc, wrapper } = makeWrapper();
    const setSpy = vi.spyOn(qc, 'setQueryData');
    const { result } = renderHook(() => useJoinSplit(), { wrapper });
    result.current.mutate(4);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(setSpy).toHaveBeenCalledWith(splitKeys.detail(4), { id: 4, status: 'MATCHED' });
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/splits/queries.test.tsx
```
Expected: FAIL — `./queries` 없음.

- [ ] **Step 3: queries.ts 구현**

`mobile/src/features/splits/queries.ts`:
```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { nthingApi } from '../../shared/api/nthingApi';
import {
  type CreateSplitRequest,
  type GetSplitsParams,
  type PageResponse,
  type Split,
} from '../../shared/api/types';

// 스펙 쿼리 키 컨벤션: ['splits', {params}] / ['splits', id] / ['splits','my'|'participated']
export const splitKeys = {
  all: ['splits'] as const,
  list: (params: GetSplitsParams) => ['splits', params] as const,
  detail: (id: number) => ['splits', id] as const,
  my: () => ['splits', 'my'] as const,
  participated: () => ['splits', 'participated'] as const,
};

export function useSplits(params: GetSplitsParams) {
  return useQuery<PageResponse<Split>>({
    queryKey: splitKeys.list(params),
    queryFn: () => nthingApi.getSplits(params),
  });
}

export function useSplit(id: number) {
  return useQuery<Split>({
    queryKey: splitKeys.detail(id),
    queryFn: () => nthingApi.getSplit(id),
    enabled: Number.isFinite(id),
  });
}

export function useMySplits(page = 0) {
  return useQuery<PageResponse<Split>>({
    queryKey: splitKeys.my(),
    queryFn: () => nthingApi.getMySplits(page),
  });
}

export function useParticipatedSplits(page = 0) {
  return useQuery<PageResponse<Split>>({
    queryKey: splitKeys.participated(),
    queryFn: () => nthingApi.getParticipatedSplits(page),
  });
}

export function useCreateSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSplitRequest) => nthingApi.createSplit(req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: splitKeys.all });
    },
  });
}

export function useJoinSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nthingApi.joinSplit(id),
    onSuccess: (updated) => {
      qc.setQueryData(splitKeys.detail(updated.id), updated);
      void qc.invalidateQueries({ queryKey: splitKeys.all });
    },
  });
}

export function useCancelSplit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => nthingApi.cancelSplit(id),
    onSuccess: (updated) => {
      qc.setQueryData(splitKeys.detail(updated.id), updated);
      void qc.invalidateQueries({ queryKey: splitKeys.all });
    },
  });
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/splits/queries.test.tsx
```
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/features/splits/queries.ts mobile/src/features/splits/queries.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/splits): add TanStack Query hooks + splitKeys

useSplits/useSplit/useMySplits/useParticipatedSplits + create/join/cancel mutation.
스펙 쿼리 키 컨벤션, mutation 성공 시 ['splits'] 무효화 + 상세 캐시 갱신.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: SplitCard 컴포넌트 (`features/splits/SplitCard.tsx`)

**Files:**
- Create: `mobile/src/features/splits/SplitCard.tsx`
- Test: `mobile/src/features/splits/SplitCard.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/features/splits/SplitCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitCard } from './SplitCard';
import { type Split } from '../../shared/api/types';

const SPLIT: Split = {
  id: 1, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5665, longitude: 126.978, address: '서울 강남구 역삼동',
  status: 'WAITING', author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00', participants: [], currentParticipants: 1, distanceKm: 0.3,
};

describe('SplitCard', () => {
  it('상품명/1인당 가격/모집 인원/상태 배지를 렌더', () => {
    render(<SplitCard split={SPLIT} />);
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByText('1인당 ₩10,000')).toBeInTheDocument();
    expect(screen.getByText('2명 모집')).toBeInTheDocument();
    expect(screen.getByText('모집중')).toBeInTheDocument();
  });

  it('onClick 이 있으면 클릭 시 호출', async () => {
    const onClick = vi.fn();
    render(<SplitCard split={SPLIT} onClick={onClick} />);
    await userEvent.click(screen.getByText('두쫀쿠 4개입'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/splits/SplitCard.test.tsx
```
Expected: FAIL — `./SplitCard` 없음.

- [ ] **Step 3: SplitCard.tsx 구현**

`mobile/src/features/splits/SplitCard.tsx`:
```tsx
import { ImageIcon } from 'lucide-react';
import { Card } from '../../shared/components/Card';
import { StatusBadge } from '../../shared/components/Badge';
import { type Split } from '../../shared/api/types';
import { formatPrice, formatDistance, formatRelativeTime } from '../../shared/lib/format';

type SplitCardProps = {
  split: Split;
  onClick?: () => void;
};

export function SplitCard({ split, onClick }: SplitCardProps) {
  const meta = [split.address, formatDistance(split.distanceKm), formatRelativeTime(split.createdAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card padding="sm" interactive={Boolean(onClick)} onClick={onClick} className="overflow-hidden">
      <div className="-m-3 mb-3 aspect-video bg-gray-100 dark:bg-gray-800">
        {split.imageUrl ? (
          <img src={split.imageUrl} alt={split.productName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-8 text-gray-300" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-h2 text-gray-900 dark:text-gray-50">{split.productName}</h3>
        <StatusBadge status={split.status} />
      </div>
      <p className="mt-1 text-caption text-gray-500 dark:text-gray-400">{meta}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-body-em text-brand dark:text-brand-dark-adj">
          1인당 {formatPrice(split.pricePerPerson)}
        </span>
        <span className="text-caption text-gray-500 dark:text-gray-400">{split.splitCount}명 모집</span>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/features/splits/SplitCard.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/features/splits/SplitCard.tsx mobile/src/features/splits/SplitCard.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/splits): add SplitCard (image/name/status/price/meta)

brief 5 SplitCard 1:1. 이미지 16:9(없으면 placeholder), 상품명+StatusBadge,
주소·거리·시간 메타, 1인당 가격(brand) + N명 모집. onClick 있으면 interactive.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: MainLayout 셸 (`routes/MainLayout.tsx`)

**Files:**
- Create: `mobile/src/routes/MainLayout.tsx`
- Test: `mobile/src/routes/MainLayout.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/MainLayout.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './MainLayout';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<div>HOME-TAB</div>} />
          <Route path="/map" element={<div>MAP-TAB</div>} />
          <Route path="/profile" element={<div>PROFILE-TAB</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('MainLayout', () => {
  it('Outlet 자식과 BottomNav 3탭을 렌더', () => {
    renderAt('/home');
    expect(screen.getByText('HOME-TAB')).toBeInTheDocument();
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('지도')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
  });

  it('현재 탭(home)이 aria-current 로 표시된다', () => {
    renderAt('/home');
    expect(screen.getByRole('button', { name: /홈/ })).toHaveAttribute('aria-current', 'page');
  });

  it('home/map 에는 FAB, profile 에는 FAB 없음', () => {
    const { unmount } = renderAt('/home');
    expect(screen.getByRole('button', { name: '반띵 등록하기' })).toBeInTheDocument();
    unmount();
    renderAt('/profile');
    expect(screen.queryByRole('button', { name: '반띵 등록하기' })).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/MainLayout.test.tsx
```
Expected: FAIL — `./MainLayout` 없음.

- [ ] **Step 3: MainLayout.tsx 구현**

`mobile/src/routes/MainLayout.tsx`:
```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../shared/components/BottomNav';
import { Fab } from '../shared/components/Fab';

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

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/MainLayout.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/MainLayout.tsx mobile/src/routes/MainLayout.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add MainLayout shell (Outlet + BottomNav + FAB)

경로로 활성 탭 도출, 탭 클릭 시 navigate. FAB(반띵 등록하기)는 home/map 에서만 노출,
클릭 시 /splits/new. 임시 Home 대체 준비.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Home 탭 — 근처 반띵 피드 (`routes/Home.tsx` 교체)

**Files:**
- Modify (전체 교체): `mobile/src/routes/Home.tsx` (1.3 임시 화면 → 실제 피드)
- Test: `mobile/src/routes/Home.test.tsx` (신규)

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/Home.test.tsx` — `useSplits` 모킹, 상태별 렌더 검증:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/splits/queries', () => ({ useSplits: vi.fn() }));

import { useSplits } from '../features/splits/queries';
import { Home } from './Home';

const useSplitsMock = useSplits as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 1, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5, longitude: 127, address: '역삼동', status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00', participants: [], currentParticipants: 1, distanceKm: 0.3,
};

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>);
}

describe('Home', () => {
  beforeEach(() => useSplitsMock.mockReset());

  it('타이틀과 필터 칩을 렌더', () => {
    useSplitsMock.mockReturnValue({ isPending: true });
    renderHome();
    expect(screen.getByText('근처 반띵')).toBeInTheDocument();
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('모집중')).toBeInTheDocument();
  });

  it('로딩 중에는 로딩 상태', () => {
    useSplitsMock.mockReturnValue({ isPending: true });
    renderHome();
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();
  });

  it('빈 목록이면 Empty 카피', () => {
    useSplitsMock.mockReturnValue({ isPending: false, isError: false, data: { content: [] } });
    renderHome();
    expect(screen.getByText('아직 반띵이 없어요')).toBeInTheDocument();
  });

  it('데이터가 있으면 SplitCard 렌더', () => {
    useSplitsMock.mockReturnValue({ isPending: false, isError: false, data: { content: [SPLIT] } });
    renderHome();
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByText('1인당 ₩10,000')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Home.test.tsx
```
Expected: FAIL — 현재 Home 은 1.3 임시 화면("게스트님"…)이라 "근처 반띵" 등 미존재.

- [ ] **Step 3: Home.tsx 전체 교체**

`mobile/src/routes/Home.tsx` 전체를 아래로 교체:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../shared/components/AppBar';
import { Chip } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { EmptyState } from '../shared/components/states/EmptyState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { SplitCard } from '../features/splits/SplitCard';
import { useSplits } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import { type SplitStatus } from '../shared/api/types';

// 서버 카테고리/마감 필드 부재로 1.4 는 전체/모집중만 배선 (음식/생필품/마감임박은 후속)
const FILTERS: Array<{ label: string; status?: SplitStatus }> = [
  { label: '전체', status: undefined },
  { label: '모집중', status: 'WAITING' },
];

export function Home() {
  const navigate = useNavigate();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;
  const [filterIdx, setFilterIdx] = useState(0);
  const query = useSplits({
    lat: coords.lat,
    lng: coords.lng,
    radiusKm: 3,
    status: FILTERS[filterIdx].status,
  });

  return (
    <div>
      <AppBar title="근처 반띵" />
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {FILTERS.map((f, i) => (
          <Chip key={f.label} active={i === filterIdx} onClick={() => setFilterIdx(i)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message="반띵을 불러오지 못했어요" onRetry={() => void query.refetch()} />
      ) : query.data.content.length === 0 ? (
        <EmptyState
          title="아직 반띵이 없어요"
          subtitle="첫 반띵을 올려보세요"
          action={
            <Button size="md" onClick={() => navigate('/splits/new')}>
              반띵 등록하기
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 px-4 pb-24">
          {query.data.content.map((split) => (
            <SplitCard
              key={split.id}
              split={split}
              onClick={() => navigate(`/splits/${split.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

> TanStack v5 narrowing: `isPending`/`isError` 가드 후 `query.data` 는 `PageResponse<Split>` 로 좁혀진다(삼항도 동일). 만약 타입체크가 막히면 가드를 early-return 으로 바꾸지 말고 `query.data!` 가 아니라 `useSplits` 반환 타입을 확인할 것(여기선 좁혀짐).

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Home.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/Home.tsx mobile/src/routes/Home.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): replace temp Home with 근처 반띵 feed

AppBar + 필터 칩(전체/모집중) + useSplits(위치 기반) → SplitCard 목록.
loading/empty/error 상태 분기, 카드/Empty 액션 → /splits/{id}·/splits/new.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Map 탭 placeholder (`routes/Map.tsx`)

**Files:**
- Create: `mobile/src/routes/Map.tsx`
- Test: `mobile/src/routes/Map.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/Map.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Map } from './Map';

describe('Map', () => {
  it('지도 탭 placeholder 안내를 렌더', () => {
    render(<Map />);
    expect(screen.getByText('지도')).toBeInTheDocument();
    expect(screen.getByText('지도는 곧 제공돼요')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Map.test.tsx
```
Expected: FAIL — `./Map` 없음.

- [ ] **Step 3: Map.tsx 구현**

`mobile/src/routes/Map.tsx`:
```tsx
import { MapPin } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';

// Phase 1.5 에서 카카오맵 JS SDK 로 교체. 지금은 placeholder 탭.
export function Map() {
  return (
    <div className="flex h-full flex-col">
      <AppBar title="지도" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <MapPin className="size-10 text-gray-300" aria-hidden />
        <p className="text-body text-gray-500 dark:text-gray-400">지도는 곧 제공돼요</p>
        <p className="text-caption text-gray-400">근처 반띵을 지도로 보는 기능을 준비 중이에요</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Map.test.tsx
```
Expected: PASS (1 test).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/Map.tsx mobile/src/routes/Map.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add Map tab placeholder (KakaoMap deferred to 1.5)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Profile 탭 — 나의 반띵 (`routes/Profile.tsx`)

**Files:**
- Create: `mobile/src/routes/Profile.tsx`
- Test: `mobile/src/routes/Profile.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/Profile.test.tsx` — 실제 `authStore` 상태를 세팅, 메뉴 네비게이션 검증:
```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../shared/stores/authStore';
import { Profile } from './Profile';

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/me/splits" element={<div>MY-SPLITS</div>} />
        <Route path="/me/splits/participated" element={<div>PARTICIPATED</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Profile', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'jwt', user: { id: 1, nickname: '엔띵유저' }, isHydrated: true });
  });

  it('헤더 타이틀과 닉네임, 메뉴 항목을 렌더', () => {
    renderProfile();
    expect(screen.getByText('나의 반띵')).toBeInTheDocument();
    expect(screen.getByText('엔띵유저')).toBeInTheDocument();
    expect(screen.getByText('내 나눠사기')).toBeInTheDocument();
    expect(screen.getByText('참여한 나눠사기')).toBeInTheDocument();
  });

  it('내 나눠사기 클릭 시 /me/splits 로 이동', async () => {
    renderProfile();
    await userEvent.click(screen.getByText('내 나눠사기'));
    expect(await screen.findByText('MY-SPLITS')).toBeInTheDocument();
  });

  it('로그아웃 클릭 시 store.logout 호출 후 /login', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout').mockResolvedValue(undefined);
    renderProfile();
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(logoutSpy).toHaveBeenCalledOnce();
    expect(await screen.findByText('LOGIN')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Profile.test.tsx
```
Expected: FAIL — `./Profile` 없음.

- [ ] **Step 3: Profile.tsx 구현**

`mobile/src/routes/Profile.tsx`:
```tsx
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Settings, User } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import { useAuthStore } from '../shared/stores/authStore';

const MENU: Array<{ label: string; to: string }> = [
  { label: '내 나눠사기', to: '/me/splits' },
  { label: '참여한 나눠사기', to: '/me/splits/participated' },
];

export function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = () => {
    void (async () => {
      await logout();
      navigate('/login', { replace: true });
    })();
  };

  return (
    <div>
      <AppBar
        title="나의 반띵"
        actions={
          <button
            type="button"
            aria-label="설정"
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <Settings className="size-5 text-gray-700 dark:text-gray-200" />
          </button>
        }
      />

      <div className="px-4">
        <Card className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <User className="size-7 text-gray-400" aria-hidden />
          </div>
          <div>
            <p className="text-h1 text-gray-900 dark:text-gray-50">{user?.nickname ?? '게스트'}</p>
            <p className="text-caption text-gray-500">반띵으로 알뜰하게</p>
          </div>
        </Card>

        <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
          {MENU.map((m) => (
            <li key={m.to}>
              <button
                type="button"
                onClick={() => navigate(m.to)}
                className="flex h-14 w-full items-center justify-between"
              >
                <span className="text-body text-gray-900 dark:text-gray-100">{m.label}</span>
                <ChevronRight className="size-5 text-gray-400" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-center">
          <Button variant="text" onClick={onLogout}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/Profile.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/Profile.tsx mobile/src/routes/Profile.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add Profile tab (나의 반띵 + 메뉴 + 로그아웃)

프로필 카드(닉네임), 내/참여한 나눠사기 메뉴 → /me/splits·/participated, 로그아웃.
RequireAuth 하위라 로그인 variant 만 (게스트 variant 불필요).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: CreateSplit 등록 폼 (`routes/CreateSplit.tsx`)

**Files:**
- Create: `mobile/src/routes/CreateSplit.tsx`
- Test: `mobile/src/routes/CreateSplit.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/CreateSplit.test.tsx` — `useCreateSplit` 모킹, 입력→미리보기→제출 검증:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mutate = vi.fn();
vi.mock('../features/splits/queries', () => ({ useCreateSplit: vi.fn() }));

import { useCreateSplit } from '../features/splits/queries';
import { CreateSplit } from './CreateSplit';

const useCreateSplitMock = useCreateSplit as unknown as ReturnType<typeof vi.fn>;

function renderCreate() {
  return render(<MemoryRouter><CreateSplit /></MemoryRouter>);
}

describe('CreateSplit', () => {
  beforeEach(() => {
    mutate.mockReset();
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

  it('유효 입력 후 제출 시 createSplit 페이로드로 mutate', async () => {
    renderCreate();
    await userEvent.type(screen.getByLabelText('상품명'), '두쫀쿠');
    await userEvent.type(screen.getByLabelText('전체 가격'), '20000');
    await userEvent.type(screen.getByLabelText('전체 수량'), '4');
    await userEvent.type(screen.getByLabelText('나눌 인원'), '2');
    await userEvent.type(screen.getByLabelText('주소'), '역삼동 GS25');

    const submit = screen.getByRole('button', { name: '내 반띵 올리기' });
    expect(submit).toBeEnabled();
    await userEvent.click(submit);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      productName: '두쫀쿠', totalPrice: 20000, totalQty: 4, splitCount: 2,
      latitude: 37.5665, longitude: 126.978, address: '역삼동 GS25',
    });
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/CreateSplit.test.tsx
```
Expected: FAIL — `./CreateSplit` 없음.

- [ ] **Step 3: CreateSplit.tsx 구현**

`mobile/src/routes/CreateSplit.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { AppBar } from '../shared/components/AppBar';
import { TextField } from '../shared/components/TextField';
import { Button } from '../shared/components/Button';
import { useCreateSplit } from '../features/splits/queries';
import { useLocationStore, DEFAULT_COORDS } from '../shared/stores/locationStore';
import { formatPrice } from '../shared/lib/format';

export function CreateSplit() {
  const navigate = useNavigate();
  const create = useCreateSplit();
  const coords = useLocationStore((s) => s.current) ?? DEFAULT_COORDS;

  const [productName, setProductName] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [splitCount, setSplitCount] = useState('');
  const [address, setAddress] = useState('');

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
    !create.isPending;

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
        // imageUrl 은 Phase 1.5(사진 촬영 + S3 업로드)에서 채움
      },
      { onSuccess: (created) => navigate(`/splits/${created.id}`, { replace: true }) },
    );
  };

  return (
    <div className="flex h-screen flex-col">
      <AppBar title="내 반띵 올리기" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-4">
          {/* 사진 슬롯 — Phase 1.5 에서 카메라/갤러리 + S3 업로드 연결 */}
          <button
            type="button"
            disabled
            className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800"
          >
            <Camera className="size-7" aria-hidden />
            <span className="text-caption">사진 추가 (준비 중)</span>
          </button>

          <TextField label="상품명" value={productName} onChange={setProductName} placeholder="예: 두쫀쿠 4개입" />
          <TextField label="전체 가격" value={totalPrice} onChange={setTotalPrice} placeholder="20000" inputMode="numeric" />
          <TextField label="전체 수량" value={totalQty} onChange={setTotalQty} placeholder="4" inputMode="numeric" />
          <TextField label="나눌 인원" value={splitCount} onChange={setSplitCount} placeholder="2" inputMode="numeric" supportingText="최소 2명" />
          <TextField label="주소" value={address} onChange={setAddress} placeholder="만날 위치" />

          {/* 인당 가격 미리보기 — Card 대신 plain div (brand-surface 배경 충돌 회피) */}
          <div className="flex items-center justify-between rounded-lg bg-brand-surface p-4 dark:bg-brand-surface-dark">
            <span className="text-body text-gray-700 dark:text-gray-200">1인당 예상 가격</span>
            <span className="text-h1 text-brand dark:text-brand-dark-adj">{formatPrice(perPerson)}</span>
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
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/CreateSplit.test.tsx
```
Expected: PASS (3 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/CreateSplit.tsx mobile/src/routes/CreateSplit.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add CreateSplit form (validation + per-person preview)

상품명/가격/수량/인원/주소 입력 + 1인당 미리보기, 검증 통과 시 useCreateSplit→상세 이동.
사진 슬롯·GPS 캡처는 Phase 1.5 스텁(disabled), 위치는 locationStore.current ?? DEFAULT.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: SplitDetail 상세 + 참여/취소 (`routes/SplitDetail.tsx`)

**Files:**
- Create: `mobile/src/routes/SplitDetail.tsx`
- Test: `mobile/src/routes/SplitDetail.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/SplitDetail.test.tsx` — 훅 모킹 + 라우트 파라미터 + 본인/타인/마감 분기:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const join = vi.fn();
const cancel = vi.fn();
vi.mock('../features/splits/queries', () => ({
  useSplit: vi.fn(),
  useJoinSplit: vi.fn(),
  useCancelSplit: vi.fn(),
}));

import { useSplit, useJoinSplit, useCancelSplit } from '../features/splits/queries';
import { useAuthStore } from '../shared/stores/authStore';
import { SplitDetail } from './SplitDetail';

const useSplitMock = useSplit as unknown as ReturnType<typeof vi.fn>;
const useJoinMock = useJoinSplit as unknown as ReturnType<typeof vi.fn>;
const useCancelMock = useCancelSplit as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 1, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5, longitude: 127, address: '역삼동 GS25', status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00', participants: [], currentParticipants: 1, distanceKm: 1.2,
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/splits/1']}>
      <Routes>
        <Route path="/splits/:id" element={<SplitDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SplitDetail', () => {
  beforeEach(() => {
    join.mockReset();
    cancel.mockReset();
    useJoinMock.mockReturnValue({ mutate: join, isPending: false });
    useCancelMock.mockReturnValue({ mutate: cancel, isPending: false });
    useAuthStore.setState({ token: 'jwt', user: { id: 1, nickname: '나' }, isHydrated: true });
  });

  it('상품 정보와 가격을 렌더', () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
    expect(screen.getByText('₩10,000')).toBeInTheDocument();
    expect(screen.getByText('역삼동 GS25')).toBeInTheDocument();
  });

  it('타인 글 + WAITING → 반띵할게요 클릭 시 join(id)', async () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: '반띵할게요' }));
    expect(join).toHaveBeenCalledWith(1);
  });

  it('본인 글 + WAITING → 취소하기 클릭 시 cancel(id)', async () => {
    useAuthStore.setState({ token: 'jwt', user: { id: 99, nickname: '판매자' }, isHydrated: true });
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: SPLIT });
    renderDetail();
    await userEvent.click(screen.getByRole('button', { name: '취소하기' }));
    expect(cancel).toHaveBeenCalledWith(1);
  });

  it('마감 상태(COMPLETED) → 비활성 마감된 반띵', () => {
    useSplitMock.mockReturnValue({ isPending: false, isError: false, data: { ...SPLIT, status: 'COMPLETED' } });
    renderDetail();
    expect(screen.getByRole('button', { name: '마감된 반띵' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/SplitDetail.test.tsx
```
Expected: FAIL — `./SplitDetail` 없음.

- [ ] **Step 3: SplitDetail.tsx 구현**

`mobile/src/routes/SplitDetail.tsx`:
```tsx
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { StatusBadge } from '../shared/components/Badge';
import { LoadingState } from '../shared/components/states/LoadingState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { useSplit, useJoinSplit, useCancelSplit } from '../features/splits/queries';
import { useAuthStore } from '../shared/stores/authStore';
import { formatPrice, formatDistance, formatRelativeTime } from '../shared/lib/format';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body text-gray-500">{label}</span>
      <span className="text-body text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

export function SplitDetail() {
  const { id } = useParams();
  const splitId = Number(id);
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const query = useSplit(splitId);
  const join = useJoinSplit();
  const cancel = useCancelSplit();

  if (query.isPending) {
    return (
      <div>
        <AppBar title="반띵 상세" onBack={() => navigate(-1)} />
        <LoadingState />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div>
        <AppBar title="반띵 상세" onBack={() => navigate(-1)} />
        <ErrorState message="반띵을 불러오지 못했어요" onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const split = query.data;
  const isMine = split.author.id === userId;
  const isOpen = split.status === 'WAITING';
  const meta = [formatDistance(split.distanceKm), formatRelativeTime(split.createdAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex h-screen flex-col">
      <AppBar title="반띵 상세" onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800">
          {split.imageUrl && (
            <img src={split.imageUrl} alt={split.productName} className="size-full object-cover" />
          )}
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-display text-gray-900 dark:text-gray-50">{split.productName}</h1>
            <StatusBadge status={split.status} />
          </div>

          <p className="text-caption text-gray-500">
            {split.author.nickname}
            {meta && ` · ${meta}`}
          </p>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
            <p className="text-caption text-gray-500">1인당</p>
            <p className="text-display text-brand dark:text-brand-dark-adj">
              {formatPrice(split.pricePerPerson)}
            </p>
            <div className="mt-3 space-y-1">
              <InfoRow label="전체 가격" value={formatPrice(split.totalPrice)} />
              <InfoRow label="전체 수량" value={`${split.totalQty}개`} />
              <InfoRow label="나눌 인원" value={`${split.splitCount}명`} />
            </div>
          </div>

          <div>
            <h2 className="text-h2 text-gray-900 dark:text-gray-50">위치</h2>
            <p className="mt-1 text-body text-gray-700 dark:text-gray-200">{split.address}</p>
            {/* 지도 미리보기는 Phase 1.5 (카카오맵) */}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        {!isOpen ? (
          <Button fullWidth disabled>
            마감된 반띵
          </Button>
        ) : isMine ? (
          <Button
            fullWidth
            variant="secondary"
            loading={cancel.isPending}
            onClick={() => cancel.mutate(splitId)}
          >
            취소하기
          </Button>
        ) : (
          <Button fullWidth loading={join.isPending} onClick={() => join.mutate(splitId)}>
            반띵할게요
          </Button>
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
pnpm test:run src/routes/SplitDetail.test.tsx
```
Expected: PASS (4 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/SplitDetail.tsx mobile/src/routes/SplitDetail.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add SplitDetail (info + join/cancel by ownership/status)

이미지/상품명/상태/작성자/가격 박스/위치. WAITING 일 때 본인→취소하기, 타인→반띵할게요,
그 외→비활성 마감된 반띵. loading/error 분기. 지도 미리보기는 1.5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: SplitList 내/참여 목록 (`routes/SplitList.tsx`)

**Files:**
- Create: `mobile/src/routes/SplitList.tsx`
- Test: `mobile/src/routes/SplitList.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`mobile/src/routes/SplitList.test.tsx` — variant 별 훅 모킹 + Empty/목록:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../features/splits/queries', () => ({
  useMySplits: vi.fn(),
  useParticipatedSplits: vi.fn(),
}));

import { useMySplits, useParticipatedSplits } from '../features/splits/queries';
import { SplitList } from './SplitList';

const useMyMock = useMySplits as unknown as ReturnType<typeof vi.fn>;
const useParticipatedMock = useParticipatedSplits as unknown as ReturnType<typeof vi.fn>;

const SPLIT = {
  id: 1, productName: '두쫀쿠 4개입', totalPrice: 20000, totalQty: 4, splitCount: 2,
  pricePerPerson: 10000, qtyPerPerson: 2, imageUrl: null,
  latitude: 37.5, longitude: 127, address: '역삼동', status: 'WAITING',
  author: { id: 99, nickname: '판매자', profileImageUrl: null },
  createdAt: '2026-05-27T10:00:00', participants: [], currentParticipants: 1, distanceKm: null,
};

function renderList(variant: 'my' | 'participated') {
  return render(<MemoryRouter><SplitList variant={variant} /></MemoryRouter>);
}

describe('SplitList', () => {
  beforeEach(() => {
    useMyMock.mockReset();
    useParticipatedMock.mockReset();
    useMyMock.mockReturnValue({ isPending: true });
    useParticipatedMock.mockReturnValue({ isPending: true });
  });

  it('my variant 타이틀 + 데이터 렌더', () => {
    useMyMock.mockReturnValue({ isPending: false, isError: false, data: { content: [SPLIT] } });
    renderList('my');
    expect(screen.getByText('내 나눠사기')).toBeInTheDocument();
    expect(screen.getByText('두쫀쿠 4개입')).toBeInTheDocument();
  });

  it('participated variant 타이틀', () => {
    useParticipatedMock.mockReturnValue({ isPending: false, isError: false, data: { content: [] } });
    renderList('participated');
    expect(screen.getByText('참여한 나눠사기')).toBeInTheDocument();
    expect(screen.getByText('아직 반띵이 없어요')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (fail 확인)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/SplitList.test.tsx
```
Expected: FAIL — `./SplitList` 없음.

- [ ] **Step 3: SplitList.tsx 구현**

`mobile/src/routes/SplitList.tsx` — variant 로 내부 컴포넌트 분기(각자 자기 훅을 무조건 호출 → 훅 규칙 준수):
```tsx
import { type UseQueryResult } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../shared/components/AppBar';
import { Button } from '../shared/components/Button';
import { LoadingState } from '../shared/components/states/LoadingState';
import { EmptyState } from '../shared/components/states/EmptyState';
import { ErrorState } from '../shared/components/states/ErrorState';
import { SplitCard } from '../features/splits/SplitCard';
import { useMySplits, useParticipatedSplits } from '../features/splits/queries';
import { type PageResponse, type Split } from '../shared/api/types';

type SplitListProps = { variant: 'my' | 'participated' };

function SplitListView({
  title,
  query,
}: {
  title: string;
  query: UseQueryResult<PageResponse<Split>>;
}) {
  const navigate = useNavigate();
  return (
    <div>
      <AppBar title={title} onBack={() => navigate(-1)} />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message="목록을 불러오지 못했어요" onRetry={() => void query.refetch()} />
      ) : query.data.content.length === 0 ? (
        <EmptyState
          title="아직 반띵이 없어요"
          subtitle="첫 반띵을 올려보세요"
          action={
            <Button size="md" onClick={() => navigate('/splits/new')}>
              반띵 등록하기
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 px-4 py-3">
          {query.data.content.map((split) => (
            <SplitCard
              key={split.id}
              split={split}
              onClick={() => navigate(`/splits/${split.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MySplitList() {
  return <SplitListView title="내 나눠사기" query={useMySplits()} />;
}

function ParticipatedSplitList() {
  return <SplitListView title="참여한 나눠사기" query={useParticipatedSplits()} />;
}

export function SplitList({ variant }: SplitListProps) {
  return variant === 'my' ? <MySplitList /> : <ParticipatedSplitList />;
}
```

- [ ] **Step 4: 테스트 실행 (pass)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm test:run src/routes/SplitList.test.tsx
```
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/routes/SplitList.tsx mobile/src/routes/SplitList.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile/routes): add SplitList (my/participated variants)

variant 별 내부 컴포넌트가 자기 훅 호출(훅 규칙 준수), 공용 뷰로 loading/empty/error/목록.
세그먼트(진행중/완료)는 후속(서버 상태 무관 전체 반환).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: App.tsx 라우트 확장 + scaffold 정리

**Files:**
- Modify (전체 교체): `mobile/src/App.tsx`
- Delete: `mobile/src/routes/Hello.tsx`, `mobile/src/routes/Hello.test.tsx`

- [ ] **Step 1: Hello scaffold 삭제**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
git rm src/routes/Hello.tsx src/routes/Hello.test.tsx
```
Expected: 두 파일 삭제됨. (1.3 의 App.tsx 는 이미 Hello 를 라우트에서 뺐으므로 참조 없음.)

- [ ] **Step 2: App.tsx 전체 교체 (중첩 MainLayout + 풀스크린 라우트)**

`mobile/src/App.tsx` 전체를 아래로 교체(1.3 의 hydrate/딥링크/가드 배선 유지 + 라우트 확장):
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
import { MainLayout } from './routes/MainLayout';
import { Home } from './routes/Home';
import { Map } from './routes/Map';
import { Profile } from './routes/Profile';
import { CreateSplit } from './routes/CreateSplit';
import { SplitDetail } from './routes/SplitDetail';
import { SplitList } from './routes/SplitList';
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

          {/* 인증된 3탭 — MainLayout(Outlet + BottomNav + FAB) 아래 중첩 */}
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* 인증 필요한 풀스크린 (셸 없음, 자체 AppBar + back) */}
          <Route
            path="/splits/new"
            element={
              <RequireAuth>
                <CreateSplit />
              </RequireAuth>
            }
          />
          <Route
            path="/splits/:id"
            element={
              <RequireAuth>
                <SplitDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/me/splits"
            element={
              <RequireAuth>
                <SplitList variant="my" />
              </RequireAuth>
            }
          />
          <Route
            path="/me/splits/participated"
            element={
              <RequireAuth>
                <SplitList variant="participated" />
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

> 라우트 매칭 주의: React Router 7 은 정적 세그먼트(`/splits/new`)를 동적(`/splits/:id`)보다 높게 랭크하므로 선언 순서와 무관하게 `new` 가 먼저 매칭된다. `/me/splits/participated` 와 `/me/splits` 도 더 구체적인 경로가 우선.

- [ ] **Step 3: 타입체크 + 빌드 + 린트**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm build
pnpm lint
```
Expected: `tsc -b` 통과(미사용 import/타입 에러 0 — 특히 TanStack v5 `query.data` narrowing OK), vite build 성공, eslint 0 error. (Hello 삭제로 인한 dangling import 없음.)

- [ ] **Step 4: 커밋**

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add mobile/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): wire main shell + 7 screens into router

중첩 MainLayout(/home·/map·/profile) + 풀스크린(/splits/new·/splits/:id·
/me/splits·/me/splits/participated, 모두 RequireAuth). Hello scaffold 제거.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: 최종 검증 + dev 루프 수동 확인 + 보고

**Files:** `CLAUDE.md` (체크리스트 갱신) 외 검증/보고

- [ ] **Step 1: 클라 전체 검증 (format/lint/test/build)**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile
pnpm format:check
pnpm lint
pnpm test:run
pnpm build
```
Expected: 4개 모두 통과. 신규 테스트 합계 — format(6) + nthingApi(16) + locationStore(3) + queries(5) + SplitCard(2) + MainLayout(3) + Home(4) + Map(1) + Profile(3) + CreateSplit(3) + SplitDetail(4) + SplitList(2) = **52 + 1.3/디자인시스템 기존 테스트** 전부 PASS. (format:check 실패 시 `pnpm format` 후 재커밋.)

- [ ] **Step 2: dev 루프 수동 검증 (브라우저)**

서버 + 클라 둘 다 띄워 클릭 검증:
```bash
# 터미널 A
cd /Users/mzc01-tngur1120/dev/toy/one-bite/server && ./gradlew bootRun
# 터미널 B
cd /Users/mzc01-tngur1120/dev/toy/one-bite/mobile && pnpm dev
```
브라우저 `http://localhost:5173` 에서 확인:
1. `/` → 비로그인 시 `/login`, "테스트 로그인 (개발용)" 클릭 → `/home`
2. `/home` → "근처 반띵" + 필터 칩 + (시드 데이터 있으면) SplitCard, 없으면 "아직 반띵이 없어요"
3. BottomNav 로 `지도`/`나` 이동 — 지도는 "지도는 곧 제공돼요", 나는 "나의 반띵" + 닉네임 + 메뉴
4. FAB(home/map) → `/splits/new` → 상품명/가격/수량/인원/주소 입력 → "1인당 예상 가격" 갱신 → "내 반띵 올리기" → 상세 이동
5. 상세에서 타인 글 "반띵할게요" / 본인 글 "취소하기" 동작, 마감 상태면 "마감된 반띵" 비활성
6. 프로필 → "내 나눠사기"/"참여한 나눠사기" 목록 진입, 로그아웃 → `/login`

> 시드 데이터가 없어 목록이 비면 `/splits/new` 로 1건 등록 후 `/home`·`/me/splits` 에서 노출 확인. 카카오맵/사진/실 GPS 는 Phase 1.5 라 placeholder/기본좌표로 동작하는 게 정상.

- [ ] **Step 3: CLAUDE.md 체크리스트 갱신 + 커밋**

루트 `CLAUDE.md` 의 "모바일 (Vite + React + Capacitor — 마이그레이션 Phase 1)" 항목에서 아래를 `[x]` 로 갱신:
- `[x] 7화면 React 이식 (Login/Home/Map/Profile/Create/Detail/List)` — Map 은 placeholder(1.5)
- `[x] Capacitor Plugins` 줄 위에 진행 메모: `- [~] 카카오맵 JS SDK (1.5), Capacitor Camera/Geolocation 실연동 (1.5)`

```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: mark Phase 1.4 (main shell + 7 screens) progress in CLAUDE.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: 결과 보고**

Run:
```bash
cd /Users/mzc01-tngur1120/dev/toy/one-bite
git log --oneline -16
```
기대 결과:
- Phase 1.4 커밋 ~13개 (format, api, locationStore, queries, SplitCard, MainLayout, Home, Map, Profile, CreateSplit, SplitDetail, SplitList, App, docs)
- `mobile/src/features/splits/` (queries/SplitCard), `routes/` (MainLayout/Home/Map/Profile/CreateSplit/SplitDetail/SplitList), `shared/api` (split/upload 타입+메소드), `shared/stores/locationStore`, `shared/lib/format`
- dev 로그인 → 홈 피드 → 등록 → 상세 참여/취소 → 내/참여 목록 루프가 브라우저에서 클릭으로 동작
- 다음: **Phase 1.5 — 네이티브 통합** (카카오맵 JS SDK, @capacitor/camera, @capacitor/geolocation, S3 presigned 실 PUT, locationStore.request, Apple/실 OAuth 라운드트립)

---

## Self-Review

작성 후 spec/요구 대비 점검 결과.

**1. Spec coverage**
- MainLayout(AppBar/BottomNav/FAB, /home·/map·/profile, 임시 Home 교체) → Task 6 + Task 13. ✔
- 화면 이식 Home/Map(placeholder)/Profile/CreateSplit/SplitDetail/SplitList → Task 7~12. ✔ (Login 은 1.3)
- features/splits: SplitCard + 훅(useSplits/useSplit/useMySplits/useParticipatedSplits + create/join/cancel), 스펙 쿼리 키 → Task 4, 5. ✔
- nthingApi splits/uploads (getSplits/getSplit/createSplit/joinSplit/cancelSplit=PATCH/signUpload/getMySplits/getParticipatedSplits) → Task 2. ✔ (서버 실제 계약 기준, api-spec 구버전 차이 명시)
- locationStore 스텁(current 보관) → Task 3. ✔ (request 는 1.5 로 명시)
- App.tsx 라우트 확장(/map,/profile,/splits/new,/splits/:id,/me/splits,/me/splits/participated) → Task 13. ✔
- 범위 밖(카카오맵/카메라/GPS/S3 PUT/Apple·실 OAuth) → Scope&Decisions 2,3 + Task 8/10 placeholder 경계. ✔

**2. Placeholder scan**
- "TODO/추후/적절히" 류 미사용. 모든 step 에 실제 코드/명령/기대출력 존재. 화면 placeholder(Map/사진 슬롯)는 "범위 밖"으로 의도적으로 명시된 스텁이며 빈칸이 아님. ✔

**3. Type consistency**
- `Split`/`PageResponse`/`CreateSplitRequest`/`GetSplitsParams`/`PresignRequest`/`PresignResponse` 명칭이 types(Task2)→nthingApi(Task2)→queries(Task4)→화면(Task7~12)에서 일관. ✔
- `splitKeys.{all,list,detail,my,participated}` 명칭이 queries 정의(Task4)와 mutation 무효화/테스트에서 일치. ✔
- 컴포넌트 prop(`StatusBadge status`, `Button variant/size/fullWidth/loading`, `TextField onChange:(v)=>void`, `Fab label/onClick/className`, `AppBar title/onBack/actions`)이 실제 구현(확인된 소스)과 일치. ✔
- 토큰 클래스 `text-body-em`(NOT bodyEmph), `bg-brand-surface`/`dark:bg-brand-surface-dark` 정확. ✔
- `cn()` = clsx 한정 → 색 override 회피(CreateSplit 미리보기 plain div, 취소 버튼 secondary 기본색). ✔
- lucide 아이콘(ImageIcon/MapPin/Camera/ChevronRight/Settings/User) 존재 확인됨. ✔
- TanStack v5: `useQuery` 결과 `isPending`/`isError`/`data`, `useMutation` `mutate`/`isPending`, `UseQueryResult` import — 일관. (narrowing 막힐 경우 대비 메모 Task7.) ✔

**4. 잠재 리스크 메모(실행자 참고)**
- `query.data` narrowing 이 특정 TS 버전에서 삼항 안에서 약하면, 해당 화면에서 `if (query.isPending) return ...; if (query.isError) return ...;` early-return 으로 바꾸면 안전(SplitDetail 은 이미 early-return).
- `pnpm format:check` 가 신규 파일에서 실패하면 `pnpm format` 후 해당 커밋에 포함.

---

## Phase 1.4 완료 후 다음 단계

- **Phase 1.5 — 네이티브 통합**: 카카오맵 JS SDK(`Map.tsx` 실연동 + 핀/슬라이드업), `@capacitor/camera`(CreateSplit 사진 → `signUpload` → S3 PUT → `imageUrl`), `@capacitor/geolocation`(`locationStore.request()` 추가 + Home/Create 실 좌표), Apple Sign in + 실 OAuth 라운드트립(1.3 보류분).
- **docs**: `docs/api-spec.md` 를 서버 실제 계약(GET /splits→PageResponse, join→Split, SplitResponse 확장 필드)으로 갱신.
- **실기기 E2E 스모크** (iOS/Android) + TestFlight/Play Internal.
