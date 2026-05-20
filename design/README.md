# Handoff: NThing (엔띵) — Mobile App + Landing Page

> 위치 기반 소셜 커머스 / "이거 N띵 할 사람!"
> 동네에서 벌크·묶음 상품을 나눠 구매하는 서비스

---

## 1. About the Design Files

이 폴더의 HTML/JSX 파일은 **디자인 레퍼런스(프로토타입)**입니다. 의도된 시각·동작을 보여주는 목적이며, 그대로 프로덕션에 넣는 코드가 아닙니다.

목표는 이 디자인을 **타겟 코드베이스의 환경**(React Native / Flutter / Next.js / Vue 등)에 맞춰 **재구현**하는 것입니다. 코드베이스가 아직 없다면 가장 적절한 프레임워크를 선택해 구현하세요.

**Fidelity**: 하이파이(hifi). 색상·타이포·간격·라운딩·엘리베이션 모두 최종값입니다. 픽셀 단위로 충실히 재현하세요.

---

## 2. 파일 구조

```
design_handoff_nthing/
├── README.md                  ← 이 문서
├── app/
│   ├── One Bite App.html      ← 호스트 페이지 (디자인 캔버스)
│   ├── screens.jsx            ← 7개 화면 × Light/Dark React 컴포넌트
│   └── design-canvas.jsx      ← 캔버스 셸 (구현 시 무시)
└── landing/
    └── NThing Landing.html    ← 랜딩 페이지 (standalone)
```

> **참고**: 모바일 앱 파일(`app/`)은 이전 브랜드명 "한입"으로 작성되어 있습니다. 워드마크/카피만 "NThing / N띵"으로 치환해 사용하세요. 컬러·구조·컴포넌트는 그대로 유효합니다. (예: `근처 한입` → `근처 N띵`, `내 한입 올리기` → `내 N띵 올리기`)

---

## 3. Design Tokens

모든 화면이 공유하는 토큰. 코드베이스의 디자인 시스템에 맞춰 변수/테마로 옮기세요.

### 3.1 Brand
| Token | Light | Dark |
|---|---|---|
| `brand` | `#16A34A` | `#22C55E` (가독성 보정) |
| `brand-pressed` | `#15803D` | `#16A34A` |
| `brand-surface` | `#DCFCE7` | `#14271A` |
| `brand-on-surface` (텍스트) | `#15803D` | `#22C55E` |
| `brand-on` (브랜드 위 글자) | `#FFFFFF` | `#06140C` |

### 3.2 Neutral (Zinc 스케일)
```
50  #FAFAFA   100 #F4F4F5   200 #E4E4E7   300 #D4D4D8
400 #A1A1AA   500 #71717A   600 #52525B   700 #3F3F46
800 #27272A   900 #18181B   950 #09090B
```

### 3.3 Semantic — Light / Dark

| Role | Light | Dark |
|---|---|---|
| `bg` | `#FFFFFF` | `#09090B` |
| `bg-elev` (보조 섹션) | `#FAFAFA` | `#0F0F11` |
| `surface` (카드) | `#FFFFFF` | `#18181B` |
| `surface-muted` | `#F4F4F5` | `#27272A` |
| `surface-inverse` (다크 CTA) | `#18181B` | `#FAFAFA` |
| `text` | `#18181B` | `#FAFAFA` |
| `text-muted` | `#71717A` | `#A1A1AA` |
| `text-faint` | `#A1A1AA` | `#71717A` |
| `border` | `#E4E4E7` | `#27272A` |
| `border-soft` | `#F4F4F5` | `#27272A` |
| `border-strong` | `#D4D4D8` | `#3F3F46` |
| `success` (의미적) | `#0EA5E9` | `#38BDF8` |
| `error` | `#DC2626` | `#EF4444` |

> **중요**: `success`는 sky 계열로 분리되어 있습니다. 브랜드가 그린이라 두 신호가 충돌하지 않도록 의도적으로 분리했어요.

### 3.4 Typography (Pretendard)

```
display    28px / 36px  / 700 / -0.02em
h1         22px / 30px  / 700 / -0.01em
h2         18px / 26px  / 600 / -0.01em
body       15px / 22px  / 400
bodyEmph   15px / 22px  / 600
caption    13px / 18px  / 400
meta       12px / 16px  / 500 / +0.01em
```

