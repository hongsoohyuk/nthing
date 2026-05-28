# Nthing Phase 1.5 — Native Integration 설계 (Spec)

작성일: 2026-05-28

> Phase 1.4(Main Shell + 7 화면)까지 완료·머지된 상태에서, 1.4가 placeholder/스텁으로 둔 **3개 네이티브 기능**을 실제로 연결한다. 전부 **브라우저 우선 검증** 가능하도록 설계(Capacitor 플러그인 web fallback + KakaoMap JS + 실 S3), iOS/Android 기기 스모크는 후속 체크리스트.

## 1. Context

1.4 결과 현재 상태:
- **Map 탭**: "지도는 곧 제공돼요" placeholder.
- **CreateSplit 사진 슬롯**: `disabled` 스텁(촬영/업로드 없음), `createSplit` payload에 `imageUrl` 미포함.
- **위치**: `locationStore`는 `current` + `DEFAULT_COORDS`(서울시청)만. `request()` 없음 → Home/Create는 항상 `DEFAULT_COORDS` 사용.
- `nthingApi.signUpload(req)`는 시그니처만 존재(소비처 없음).

1.5에서 이 3개를 실제 동작으로 채운다.

## 2. Scope

### In scope (사용자 확정: "네이티브 3종")
1. **Geolocation** — `@capacitor/geolocation`(web fallback)로 실 위치 캡처 → `locationStore`.
2. **KakaoMap JS SDK** — 지도 탭 실연동(지도 + 근처 핀 + 현재위치 + 핀 탭 슬라이드업 카드).
3. **Camera + S3 업로드** — `@capacitor/camera`(web fallback)로 사진 선택/촬영 → presigned URL → S3 `PUT` → `imageUrl`을 등록에 포함.

### Out of scope (명시)
- **Apple Sign in + 실 OAuth 라운드트립** — 도메인 확보 + 실 client_id + provider 콘솔 redirect_uri 화이트리스트가 필요(`infra/CLAUDE.md` 체크리스트상 미완). **infra/도메인 단계**로 이월. 1.3의 보류 상태 유지(kakao/naver/google 릴레이 배선 + dev-login은 이미 있음).
- 푸시 알림(Phase 2), 백그라운드 위치 추적(Phase 3), 인앱 채팅·결제(Phase 2).

## 3. Stack / 의존성

| 항목 | 선택 | 비고 |
|------|------|------|
| 위치 | `@capacitor/geolocation` (^8) | web fallback = `navigator.geolocation` |
| 카메라 | `@capacitor/camera` (^8) | web fallback = `<input type=file>` / `getUserMedia` |
| 지도 | KakaoMap **JavaScript** SDK | `dapi.kakao.com/v2/maps/sdk.js` 동적 로드. **JavaScript 앱키** 사용 |
| 업로드 | 기존 `POST /api/uploads/sign` + S3 `PUT` | 서버 변경 없음. dev는 실 S3(AWS 설정됨) |

- Capacitor 메이저는 기존(`@capacitor/core ^8`)과 일치시킨다.
- 키는 `VITE_KAKAOMAP_APP_KEY` 환경변수로 주입(`mobile/.env.local`, gitignore). **키 값은 코드/문서/커밋에 절대 넣지 않는다.**

## 4. Architecture — 3 모듈 (의존 순서)

지도/홈/등록이 모두 위치에 의존하므로 **Geolocation → KakaoMap → Camera/Upload** 순으로 쌓는다.

### 4.1 Geolocation

- **`shared/stores/locationStore.ts`** 에 `request()` 추가:
  ```ts
  // 인터페이스 (1.4의 current/setCurrent/DEFAULT_COORDS 유지 + 추가)
  request: () => Promise<boolean>;  // 성공 시 setCurrent + true, 거부/실패 시 current 유지 + false
  ```
  - 구현: `@capacitor/geolocation` `Geolocation.checkPermissions()`/`requestPermissions()` → `getCurrentPosition()` → `setCurrent({lat,lng})`. 웹에서는 플러그인이 `navigator.geolocation`으로 폴백.
  - 권한 거부/타임아웃/에러 → `false` 반환, `current`는 건드리지 않음(소비처는 `current ?? DEFAULT_COORDS`로 항상 동작).
- **`features/location/useEnsureLocation.ts`**: `MainLayout` 마운트 시 1회 호출(인증된 탭 진입점). 이미 `current`가 있으면 skip. (CreateSplit 등 풀스크린은 MainLayout을 거쳐 들어오므로 별도 호출 불필요.)
- 소비처(변경 최소): Home/Map/CreateSplit는 이미 `current ?? DEFAULT_COORDS`를 읽으므로, `request()`가 `current`를 채우면 자동으로 실 위치 사용.

