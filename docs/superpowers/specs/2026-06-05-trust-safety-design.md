# Trust & Safety / 어뷰징 대응 설계

> 작성일: 2026-06-05 · 상태: 설계 승인 대기
> 영역: 서버(`server/`) 중심 + 모바일(`mobile/`) UI 연동

## 1. 배경 & 문제

위치 기반 P2P 반띵(N분의 1 나눠사기) 특성상 두 종류의 악성 행위가 예상된다.

1. **진짜 유저의 악행** — 당일 취소, 노쇼, 잠수(연락두절), 미납 후 도망, 비매너
2. **가짜 계정/데이터** — OAuth 대포계정으로 가짜 반띵 등록·가짜 참여 신청 살포

핵심 제약: **거래가 오프라인에서 일어난다.** 앱은 두 사람이 실제로 만났는지·돈을 냈는지 직접 관측할 수 없다. 따라서 신뢰 신호는 **거래 상대방으로부터** 와야 한다.

현재 코드베이스는 trust & safety 인프라가 전무한 그린필드 상태다.
- `User`: provider/providerId + nickname/profileImage만. 인증상태·신뢰점수·정지상태 없음.
- `Split` 상태머신: `WAITING → MATCHED → COMPLETED(데드상태) / CANCELLED(WAITING에서 author만)`. 매칭 후 취소·노쇼·거래완료확인 없음.
- 신고/차단/리뷰/평점 도메인 없음. `SplitEvents`(AFTER_COMMIT) 디커플링 패턴은 존재 → 재사용.

## 2. 설계 결정 요약

| 축 | 결정 |
|----|------|
| 진입 게이트 | PASS 휴대폰 본인인증, **거래 액션 직전 1회** → 영구 VERIFIED, CI 저장으로 재가입 차단 |
| 신뢰 표현 | **반띵 성사율 (%)** ("약속 지킨 비율") |
| 결과 확정 | **양방 상호확인** (성사/불이행/취소), 무고는 패턴 기반 판단 |
| 제재 | **자동 단계제재**(경고→기능제한→일시정지→영구정지) **+ 심각건 수동** 검토 |
| 불이행 분류 | 노쇼/잠수를 **`BROKEN` 하나로 통합** (채팅 없는 Phase 1엔 객관적 구분 불가) |
| 출시 순서 | **책임성 코어(B1, 순수 코드) 먼저 → PASS 게이트(B2, 외부 대행사) 나중** |

### 접근법 선택 근거
PASS는 외부 대행사 계약·비용·법적 요건(위치기반서비스 신고 등)이 걸려 리드타임이 길다. 책임성 코어는 순수 코드라 즉시 착수 가능하고, **실제 노쇼/취소 데이터로 제재 임계치를 튜닝**한 뒤 PASS를 붙일 수 있다. 초기엔 유저가 적어 대포계정 리스크도 낮다. → **B1 먼저, B2(대행사 계약)는 병행 시작.**

## 3. 데이터 모델

### 3-1. 새 도메인 패키지 `com.onebite.server.safety/`
신고·차단·제재를 Split/User 도메인에 침투시키지 않고 분리. 기존 `SplitEvents` AFTER_COMMIT 패턴과 동일하게 이벤트로 디커플링.

### 3-2. `User` 엔티티 확장
```kotlin
// 진입 게이트 (Phase B2)
var phoneVerified: Boolean = false
var verifiedAt: LocalDateTime? = null
var ci: String? = null            // 본인확인 연계정보 (UNIQUE) — 재가입 차단 키. 주민번호 아님. 암호화 저장.

// 책임성 (Phase B1)
@Enumerated(EnumType.STRING)
var trustState: TrustState = TrustState.NORMAL
var suspendedUntil: LocalDateTime? = null
var isAdmin: Boolean = false

// 성사율 집계 (denormalized counter, 결과 확정 이벤트로 갱신)
var completedCount: Int = 0       // 성사
var lateCancelCount: Int = 0      // 매칭 후 취소
var brokenCount: Int = 0          // 약속 불이행 (노쇼+잠수 통합)

enum class TrustState { NORMAL, WARNED, RESTRICTED, SUSPENDED, BANNED }
```

**반띵 성사율 = `completedCount / (completedCount + lateCancelCount + brokenCount)`**
매칭 **전** 취소(WAITING 중)는 무해하므로 분모에서 제외.

### 3-3. Split 생애주기 확장