랜딩은 더 큰 디스플레이 스케일을 씁니다: hero `64px/700`, section h2 `44px/800`, 본문 `19px/400`.

### 3.5 Spacing & Radius

- **Grid**: 8px base. 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64
- **Radius**: chip/badge `999`, button/textfield `10`, card `12`, large card `16`, hero `20`, sheet/download `28`, phone bezel `44`
- **Touch target**: minimum 44×44pt

### 3.6 Elevation

| Token | Light | Dark |
|---|---|---|
| `shadow-card` | `0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06)` | `none` (대신 `1px solid border` 사용) |
| `shadow-raised` | `0 4px 12px rgba(0,0,0,.08)` | `0 6px 18px rgba(0,0,0,.5)` |
| `shadow-overlay` | `0 20px 60px rgba(0,0,0,.12), 0 8px 24px rgba(0,0,0,.06)` | `0 24px 60px rgba(0,0,0,.6), 0 8px 24px rgba(0,0,0,.4)` |
| FAB shadow | `0 6px 16px rgba(22,163,74,.32)` | `0 6px 16px rgba(0,0,0,.5)` |

### 3.7 Status Badge

| Status | Light bg / fg | Dark bg / fg | 라벨 |
|---|---|---|---|
| WAITING | `#DCFCE7 / #15803D` | `#14271A / #22C55E` | 모집중 |
| URGENT | 동일 (brand surface) | 동일 | 마감임박 |
| MATCHED | `#F4F4F5 / #18181B` | `#27272A / #FAFAFA` | 매칭됨 |
| COMPLETED | `#F4F4F5 / #71717A` | `#27272A / #A1A1AA` | 완료 |
| CANCELLED | 동일 (COMPLETED와 같음) | 동일 | 취소됨 |

> **주의**: MATCHED는 브랜드 그린과 시각 충돌을 피하기 위해 일부러 neutral surface입니다. 강조가 아닌 차분한 acknowledgement로 읽히도록 의도된 디자인입니다.

---

## 4. Mobile App Screens

타겟: **iPhone 14 (414 × 896pt)**. Status bar 44pt, Home indicator 영역 24pt 고려.

`app/screens.jsx`에 모든 화면이 React 컴포넌트로 정의되어 있습니다. 각각 `mode: 'light' | 'dark'` prop을 받습니다.

### 4.1 LoginScreen
- 1/3 지점에 워드마크 "NThing" (48px / 800 / brand)
- 그 아래 태그라인 "동네에서 N띵하세요"
- 하단 OAuth 4종 (카카오 / 네이버 / Google / Apple) + "둘러보기" 텍스트 버튼
- OAuth 버튼: 52pt height, 10px radius, 좌측에 마크(20pt) 절대위치, 가운데 라벨
- 카카오 `#FEE500`, 네이버 `#03C75A`, Google `#FFFFFF + #747775 border`, Apple `#000000`
- 상표 로고 대신 일반 마크 사용 (개발 시 실제 로고로 교체)

### 4.2 HomeTab
- AppBar: 좌측 "근처 N띵 [역삼동 ▾]" (위치 셀렉터 칩) / 우측 알림 벨 + 빨간 dot
- 필터 칩 행: 전체 / 모집중 / 음식 / 생필품 / 마감임박 (가로 스크롤)
- 카드 피드: SplitCard 컴포넌트 12px gap
- FAB: 우하단, 56pt, brand fill, plus 아이콘, 브랜드 그림자
- BottomNav: 홈 / 지도 / 나 (active=brand, inactive=text-faint)

#### SplitCard 사양
```
16:9 placeholder image (radius 0, 상단)
─ padding 16
  title (h2) ─── StatusBadge
  caption (location · distance · time) — muted
  brand bodyEmph "1인당 ₩X" ─── caption "N명 모집" — muted
```

### 4.3 MapTab
- 전체 화면 도식 지도 (status bar 위로 overlay)
- 상단 floating: 검색 박스 + 현재위치(crosshair) 버튼 (둘 다 raised shadow)
- 핀: 32pt 원, brand fill, 선택 시 6px brand 22% alpha halo + 3px white border + scale 1.15
- 하단 슬라이드업 카드: 16px top radius, drag handle 36×4pt
- 카드 내용: 80×80 썸네일 + 제목/메타/가격 + "한 입 할게요" 컴팩트 primary 버튼

