# One Bite API 명세

> 서버-클라이언트 간 계약. 이 문서를 기준으로 서버/클라이언트가 독립 개발 가능.

Base URL: `http://localhost:8080/api`

## 인증

모든 인증 필요 요청에 헤더 포함:
```
Authorization: Bearer <jwt-token>
```

---

## Auth API

### POST /auth/kakao
카카오 소셜 로그인. 인가코드를 보내면 JWT 반환.

**Request:**
```json
{
  "code": "카카오_인가코드"
}
```

**Response: 200**
```json
{
  "token": "eyJhbGciOi...",
  "userId": 1,
  "nickname": "한입유저",
  "isNewUser": true
}
```

### POST /auth/naver
네이버 소셜 로그인. 인가코드와 state를 보내면 JWT 반환.

**Request:**
```json
{
  "code": "네이버_인가코드",
  "state": "csrf_state_value"
}
```

**Response: 200**
```json
{
  "token": "eyJhbGciOi...",
  "userId": 1,
  "nickname": "한입유저",
  "isNewUser": true
}
```

### POST /auth/google
Google 소셜 로그인. 인가코드를 보내면 JWT 반환.

**Request:**
```json
{
  "code": "google_인가코드"
}
```

**Response: 200**
```json
{
  "token": "eyJhbGciOi...",
  "userId": 1,
  "nickname": "한입유저",
  "isNewUser": true
}
```

### POST /auth/apple
Apple 소셜 로그인. 클라이언트에서 받은 Apple ID 토큰을 보내면 JWT 반환.

**Request:**
```json
{
  "idToken": "apple_id_token_jwt"
}
```

**Response: 200**
```json
{
  "token": "eyJhbGciOi...",
  "userId": 1,
  "nickname": "한입유저",
  "isNewUser": true
}
```

---

## Split API (인증 필요)

### GET /splits
나눠사기 목록 조회.

**Query Params:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | String | N | WAITING, MATCHED, COMPLETED, CANCELLED |
| lat | Double | N | 기준 위도 (위치 기반 조회 시) |
| lng | Double | N | 기준 경도 |
| radiusKm | Double | N | 반경 km (기본 3.0) |

**Response: 200**
```json
[
  {
    "id": 1,
    "productName": "두쫀쿠",
    "totalPrice": 20000,
    "totalQty": 4,
    "splitCount": 2,
    "pricePerPerson": 10000,
    "qtyPerPerson": 2,
    "imageUrl": "https://...",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "address": "서울 중구 세종대로",
    "status": "WAITING",
    "createdAt": "2025-02-21T15:00:00",
    "author": {
      "id": 1,
      "nickname": "한입유저",
      "profileImageUrl": null
    }
  }
]
```

### GET /splits/{id}
단건 조회.

### POST /splits
나눠사기 등록.

**Request:**
```json
{
  "productName": "두쫀쿠",
  "totalPrice": 20000,
  "totalQty": 4,
  "splitCount": 2,
  "imageUrl": "https://...",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "address": "서울 중구 세종대로"
}
```

**Response: 201** (Split 객체)

### PATCH /splits/{id}/cancel
나눠사기 취소. 작성자만 가능.

**Response: 200** (업데이트된 Split 객체)

### POST /splits/{id}/join
나눠사기 참여 요청.

**Response: 200**
```json
{
  "splitId": 1,
  "status": "MATCHED",
  "partnerName": "김철수"
}
```

### POST /splits/{id}/complete (인증 필요)
거래완료 확인. author와 participant 양쪽이 각각 호출해야 거래가 COMPLETED로 확정됨. 한쪽만 호출하면 status는 MATCHED 유지.

**Response: 200** (업데이트된 Split 객체)

### POST /splits/{id}/report-broken (인증 필요)
상대방의 약속 불이행(노쇼/잠수) 신고. 신고자와 대상은 주최자-참여자 쌍이어야 함. 피신고자가 이미 거래완료를 누른 상태면 DISPUTED로 보류(카운터 변화 없음).

**Request:**
```json
{
  "targetUserId": 2,
  "reasonTag": "안나옴"
}
```

- `targetUserId`: 신고 대상 유저 ID (필수)
- `reasonTag`: `"안나옴"` | `"연락두절"` | `null`

**Response: 200** (업데이트된 Split 객체 — 대상 참여 outcome = `AUTHOR_BROKEN` | `PARTICIPANT_BROKEN`, 모순 시 `DISPUTED`)