`SplitParticipant`에 결과 상태 추가 (성사율 신호는 참여자↔주최자 단위로 기록):
```kotlin
@Enumerated(EnumType.STRING)
var outcome: ParticipantOutcome = ParticipantOutcome.JOINED
var authorConfirmedAt: LocalDateTime? = null       // 주최자가 "거래완료" 탭
var participantConfirmedAt: LocalDateTime? = null   // 참여자가 "거래완료" 탭
var brokenReasonTag: String? = null                 // 선택 라벨: 안나옴/연락두절 (관리자 참고 + 카피용)

enum class ParticipantOutcome {
    JOINED,        // 참여 확정, 만남 대기
    COMPLETED,     // 양방 완료확인 → 성사 (양쪽 +)
    LATE_CANCELLED,// 매칭 후 취소
    BROKEN,        // 약속 불이행 (노쇼/잠수, 상대가 신고)
    DISPUTED       // 양방 주장 불일치 → 보류 (관리자 큐)
}
```

`SplitStatus`는 유지하되 전이 정리:
```
WAITING ──(정원충족)──> MATCHED ──(모든 참여 COMPLETED)──> COMPLETED
   │                       │
   └─(author 취소)──> CANCELLED   └─(author 매칭후취소)──> CANCELLED (author에 lateCancel 카운트)
```

### 3-4. `Report` / `Block` 엔티티
```kotlin
@Entity @Table(name = "reports")
class Report(
    val reporter: User,
    val targetUser: User,
    val splitId: Long? = null,
    @Enumerated(EnumType.STRING) val category: ReportCategory,
    val detail: String? = null,
    @Enumerated(EnumType.STRING) var status: ReportStatus = ReportStatus.PENDING,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
enum class ReportCategory {
    BROKEN_PROMISE,  // 노쇼/잠수 — 자동 집계 (선택 사유태그)
    NON_PAYMENT,     // 미납/사기  ┐
    SCAM_PRODUCT,    // 가짜 상품   │ 심각 → 수동 검토 큐
    ABUSE_THREAT,    // 욕설/위협   ┘
    OTHER
}
enum class ReportStatus { PENDING, ACTIONED, DISMISSED }

@Entity @Table(name = "blocks",
    uniqueConstraints = [UniqueConstraint(columnNames = ["blocker_id", "blocked_id"])])
class Block(
    val blocker: User,
    val blocked: User,
    val createdAt: LocalDateTime = LocalDateTime.now()
)
```

**카테고리 = 심각도 라우팅:**
- `BROKEN_PROMISE` → 결과확정 신고와 동일 경로, 자동 집계(`brokenCount++`)
- `NON_PAYMENT`/`SCAM_PRODUCT`/`ABUSE_THREAT` → 심각건: 피신고자 거래기능 즉시 임시보류 + 관리자 큐

**무고 방어:**
- 동일 `(reporter, targetUser)` 중복 신고는 1건으로 집계
- 일방 주장만으로 즉시 페널티 X — 반복 패턴(같은 유저가 계속 피신고/피완료실패)으로 가중
- reporter 본인의 신고남발 패턴도 가중치에 반영

**차단 효과 (양방향 숨김):**
- 서로의 반띵이 목록·지도·상세에서 안 보임 (조회 쿼리에 차단 필터)
- 서로의 반띵에 참여/수락 불가
- 신고와 독립 — 신고는 운영 신호, 차단은 즉시 개인 회피 수단

## 4. 결과 확정 플로우 (양방 상호확인)

1. MATCHED 후 만남 → 각자 앱에서 **"거래완료"** 탭
2. author·participant **둘 다** 확인 → `COMPLETED`, 양쪽 `completedCount++`
3. 한쪽만 확인하고 기한(매칭 후 48h, properties) 경과 → 나타난 쪽이 **"상대가 안 나왔어요"** 신고 가능 → 상대 `brokenCount++`
4. 양쪽이 서로 "상대 불이행" 주장 → `DISPUTED` → 관리자 수동 검토. 일방 주장만으로 즉시 페널티 X, 반복 패턴으로 가중

## 5. 반띵 성사율 표시 & Cold-start

### 표시
공개 신뢰 프로필(`GET /users/{id}/trust`)에 노출 → 참여/수락 전 상대 확인 ("자연스러운 필터링").
```
반띵 성사율  92%
37회 약속 중 34회 성사 · 불이행 1
```

