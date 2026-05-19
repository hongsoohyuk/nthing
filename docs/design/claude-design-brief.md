# Nthing (엔띵) — Claude Design Brief

> **2026-05-18 브랜드 업데이트**: 원래 한입(One Bite)로 작성됐던 brief이고 mockup도 그 이름으로 생성됨. 이후 **Nthing(엔띵)**으로 리브랜딩. 핵심 카피톤은 CLAUDE.md "카피톤" 섹션 표준을 따르고, mockup의 워드마크/한입 카피는 React 이식 시점에 "Nthing"/"반띵"으로 일괄 치환.

> **Usage**: claude.ai/design 에 이 문서 전체를 그대로 붙여넣고 "다음 사양으로 Nthing 모바일 앱의 화면을 만들어줘. 7개 화면 × Light/Dark = 14 컴포지션, iPhone 14 (414×896) 사이즈, Pretendard 폰트로." 라고 요청.

---

## 1. Product Context

**Nthing(엔띵)** — "반띵하자"라는 한국 일상 구어에서 출발한 위치 기반 소셜 커머스 모바일 앱.
벌크/묶음 상품을 근처 사람과 N분의 1로 나눠 구매한다.

### 핵심 시나리오
1. 유저 A가 매장에서 "두쫀쿠 4개입(2만원)" 발견 → 2개만 원함
2. 앱에서 등록 (위치, 사진, 가격, 나눌 수량)
3. 근처 유저 B에게 노출 → 참여
4. 만나서 상품·돈 교환

### 타겟
20~35세, 1~2인 가구, 합리적 소비, 동네 활동 활발.

---

## 2. Design Direction

### 무드
- **세련/미니멀** — 토스(Toss), Linear, Vercel 계열
- **목적 명확** — 정보 위계 또렷, 액션 명료
- **친근 위트는 카피에서만 발산** — 디자인은 절제

### 6 원칙
1. **위계 우선** — 한 화면 폰트 크기 4단계 이내
2. **흑백 베이스, 그린 한 스푼** — 90%는 흑/회/백, 그린은 CTA·선택·배지만
3. **여백이 디자인** — 8px grid, 컨테이너 16px, 섹션 24~32px
4. **직각에 가까운 라운딩** — 카드 12, 버튼 10, 입력 8
5. **모션 절제** — 200~250ms easeOut, 상태 전환에만
6. **카피톤 친근** — "참여하기" → "반띵할게요", "등록" → "반띵 등록하기" / "내 반띵 올리기"

---

## 3. Design Tokens

### Brand Color
Nthing의 시그니처는 **딥 그린** — 동네에서 신선한 것들을 N분의 1로 나누는 느낌. 한국 메이저 푸드/거래 앱들과 컬러가 겹치지 않는 차별화 포인트.

| 토큰 | HEX | 용도 |
|------|-----|------|
| BrandGreen | `#16A34A` | 시그니처, CTA, 액티브 상태 |
| BrandGreenPressed | `#15803D` | 눌림 상태 |
| BrandGreenSurface (light) | `#DCFCE7` | 배지/하이라이트 배경 |
| BrandGreenSurface (dark) | `#14271A` | 배지/하이라이트 배경 |
| BrandGreenAdjusted (dark) | `#22C55E` | 다크모드에서 가독성 보정 |

### Neutral Scale (Zinc 계열)
```
Gray 50   #FAFAFA      Gray 500  #71717A
Gray 100  #F4F4F5      Gray 600  #52525B
Gray 200  #E4E4E7      Gray 700  #3F3F46
Gray 300  #D4D4D8      Gray 800  #27272A
Gray 400  #A1A1AA      Gray 900  #18181B
                       Gray 950  #09090B
```

### Semantic — Light Theme
| 토큰 | 값 |
|------|-----|
| background | `#FFFFFF` |
| surface | `#FFFFFF` |
| surfaceMuted | Gray 50 |
| onSurface | Gray 900 |
| onSurfaceVariant | Gray 500 |
| outline | Gray 200 |
| success | `#0EA5E9` (sky — brand 그린과 시각 구분) |
| warning | `#F59E0B` |
| error | `#DC2626` |