**Error:**
| 코드 | 상황 |
|------|------|
| 400 | `targetUserId` 누락 또는 주최자-참여자 쌍이 아님 |
| 403 | 거래 당사자가 아님 |

### POST /splits/{id}/leave (인증 필요)
참여자 이탈. 매칭 후 이탈 시 본인에게 lateCancel 패널티 부과 + split이 WAITING으로 재오픈. 매칭 전 이탈은 패널티 없음.

**Response: 200** (업데이트된 Split 객체)

### GET /splits/my
내가 등록한 나눠사기 목록 (페이지네이션).

**Query Params:** `page` (default 0), `size` (default 20)

**Response: 200** — PageResponse<Split 객체>

### GET /splits/participated
내가 참여한 나눠사기 목록 (페이지네이션). 참여 일시 기준 최신순.

**Query Params:** `page` (default 0), `size` (default 20)

**Response: 200** — PageResponse<Split 객체>

---

## Upload API (인증 필요)

### POST /uploads/sign
이미지 업로드용 presigned URL 발급. 클라이언트가 받은 `uploadUrl`에 직접 PUT 업로드 후, `publicUrl`을 `POST /splits.imageUrl`에 사용.

**Request:**
```json
{
  "contentType": "image/jpeg",
  "size": 123456
}
```

- `contentType`: `image/jpeg`, `image/png`, `image/webp` 중 하나
- `size`: 바이트 단위, 최대 5MB

**Response: 200**
```json
{
  "uploadUrl": "https://onebite-uploads.s3.ap-northeast-2.amazonaws.com/splits/abc-...jpg?X-Amz-Algorithm=...",
  "publicUrl": "https://onebite-uploads.s3.ap-northeast-2.amazonaws.com/splits/abc-...jpg",
  "key": "splits/abc-...jpg",
  "expiresInSeconds": 300
}
```

**업로드 플로우:**
1. 위 엔드포인트 호출 → `uploadUrl`, `publicUrl` 획득
2. `PUT <uploadUrl>` 로 바이너리 업로드 (Header: `Content-Type: <선택한 contentType>`, Body: 이미지 바이트)
3. 업로드 성공(200 OK) 후 `publicUrl`을 `POST /splits` 의 `imageUrl` 필드로 사용

---

## Device API (인증 필요)

### POST /devices
디바이스 등록/갱신 (토큰·플랫폼·위치·알림설정 upsert by fcmToken).

**Request:**
```json
{
  "fcmToken": "fcm-token-string",
  "platform": "IOS",
  "lat": 37.5665,
  "lng": 126.978,
  "nearbyAlertsEnabled": true
}
```

- `platform`: `IOS` | `ANDROID`
- `lat` / `lng` / `nearbyAlertsEnabled`: 선택. `lat`·`lng` 동봉 시 마지막 위치 갱신.

**Response: 200**
```json
{
  "id": 1
}
```

### POST /devices/unregister
로그아웃 시 토큰 삭제.

**Request:**
```json
{
  "fcmToken": "fcm-token-string"
}
```

**Response: 204** (본문 없음)

---

## User API (인증 필요)

### GET /users/me
내 프로필 조회.

**Response: 200**
```json
{
  "id": 1,
  "nickname": "한입유저",
  "profileImageUrl": null,
  "createdAt": "2025-02-21T15:00:00"
}
```

### PATCH /users/me
프로필 수정.

**Request:**
```json
{
  "nickname": "새닉네임"
}
```

### GET /users/{id}/trust (인증 불필요)
공개 신뢰 프로필. 참여/수락 전 상대의 반띵 성사율 확인용.

**Response: 200**
```json
{
  "userId": 2,
  "nickname": "반띵유저",
  "profileImageUrl": null,
  "isNewcomer": false,
  "successRate": 85,
  "promiseCount": 20,
  "completedCount": 17,
  "brokenCount": 2,
  "lateCancelCount": 1,
  "toneLabel": "우수"
}
```

- `promiseCount`: 완료 + 불이행 + 늦은취소 합계 (5회 미만이면 `isNewcomer=true`)
- `successRate`: 0~100 정수 | `null` — `isNewcomer=true`일 때 `null` (신규 배지 표시)
- `toneLabel`: 성사율 구간별 레이블 문자열

---

## 에러 응답 (공통)

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "상품명은 필수입니다"
}
```

| 코드 | 상황 |
|------|------|
| 400 | 잘못된 요청 (유효성 검증 실패) |
| 401 | 인증 필요 (토큰 없음/만료) |
| 403 | 권한 없음 (남의 글 취소 등) |
| 404 | 리소스 없음 |