### Cold-start (표본 부족)
- **약속 < 5회**: 퍼센트 대신 `🌱 신규` 배지, 중립 취급 (성사율 숨김)
- **약속 ≥ 5회**: 성사율 % 노출
- 신규는 **비율 제재 면제** → 절대 횟수로만 판정 (§6)

### 표시 톤 (카피)
- 높음(≥90%): `약속을 잘 지켜요` + 초록
- 보통(70~89%): 성사율만
- 낮음(<70%): `최근 약속을 자주 못 지켰어요` + 주황 경고 톤
- 신규: `🌱 신규 · 아직 거래 기록이 적어요`

성사율(소프트 압력) + PASS 재가입차단(하드 차단)이 한 쌍으로 작동 — 낮은 성사율 계정을 버리고 새로 파는 행위를 PASS가 막는다.

## 6. 자동 단계제재 엔진

### 신뢰 상태 머신
```
NORMAL → WARNED → RESTRICTED → SUSPENDED → BANNED
              (악행 누적)            (기간만료/성사율회복 시 완화)
```

### 자동 제재 사다리 (임계치는 전부 properties로 튜닝 가능)
신규(약속<5)는 비율 면제 → 절대 횟수로만. 기성유저는 횟수 OR 성사율 중 먼저 닿는 것:

| 단계 | 자동 트리거 | 효과 |
|------|------------|------|
| **WARNED** | broken 1회 또는 lateCancel 2회 | 푸시/배너 알림만 |
| **RESTRICTED** | broken 2회 **또는** 성사율<60% | 동시 진행 반띵 1건 제한 + 등록 쿨다운 |
| **SUSPENDED** | broken 3회 **또는** 성사율<40% | 7일 거래기능 정지(`suspendedUntil`). 조회는 가능 |
| **BANNED** | 일시정지 후 재발 **또는** 심각신고 ACTIONED | 영구. (B2: CI 재가입 차단) |

**회복**: SUSPENDED는 `suspendedUntil` 경과 시 자동 RESTRICTED 완화 → 성사율이 임계 위로 회복하면 NORMAL 복귀. 꾸준히 잘하면 회복 가능(영구정지 제외, 평생 낙인 X).

### 심각신고 별도 경로 (사기/위협)
`NON_PAYMENT`/`SCAM_PRODUCT`/`ABUSE_THREAT` 접수 → 즉시 거래기능 임시보류(soft suspend) + 관리자 큐 → ACTIONED면 BANNED, DISMISSED면 즉시 복구.

### 적용 시점 (`TrustGuard`)
`SplitService` 등록/참여 진입부에서 단일 가드:
```
BANNED        → 거부
SUSPENDED     → 거부 (해제일 안내)
RESTRICTED    → 동시 진행 건수 초과 시 거부
(B2) !phoneVerified → 본인인증 플로우로 유도
```

### 디커플링 (기존 패턴 재사용)
- 결과확정 → `OutcomeRecordedEvent` → `@TransactionalEventListener(AFTER_COMMIT)` → 카운터 갱신 + `TrustEvaluator` 상태 재평가
- 심각신고 → `ReportFiledEvent` → soft suspend
- Split 도메인은 신뢰 로직을 모름 (이벤트만 발행)

### 최소 어드민
별도 화면 없이 보호된 REST로 시작:
- `User.isAdmin` 플래그 + `/admin/**` ROLE 보호
- `GET /admin/reports?status=PENDING` / `POST /admin/reports/{id}/resolve` / `POST /admin/users/{id}/sanction`

## 7. PASS 진입 게이트 (Phase B2)

### 동작 흐름
거래 액션(등록/참여) 직전, `phoneVerified == false`면 본인인증 유도:
```
[등록/참여 탭] → 미인증? → 본인인증 화면(대행사 webview/SDK)
  → 통신사 PASS/SMS 인증 → 대행사 결과 콜백(이름·생년월일·성별·CI)
  → User.ci 저장, phoneVerified=true, verifiedAt=now → 원래 액션 진행
```
인증은 **계정당 1회**, 이후 영구 VERIFIED.

### 재가입 차단 (PASS의 진짜 가치)
```kotlin
// User.ci 에 UNIQUE 제약, 인증 콜백 처리 시:
val existing = userRepository.findByCi(ci)
if (existing != null && existing.trustState == BANNED)
    throw VerificationBlockedException("이용이 제한된 사용자입니다")
if (existing != null && existing.id != currentUser.id)
    // 1 CI = 1 활성계정 원칙 적용 (정책은 운영하며 조정)
```
- BANNED 유저의 CI로 신규 인증 거부 → 영구정지가 진짜 영구가 됨
- CI는 대행사 연계정보(주민번호 아님) → 개인정보 최소수집 부합, 암호화 저장