### Semantic — Dark Theme
| 토큰 | 값 |
|------|-----|
| background | Gray 950 (`#09090B`) |
| surface | Gray 900 (`#18181B`) |
| surfaceMuted | Gray 800 (`#27272A`) |
| onSurface | Gray 50 |
| onSurfaceVariant | Gray 400 |
| outline | Gray 700 |
| success | `#38BDF8` (sky — brand 그린과 시각 구분) |
| warning | `#FBBF24` |
| error | `#EF4444` |

### Typography — Pretendard
Pretendard import: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css`

| 토큰 | Size | Weight | LineHeight | 용도 |
|------|------|--------|------------|------|
| display | 28 | 700 | 36 | 화면 메인 타이틀 (상세 상품명) |
| h1 | 22 | 700 | 30 | AppBar 타이틀, 섹션 타이틀 |
| h2 | 18 | 600 | 26 | 카드 타이틀, 리스트 항목 |
| body | 15 | 400 | 22 | 본문, 설명 |
| bodyEmph | 15 | 600 | 22 | 가격, 강조 |
| caption | 13 | 400 | 18 | 메타(거리, 시간) |
| meta | 12 | 500 | 16 | 배지 텍스트 |

### Spacing (8px grid)
`2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`

### Radius
- Pill (Chip/Badge): `999` (full)
- Input: `8`
- Button: `10`
- Card: `12`
- Sheet / Dialog top corners: `16`

### Elevation (Light only — Dark에선 outline 1px로 대체)
- `card`: `0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)`
- `raised`: `0 4px 12px rgba(0,0,0,0.08)`
- `overlay`: `0 8px 24px rgba(0,0,0,0.12)`

---

## 4. Component Library

### Primary Button
- Height 52 / Radius 10 / Padding 0 20
- BrandGreen fill + White text (bodyEmph)
- Pressed: BrandGreenPressed
- Disabled: BrandGreen 30% alpha

### Secondary Button
- Height 52 (또는 컴팩트 44) / Radius 10
- Outline 1px Gray200 + Gray800 text (Light) / Gray700 outline + Gray100 text (Dark)

### Text Button
- 패딩만 / 색상 onSurfaceVariant / 호버 시 8% surfaceMuted

### TextField (Outlined)
- Height 52 / Radius 8 / Outline 1px Gray200
- Focus: outline BrandGreen 1.5px
- Floating label (Top), Placeholder Gray400, Supporting text below
- Error: outline error + supporting text error

### Card
- Surface bg / Radius 12 / Padding 16
- Light: card elevation
- Dark: outline 1px Gray700, no elevation

### Chip / Badge (Pill)
- Padding 8×4 / meta typography
- 상태별:
  - WAITING(모집중): BrandGreenSurface + BrandGreen ← 액티브 강조
  - MATCHED(매칭됨): surfaceMuted + onSurface ← 진행중이라 차분히
  - COMPLETED(완료): surfaceMuted + onSurfaceVariant
  - CANCELLED(취소됨): surfaceMuted + onSurfaceVariant

### AppBar
- Height 56 (+ safe area)
- 배경 surface, 구분선 없음 (스크롤 시 1px outline 추가)
- Title h1 (좌측 정렬 기본, 모달일 땐 중앙)
- Action 아이콘 24

### Bottom Navigation
- Height 64 + safe area
- 3 탭: 홈 / 지도 / 나
- Active: BrandGreen icon + label
- Inactive: Gray400
- 아이콘 24 / 라벨 11

### FAB (Floating Action Button)
- 56×56 원형 / BrandGreen fill / White plus 아이콘
- 위치: bottom-right, BottomNav 위로 16px

### SplitCard (한입 핵심 카드)
- Card 기반
- 이미지 영역: 16:9, 카드 상단 (없을 때 Gray100 + 이미지 placeholder 아이콘)
- Content padding 16:
  - 행 1: 상품명 (h2) + 우측 StatusBadge
  - 행 2: 위치 텍스트 + "·" + 거리 + "·" + 시간 (caption, onSurfaceVariant)
  - 행 3: 좌 "1인당 ₩10,000" (bodyEmph, BrandGreen) / 우 "2명 모집" (caption)

---

## 5. Screens — 7개 (각 Light + Dark)

### 5.1 LoginScreen (로그인)
**목적**: 첫 진입, OAuth 4종 + 둘러보기

레이아웃:
- 상단 1/3 지점부터 시작
- 워드마크 "한입" — 36pt bold, BrandGreen
- 서브카피 "동네에서 한 입씩 나눠요" — body, onSurfaceVariant
- 64px spacer
- 소셜 버튼 4개 (각 height 52, gap 10):
  1. **카카오**: bg `#FEE500`, 글자 `rgba(0,0,0,0.85)`, 말풍선 로고
  2. **네이버**: bg `#03A94D`, 글자 White, N 로고
  3. **Google**: bg White, outline `#747775`, 글자 `#1F1F1F`, 멀티컬러 G
  4. **Apple**: bg Black, 글자 White, 사과 로고