### 4.4 ProfileTab
**4a Guest**: 비로그인. 중앙 정렬 아바타 + 안내 카피 + 로그인하기 primary 버튼.

**4b Logged In**:
- 프로필 카드: 아바타(64pt, brand surface, brand 이니셜) + 닉네임(h1) + "닉네임 변경" 텍스트 버튼
- 통계 행: 3분할 (올린 / 참여한 / 진행중), 각 h1 숫자 + caption 라벨
- 메뉴 리스트: 56pt rows, chevron 또는 토글 (46×28pt, brand=on)
- 하단 "로그아웃" 텍스트 버튼

### 4.5 CreateSplitScreen
- AppBar: 좌측 back, 가운데 "내 N띵 올리기"
- 사진 슬롯: 180pt height, 1px dashed border, 카메라 아이콘 + "사진 추가"
- TextField 5개: 상품명 / 전체 가격(suffix "원") / 전체 수량(suffix "개") / 나눌 인원(suffix "명 (최소 2명)") / 주소(trailing GPS chip)
- TextField focus 상태: 1.5px brand border + brand 라벨
- 미리보기 카드: brand-surface 배경, "1인당 예상 가격" + 큰 가격 (28pt / 700 / brand)
- 하단 고정 bar: "내 N띵 올리기" primary 버튼

### 4.6 SplitDetailScreen
- 상단 풀블리드 이미지 (16:9 + status bar 영역), 가독성 그라데이션 오버레이
- Floating back/share 버튼: 40pt, 검정 40% alpha + backdrop-blur
- 본문: 제목(display) + 상태 배지 / 작성자 row / divider / 1인당 큰 가격(32pt brand) + 전체가격·수량·인원 표 / divider / 위치 + 미니맵
- 하단 CTA (ownership에 따라):
  - other: "한 입 할게요" primary
  - self: "취소하기" outlined danger
  - closed: "마감된 한입" disabled

### 4.7 SplitListScreen
- AppBar: back + "내 나눠사기"
- Segmented control: 진행중 / 완료 (40pt height, surface-muted bg, active pill에 surface bg)
- 본문: SplitCard 목록 OR Empty 상태 (240pt placeholder + 안내 카피 + primary 버튼)

---

## 5. Landing Page (`landing/NThing Landing.html`)

데스크탑 우선 (max-width 1200px), 모바일 반응형. 다크모드 토글 포함.

### 섹션 구성
1. **Nav** (sticky, 64pt, blur backdrop)
   - 좌: 워드마크 (mark 28pt + "NThing")
   - 우: 테마 토글(40pt) + "앱 다운로드" CTA (40pt, surface-inverse)
2. **Hero** (96/64pt padding)
   - 좌: eyebrow chip + h1 "이거 [N띵] 할 사람!" (64px / 800, accent에 brand surface 하이라이터) + 본문 + CTA 2개 + 메타 3개
   - 우: 320×660 폰 목업 (notch 110×28, brand surface가 적용된 카드 포함) + 떠다니는 콜아웃 2개
   - 우상단 600pt 그린 글로우 radial gradient
3. **How it works** (4-step grid, bg-elev)
   - 발견 → 등록 → 매칭 → 완료, 카드 사이 화살표 커넥터 (마지막은 hidden)
4. **Why NThing** (3-col)
   - 위치 기반 매칭 / 실시간 알림 / 안전 거래
   - 각 카드 상단 200pt 비주얼 + h3 + 설명 + 태그
   - 비주얼은 SVG 도식 (지도 / 다크 노티 / 체크리스트)
   - hover: border → brand, translateY -2
5. **Savings** (3-col, bg-elev)
   - 3개 상품 비교 카드 (원가 → 1인당, brand 강조)
6. **Download** (다크 강제, 28pt radius, 56pt padding, margin 24)
   - 상단 그린 글로우, App Store / Google Play 일반 마크 버튼
   - 라이트/다크 모두 다크 유지 — 마무리 임팩트 일정성
7. **Footer**
   - 워드마크 + sub("엔띵") / 정책 링크 / 카피라이트