### 4.2 KakaoMap JS

- **`shared/lib/env.ts`**: `kakaoMapKey: import.meta.env.VITE_KAKAOMAP_APP_KEY ?? ''` 추가. **`env.d.ts`** 에 `VITE_KAKAOMAP_APP_KEY?: string` 추가.
- **`features/map/kakaoLoader.ts`**: `loadKakaoMaps(): Promise<KakaoMaps | null>`
  - `kakaoMapKey`가 비면 `null` 반환(→ placeholder).
  - `<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey={key}&autoload=false&libraries=services">` 1회 주입 → `window.kakao.maps.load(cb)` → `window.kakao.maps` 반환. 로드 Promise를 모듈 캐시(중복 주입 방지). 로드 실패 시 `null`.
- **`features/map/KakaoMap.tsx`**: 순수 래퍼
  ```ts
  type KakaoMapProps = {
    center: Coords;
    markers: Array<{ id: number; lat: number; lng: number }>;
    onMarkerClick: (id: number) => void;
  };
  ```
  - 마운트 시 `loadKakaoMaps()`; `null`이면 placeholder(현재 Map 탭 안내 UI 재사용)로 렌더. 성공 시 `<div ref>`에 지도 생성, `center`로 setCenter, `markers`로 핀 생성(클릭 → `onMarkerClick`), 현재위치 마커 별도 표기.
- **`routes/Map.tsx`** 교체: `useLocationStore.current ?? DEFAULT_COORDS` 중심 + `useSplits({lat,lng,radiusKm:3})` 결과를 `markers`로 → `KakaoMap`. 핀 탭 → 선택 split id 상태 → **BottomSheet**에 `SplitCard`(요약) + "반띵할게요" 버튼(→ `/splits/:id`). 로딩/에러는 기존 상태 컴포넌트.
- **`shared/components/BottomSheet.tsx`** (신규): backdrop + 하단 슬라이드업 패널(radius-xl top, `shadow-overlay`), backdrop/X 클릭 시 닫힘. 디자인 brief 5.3의 슬라이드업 카드.

### 4.3 Camera + S3 Upload

- **`features/upload/useImagePicker.ts`**: `pickImage(): Promise<{ blob: Blob; contentType: 'image/jpeg' } | null>`
  - `@capacitor/camera` `Camera.getPhoto({ quality: 85, resultType: Uri/DataUrl, source: Prompt })` → blob 변환. 웹은 플러그인 폴백(파일 선택). 취소 → `null`. JPEG 0.85.
- **`features/upload/uploadImage.ts`**: `uploadImage(blob, contentType): Promise<string>`
  - `nthingApi.signUpload({ contentType, size: blob.size })` → `fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType } })` → 200 확인 → `publicUrl` 반환. 비2xx/네트워크 실패 → throw(상위에서 에러 표시).
- **`routes/CreateSplit.tsx`** 수정: `disabled` 사진 슬롯 → 활성. 탭 → `pickImage()` → 미리보기 + 업로드 진행 표시(`uploading` 상태) → 성공 시 `imageUrl` 상태 저장(썸네일 표시). 제출 시 `createSplit` payload에 `imageUrl` 포함(없으면 미포함 — 사진은 선택). 업로드 실패 시 에러 메시지 + 재시도, 사진 없이도 등록 가능 유지.

### 4.4 Capacitor 셋업 / 네이티브 권한

- `pnpm add @capacitor/camera@^8 @capacitor/geolocation@^8` → `npx cap sync`.
- iOS `Info.plist`: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription` 사용 설명 추가.
- Android: 플러그인이 권한 선언 제공(CAMERA / ACCESS_FINE_LOCATION) — manifest 확인.
- ⚠️ **워크트리 주의**: 의존성 설치는 `pnpm --dir <worktree>/mobile`로, 워크트리 node_modules가 main과 분리됨([[feedback_worktree_symlink_deps]]).

## 5. Data Flow

```
인증 후 진입 → locationStore.request()  (1회)
                       │  성공: current = 실 좌표 / 실패: null(→ DEFAULT_COORDS)
                       ▼
   Home/Map/Create  →  useSplits({ lat, lng, radiusKm:3 })  →  근처 반띵
                       ▼
   Map: KakaoMap(center=current, markers=splits) → 핀 탭 → BottomSheet → /splits/:id
   Create: pickImage → uploadImage(signUpload→S3 PUT) → imageUrl → createSplit