- 16px gap → "둘러보기" TextButton (Gray500)

### 5.2 HomeTab (메인 — 홈 탭)
**목적**: 근처 나눠사기 피드

레이아웃:
- AppBar:
  - 좌: "근처 한입" h1 + "역삼동 ▼" 칩 (작은, Gray700)
  - 우: 알림 종 아이콘 + 빨간 닷
- 필터 칩 행 (가로 스크롤, 패딩 16): `전체` / `모집중` / `음식` / `생필품` / `마감임박`
  - 액티브: BrandGreen fill + White / 비액티브: outline Gray200
- LazyColumn 패딩 16, gap 12:
  - SplitCard × N
- FAB (BrandGreen ⊕) — bottom-right 16
- BottomNav (홈 액티브)

### 5.3 MapTab (메인 — 지도 탭)
**목적**: 지도 + 핀

레이아웃:
- 풀스크린 지도 (mockup용으로 도시 지도 이미지)
- 상단 플로팅 검색 카드 (top 16, side 16, height 48, radius 12, elevation raised):
  - 돋보기 아이콘 + "장소 검색"
- 상단 우측 작은 칩: "현재 위치" 아이콘 (filled BrandGreen round, 40)
- 핀: BrandGreen 원형 32, white 중심 점
- 선택된 핀 → 하단 슬라이드업 카드 (radius 16 top, padding 16):
  - 좌: 이미지 80x80 / 우: 상품명 h2 + 거리·시간 + 인당 가격 (BrandGreen) + "한 입 할게요" Primary Button (컴팩트 44)
- BottomNav (지도 액티브)

### 5.4 ProfileTab (메인 — 프로필 탭)
**목적**: 내 정보 + 메뉴

**Variant A — Guest (로그인 X)**:
- 상단 80px spacer
- 빈 아바타 80 (Gray100 원, 사람 아이콘 Gray400)
- 16px spacer
- "로그인하면 더 많은 기능을" h2
- "한 입씩 나누고 받은 알림도 확인하세요" body, onSurfaceVariant, center
- 24px spacer
- "로그인하기" Primary Button (width 240)

**Variant B — Logged in**:
- 프로필 카드:
  - 아바타 64 + 닉네임 (h1) + 작은 "닉네임 변경" TextButton
  - 우측 상단 설정 아이콘
- 24px spacer
- 메뉴 리스트 (각 height 56, divider Gray100 1px):
  - 내 나눠사기 (chevron)
  - 참여한 나눠사기 (chevron)
  - 알림 설정 (toggle)
  - 약관 / 개인정보 (chevron)
- 32px spacer
- "로그아웃" TextButton (Gray500, center)
- BottomNav (나 액티브)

### 5.5 CreateSplitScreen (등록)
**목적**: 사진 + 폼

레이아웃:
- AppBar: 좌 ← + 타이틀 "내 한입 올리기"
- ScrollView (padding 24, gap 16):
  - 사진 슬롯: full width × 180, Gray100 bg, radius 12, center "+ 사진 추가" + 캡션 "탭하여 카메라/갤러리"
  - TextField "상품명" placeholder "예: 두쫀쿠 4개입"
  - TextField "전체 가격" placeholder "20000" + suffix "원"
  - TextField "전체 수량" placeholder "4" + suffix "개"
  - TextField "나눌 인원" placeholder "2" + suffix "명 (최소 2명)"
  - TextField "주소" + trailing GPS 아이콘 (BrandGreen, 캡쳐 완료 시 채워짐) + supporting text "GPS: 37.5024, 127.0344"
  - 인당 가격 미리보기 카드 (BrandGreenSurface bg, padding 16):
    - 좌 "1인당 예상 가격" body / 우 "₩10,000" h1 (BrandGreen)
- 하단 고정 영역:
  - 상단 1px outline
  - Primary Button "내 한입 올리기" (full width, padding 16+16)