### 다크모드 토글
- nav 우측 40pt 아이콘 버튼 (해/달 SVG swap)
- 초기값: `localStorage.nthing-theme` || `prefers-color-scheme`
- 클릭 시 `[data-theme]` 속성 토글 + localStorage 저장
- 200ms `background-color` / `color` 트랜지션
- FOUC 방지를 위해 `<head>` 인라인 스크립트로 첫 페인트 전에 적용

### 인터랙션 & 상태
- 모든 버튼 hover: translateY(-1px) + 약간의 shadow 변화
- Feature card hover: border → brand, translateY(-2px)
- Smooth scroll (`html { scroll-behavior: smooth }`)
- 모바일 ≤960px: 1열 그리드, 폰트 다운스케일
- 모바일 ≤560px: nav CTA 텍스트 숨김, hero 36px 등

---

## 6. Components 재사용 정리

`screens.jsx`에 정의된 atom/molecule:

| 컴포넌트 | 용도 |
|---|---|
| `Frame` | iPhone 14 414×896 wrapper |
| `StatusBar` | 9:41 + 신호/와이파이/배터리 (44pt) |
| `HomeIndicator` | 134×5 indicator pill |
| `AppBar` | 56pt, leading/title/trailing |
| `IconBtn` | 44×44 transparent icon button |
| `PrimaryButton` / `SecondaryButton` / `TextButton` | 버튼 3종 (compact/full/danger/disabled props) |
| `StatusBadge` | 5상태 (WAITING/URGENT/MATCHED/COMPLETED/CANCELLED) |
| `FilterChip` | 34pt, active=brand fill |
| `TextField` | floating label, focus/error 상태, supporting text |
| `ImgPh` | 줄무늬 placeholder (16:9 비율 등) |
| `BottomNav` | 64+24pt, 3 items |
| `SplitCard` | 메인 피드/리스트 카드 |
| `Ic.*` | 24pt stroke 아이콘 세트 |

`Ic` 객체에 정의된 아이콘은 SVG 인라인입니다. 실제 구현 시에는 Lucide / Heroicons / 자체 아이콘 세트로 교체하세요.

---

## 7. 카피라이팅 일관성

- 서비스명: **NThing** (영문), **엔띵** 또는 **N띵** (한글)
- 동사화: 사용자가 상품을 나눠 구매하는 행위 = "**N띵하다**"
  - 예: "두쫀쿠 반씩 N띵해요" / "근처 N띵" / "안심하고 N띵하세요"
- 톤: 친근, 구어체, 느낌표 OK. "한 입씩 나눠요" 같은 비유 가능.
- 가격 표기: `1인당 ₩10,000` 또는 `10,000원` (혼용 OK, 디스플레이는 ₩ 선호)

---

## 8. 구현 시 체크리스트

- [ ] 디자인 토큰을 코드베이스의 테마 시스템에 매핑 (CSS vars / SCSS / Theme provider / Tailwind config 등)
- [ ] Pretendard 폰트 로딩 (`https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css` 또는 self-host)
- [ ] 다크모드 지원 (앱: 시스템 테마 follow, 랜딩: 사용자 토글 + localStorage)
- [ ] StatusBadge `MATCHED`는 neutral surface 유지 (브랜드와 시각 충돌 회피)
- [ ] 다크모드에서 브랜드 그린은 `#22C55E`로 자동 보정
- [ ] OAuth 마크는 실제 브랜드 가이드라인 준수해 교체
- [ ] 지도는 실제 SDK(Kakao Map / Naver Map / Google Maps) 연동 — 도식은 디자인 참고용
- [ ] 이미지 placeholder(`ImgPh`)는 실제 이미지로 교체, 비율(16:9, 1:1 등)은 유지
- [ ] 모든 터치 타겟 ≥44pt
- [ ] OS-native 컴포넌트(Status bar / Home indicator)는 SafeArea로 처리

---

## 9. 기타

- 아이콘은 SVG 인라인으로 들어가 있어요. 라이브러리 교체 시 stroke-width 1.8 / 24pt 기본을 맞추세요.
- `Tweaks` 등 디자인 캔버스 부속 기능은 무시하세요 — 구현 대상 아닙니다.
- 추가 화면(상세 옵션, 채팅, 결제 등)은 미정. 본 핸드오프 범위는 위 7+1 화면입니다.