### 대행사 (외부 의존 — 코드 외, 리드타임 큼 → B1과 병행 시작)
- 후보: 나이스평가정보 / KG모빌리언스 / 다날 / 토스 본인확인 (건당 ~30~80원, 부가세 별도)
- 필요: 사업자등록, 계약·심사, API 키
- `PhoneVerificationProvider` 인터페이스로 추상화 (기존 OAuth 전략 패턴 스타일) → 대행사 교체 가능

### 법적 정합성 (필수)
- 위치기반서비스사업자 신고 + 개인정보처리방침에 본인확인 수집항목(이름/생년월일/성별/CI) 추가
- CI 암호화 저장, 목적 외 사용 금지, 보유기간 명시, 본인확인 동의 화면 필수

## 8. API 변경 요약

**Phase B1 (책임성 코어 — 외부 의존 0)**
```
POST   /splits/{id}/complete            내 거래완료 확인 (author/participant 공통)
POST   /splits/{id}/report-broken       상대 약속불이행 신고 (사유태그)
POST   /splits/{id}/cancel              취소 (매칭후취소는 lateCancel 집계)
POST   /reports                         { targetUserId, splitId?, category, detail? }
POST   /blocks                          { targetUserId }
DELETE /blocks/{userId}
GET    /blocks
GET    /users/me                        (확장) 성사율·trustState·집계
GET    /users/{id}/trust                공개 신뢰 프로필 (성사율/거래수/신규배지)
GET    /admin/reports?status=PENDING
POST   /admin/reports/{id}/resolve      { action: ACTIONED|DISMISSED }
POST   /admin/users/{id}/sanction       { state, days?, reason }
```

**Phase B2 (진입 게이트 — 외부 대행사)**
```
POST   /auth/verify/phone/start
POST   /auth/verify/phone/callback
GET    /users/me                        (확장) phoneVerified
```

## 9. DB 마이그레이션
- `V4__trust_safety.sql`: `users` 컬럼(trustState, suspendedUntil, completedCount, lateCancelCount, brokenCount, isAdmin) + `split_participants` 컬럼(outcome, authorConfirmedAt, participantConfirmedAt, brokenReasonTag) + `reports` + `blocks`
- `V5__phone_verification.sql` (B2): `users`(phoneVerified, verifiedAt, ci UNIQUE)

## 10. 단계별 출시 순서

**Phase B1 — 책임성 코어** (순수 코드, 즉시 착수)
1. Split 생애주기 확장 (매칭후취소 + 양방 완료확인 + broken 신고) + DB V4
2. 반띵 성사율 집계(이벤트 기반 카운터) + 표시 + cold-start 신규배지
3. 신고/차단 도메인 (Report/Block + 조회쿼리 차단필터)
4. 자동 단계제재 엔진(TrustGuard + TrustEvaluator) + 최소 어드민
5. 모바일 UI 연동 (거래완료 버튼, 신뢰 카드, 신고/차단 메뉴, 제재 안내)

**Phase B2 — 진입 게이트** (대행사 계약 병행)
6. 대행사 선정·계약·법적 신고 (코드 외, 리드타임 큼 → **B1과 동시 시작**)
7. `PhoneVerificationProvider` 연동 + CI 재가입 차단 + 액션직전 게이트 + DB V5
8. 개인정보처리방침/위치기반서비스 신고 갱신

## 11. 비용 메모 (PASS)
- 휴대폰 본인확인 건당 약 30~80원(부가세 별도, 대행사·물량별 견적). 계정당 1회 인증이므로 비용은 **신규 가입자 수에만** 비례. 예: 신규 1만명/월 × 40원 ≈ 월 40만원.
- 자체 SMS OTP는 건당 ~8~20원이나 명의확인이 안 되어 대포계정 차단력 약함 → PASS 채택.
- 정확한 단가는 대행사 견적 필요 (B2 착수 시 확정).

## 12. 비범위 (YAGNI / 향후)
- 인앱 채팅(Phase 2) → 도입 시 broken을 노쇼/잠수로 자동 분리 가능
- PG 에스크로(전자금융업 요건) → 미납 근본 해결책이나 MVP 제외
- 별도 어드민 웹 콘솔 → 초기엔 보호된 REST로 충분
