# Phase 2 병렬 오케스트레이션 설계 (2026-06-06)

메인 오케스트레이터(이 세션)가 trust&safety 진행 중인 동안, 그 다음 작업들을
독립 worktree + 백그라운드 teammate 로 병렬 착수하기 위한 설계.

## 배경 / 현재 상태

- 현재 브랜치 `feature/trust-safety` @ `2d2091b` — i18n 다국어 작업 진행 중(커밋 안 됨, **red**).
  커밋된 HEAD `2d2091b` 자체는 **green (171/171)**.
- `feature/trust-safety-server` worktree(`.claude/worktrees/server`) — 노쇼 대응(반띵 성사율 +
  공개 신뢰 프로필) 진행 중. **이 작업은 병렬 대상에서 제외.**
- 마이그레이션 버전 사용 중: V1, V3, V5. 다음 가용: **V6, V7, …**

## 핵심 결정

| 결정 | 내용 | 이유 |
|------|------|------|
| 베이스 브랜치 | 모든 새 worktree 는 clean green HEAD `2d2091b` 에서 분기 | i18n WIP 이 red 라 베이스로 부적합. teammate 는 green 베이스에서 검증 가능해야 함 |
| i18n WIP | 메인 worktree 에 그대로 둠(오케스트레이터가 건드리지 않음) | 사용자의 진행 중 작업. 통합 시 BottomNav 소규모 머지만 오케스트레이터가 해결 |
| T1 위치 저장 | 장소명+상세를 기존 `address` 문자열에 합침 (예: `코스트코 양재점 · 3층 KFC 앞`) | 서버 변경/마이그레이션 없이 T1 을 순수 모바일로 유지. 추후 컬럼 정규화 가능 |
| 마이그레이션 레인 | V6=신고/차단, V7=카테고리 | Flyway 버전 충돌 사전 차단 |
| 거래 완료 인증 | 병렬 제외, **순차** | `ParticipantOutcome`(trust-safety-server 에서 활발히 변경 중)에 의존 → 그 위에 후속 |
| env 처리 | gitignore 대상이지만 빌드 필요 파일은 메인 worktree 파일을 **symlink** | `.env.development/.production` 은 추적됨. `mobile/.env.local`, `server/secrets/`, `infra/.env` 만 symlink |

## 병렬 워크스트림

### T1 — `wt-map` (모바일 전용) · branch `feature/create-map-location`
- CreateSplit 에 카카오 **장소 검색**(`libraries=services`, `places.keywordSearch`) +
  조절 가능한 **핀** + **상세 위치** 텍스트 필드.
- 메인 네비게이션에서 지도 제거: `BottomNav`(map 탭), `MainLayout`(map 라우트/FAB 조건), `App.tsx`(/map 라우트), `Map.tsx` 폐기.
- 위치 = `address` 에 `"<장소명> · <상세>"` 로 합쳐 전송(좌표는 선택 핀 기준).
- 서버 변경 없음. 마이그레이션 없음.

### T2 — `wt-report` (서버+모바일) · branch `feature/report-block` · **V6**
- 서버: 신규 `report/` 도메인 (신고 + 차단 API). 기존 split/user 도메인 비침투.
- 모바일: SplitDetail / Profile 에 신고·차단 UI (`features/report/`).

### T3 — `wt-category` (서버+모바일) · branch `feature/category-search` · **V7**
- 서버: Split 에 category enum/컬럼 + `GET /splits?category=&q=` 검색.
- 모바일: Home/SplitList 필터 칩 + 검색.

### T4 — `wt-infra-push` (인프라) · branch `feature/infra-push-prod`
- `docker-compose.prod.yml` 에 `FIREBASE_CREDENTIALS_BASE64` env 주입 +
  서버 config 가 base64 디코드해 자격증명 로드. prod 푸시 활성화 마무리.

## 충돌 매트릭스

| 파일 | T1 | T2 | T3 | T4 | i18n WIP |
|------|----|----|----|----|----------|
| BottomNav/MainLayout/App | ✏️ | | | | ✏️(머지) |
| SplitDetail | | ✏️ | | | |
| Home/SplitList/splits.queries | | | ✏️ | | |
| 서버 split 도메인 | | | ✏️ | | |
| 서버 신규 report 도메인 | | ✏️ | | | |
| infra compose | | | | ✏️ | |

겹침은 BottomNav(T1 vs i18n WIP) 뿐 — 오케스트레이터가 통합 시 해결.

## 통합 순서 (오케스트레이터)

1. T4 (인프라, 독립) → 2. T2 (신규 도메인, 독립) → 3. T3 (서버 split 변경) →
4. T1 (모바일 nav/create) → 5. i18n WIP 완료 후 BottomNav 머지 →
6. trust-safety-server 머지 후 **거래 완료 인증** 순차 착수.

각 단계 통합 후 `pnpm test:run` / `./gradlew test` green 확인.