### 5.6 SplitDetailScreen (상세)
**목적**: 정보 + 참여/취소

레이아웃:
- AppBar (transparent, 이미지 위에 떠있음): ← + 우측 공유 아이콘
- 상품 이미지 (full width, 16:9)
- ScrollView 본문 padding 24, gap 24:
  - 행: 상품명 (display) + StatusBadge
  - 작성자 행 (gap 8): 아바타 32 + 닉네임 (body) + "·" + "1km" (caption)
  - 1px outline 구분선
  - 가격 박스:
    - "1인당" caption + "₩10,000" display BrandGreen
    - 행: "전체 가격" body / "₩20,000" body
    - 행: "전체 수량" body / "4개" body
    - 행: "나눌 인원" body / "2명" body
  - 1px outline 구분선
  - 위치 섹션:
    - "위치" h2
    - 작은 지도 카드 160 + 핀 (radius 12)
    - 주소 텍스트 (body)
  - 등록일·상태 (caption, onSurfaceVariant)
- 하단 고정 영역 (1px outline 위, padding 16):
  - **본인 게시물**: "취소하기" Secondary Button (error 컬러)
  - **타인 게시물**: "한 입 할게요" Primary Button
  - **모집 완료/취소**: disabled Primary "마감된 한입"

### 5.7 SplitListScreen (내 / 참여한 나눠사기)
**목적**: 내 게시물 또는 참여한 게시물 리스트 (둘이 공유)

레이아웃:
- AppBar: ← + 타이틀 "내 나눠사기" 또는 "참여한 나눠사기"
- 상단 세그먼트 컨트롤 (2 탭 Pill, padding 16): `진행중` / `완료`
  - 액티브: surfaceMuted bg + onSurface text / 비액티브: text only Gray500
- LazyColumn (SplitCard들)
- **Empty 상태**:
  - 중앙: Gray100 박스 240×240 (일러스트 placeholder)
  - "아직 한입이 없어요" h2
  - "첫 한입을 올려보세요" body, Gray500
  - Primary Button "내 한입 올리기"

---

## 6. 공통 상태

### Empty
- 일러스트 자리 (Gray100 박스 220×220, 가운데 큰 음식 아이콘)
- 타이틀 h2 / 서브 body Gray500
- 필요 시 액션 Primary Button

### Loading
- 풀스크린 또는 인라인 spinner (BrandGreen 32)
- "...불러오는 중" caption (선택)

### Error
- ! 아이콘 (40, error)
- 메시지 body Gray700
- "다시 시도" Secondary Button

---

## 7. Output Request (Claude Design에 명시)

- 총 컴포지션: **7 화면 × 2 모드 (Light/Dark) = 14**
- 사이즈: **iPhone 14 (414×896)**, 안전영역 표시
- 폰트: **Pretendard** (위 CDN으로 import)
- 정적 mockup으로 충분 (인터랙티브 프로토타입 불필요)
- 재사용 컴포넌트(Button/Card/Badge/TextField/AppBar)는 한 번 정의 후 재사용
- Export: **standalone HTML 1개 파일** (Pretendard 임베드, 다크모드 토글 포함)

---

## 8. 참고 — 현재 코드와의 매핑

이 디자인은 다음 KMP Compose 화면을 리뉴얼하기 위함입니다.

| 화면 | Compose 파일 |
|------|--------------|
| LoginScreen | `mobile/.../ui/screen/LoginScreen.kt` |
| HomeTab | `mobile/.../ui/screen/tab/HomeTab.kt` |
| MapTab | `mobile/.../ui/screen/tab/MapTab.kt` |
| ProfileTab | `mobile/.../ui/screen/tab/ProfileTab.kt` |
| CreateSplitScreen | `mobile/.../ui/screen/CreateSplitScreen.kt` |
| SplitDetailScreen | `mobile/.../ui/screen/SplitDetailScreen.kt` |
| SplitListScreen | `mobile/.../ui/screen/SplitListScreen.kt` |
| SplitCard 컴포넌트 | `mobile/.../ui/component/SplitCard.kt` |
| Theme | `mobile/.../ui/theme/Theme.kt` |

디자인 토큰을 Compose `Color`/`TextStyle` 객체로 1:1 매핑 후, 각 Composable을 점진적으로 교체합니다.