```

## 6. Error handling

| 상황 | 처리 |
|------|------|
| 위치 권한 거부/실패 | `request()` → `false`, `current` 유지(없으면 `DEFAULT_COORDS`로 동작). 앱 정상. |
| KakaoMap 키 없음/SDK 로드 실패 | `loadKakaoMaps()` → `null` → Map 탭 placeholder. dev 시각검증만 보류. |
| 카메라 취소 | no-op(슬롯 그대로). |
| 업로드 실패(presign 4xx / PUT 실패) | 에러 메시지 + 재시도. 사진 없이 등록 가능. |
| 핀 데이터 없음 | 지도만 표시(빈 핀). |

## 7. Testing 전략

- **브라우저 우선(주 검증)**: `pnpm dev` + `VITE_KAKAOMAP_APP_KEY` + 콘솔에 `localhost:5173` 도메인 등록 → 지도 실렌더/핀/슬라이드업. 위치=브라우저 geolocation 권한(localhost는 비-HTTPS여도 허용). 카메라=파일선택 폴백. 업로드=실 S3 PUT(AWS 설정됨). 단위 테스트: 로더/스토어/업로드 함수/래퍼는 Vitest+RTL(외부 SDK·플러그인 mock).
- **기기 스모크(후속 체크리스트, 1.5 코드 완료 후 별도)**: `npx cap sync` → iOS/Android 실행. 카메라/GPS 실제 권한 다이얼로그, 지도 제스처 확인.
  - ⚠️ **네이티브 KakaoMap origin**: webview origin(Android `https://localhost`, iOS `capacitor://localhost`)을 카카오 콘솔 도메인에 등록 필요. `capacitor://`를 콘솔이 거부하면 Capacitor `server` 설정으로 origin을 등록 가능한 http(s)로 맞추거나 운영 도메인 사용 — 기기 빌드 단계에서 처리.
  - 권한 plist/manifest 문구 실제 노출 확인.

## 8. 환경 변수 (추가)

```
VITE_KAKAOMAP_APP_KEY=<Kakao JavaScript 앱키>   # mobile/.env.local (gitignore), 콘솔 Web 도메인에 localhost:5173 등록
```
기존: `VITE_API_BASE_URL`(dev=`/api` 프록시), `VITE_KAKAO_REST_KEY`(OAuth authorize) 등은 그대로. (사용자 메모리: `.env.example` 파일 생성 금지 → README에 문서화.)

## 9. Risks

1. **네이티브 KakaoMap origin 등록**(`capacitor://localhost`) — 기기 단계 리스크(§7).
2. **iOS ATS** — S3는 HTTPS라 무관. (개발 중 EIP HTTP API는 별도 ATS 예외 — infra 문서.)
3. **카메라 web 폴백 UX**가 네이티브와 다름(파일 선택 vs 카메라) — 기능상 동등, UX 차이만.
4. **geolocation 정확도/타임아웃** — 적절한 타임아웃 + 실패 시 DEFAULT_COORDS 폴백으로 완화.

## 10. 기술 결정 로그 (이번 spec)

| 결정 | 이유 | 대안 |
|------|------|------|
| 지도: KakaoMap **JS** SDK (네이티브 SDK 아님) | React+Capacitor web-first, 브라우저 검증 가능, KMP 네이티브 map 코드 비호환 | 네이티브 vectormap SDK(웹 검증 불가) |
| `@capacitor/camera`·`@capacitor/geolocation`(web fallback) | 브라우저 검증 + 네이티브 셸 동시 충족, 사용자 web 친숙 선호 부합 | 순수 web API 직접 사용(네이티브 권한 흐름 누락) |
| dev에서 **실 S3** 업로드 | AWS 로컬 설정 보유 → 실 presigned PUT 로컬 검증 가능 | dev 스텁(실 경로 후속 검증 필요) |
| Apple/실 OAuth **1.5 제외** | 도메인+실키+redirect 화이트리스트(infra) 선행 필요 | 1.5 포함(상당부분 stub/blocked) |

## 11. 영향받는 파일(요약)

- **신규**: `features/map/kakaoLoader.ts`, `features/map/KakaoMap.tsx`, `features/upload/useImagePicker.ts`, `features/upload/uploadImage.ts`, `features/location/useEnsureLocation.ts`, `shared/components/BottomSheet.tsx` (+ 각 테스트).
- **수정**: `shared/stores/locationStore.ts`(`request()`), `shared/lib/env.ts`+`env.d.ts`(`VITE_KAKAOMAP_APP_KEY`), `routes/Map.tsx`(실 지도), `routes/CreateSplit.tsx`(사진 업로드), `MainLayout.tsx`(최초 위치 요청 — `useEnsureLocation`), `package.json`(플러그인), iOS `Info.plist`/Android manifest(권한).
- **서버**: 변경 없음.
