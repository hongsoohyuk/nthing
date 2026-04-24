# Mobile - KMP + Compose Multiplatform

## 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | Kotlin Multiplatform + Compose Multiplatform | |
| Kotlin | 2.1.10 | |
| Compose | 1.7.3 | |
| HTTP | Ktor 3.0.3 | |
| 직렬화 | Kotlinx Serialization 1.7.3 | |
| 네비게이션 | Navigation Compose 2.8.0-alpha10 | |
| Android minSdk | 24 | |
| Android targetSdk | 34 | |

## 실행 방법

```bash
# Android (에뮬레이터)
./gradlew :composeApp:installDebug

# iOS
# Xcode에서 iosApp/ 프로젝트 열기 → Run
```

## 프로젝트 구조

```
mobile/
├── composeApp/
│   ├── build.gradle.kts          # KMP 타겟 + 의존성
│   └── src/
│       ├── commonMain/kotlin/com/onebite/app/
│       │   ├── App.kt            # 루트 Composable
│       │   ├── Platform.kt       # expect fun getPlatformName()
│       │   ├── auth/
│       │   │   ├── AuthProvider.kt     # enum + OAuthResult sealed class
│       │   │   ├── OAuthHandler.kt     # expect - 플랫폼별 OAuth
│       │   │   ├── TokenStorage.kt     # expect - 토큰 저장
│       │   │   └── AuthManager.kt      # OAuth → 서버 로그인 → 토큰 저장
│       │   ├── data/
│       │   │   ├── model/
│       │   │   │   ├── AuthModels.kt   # 로그인 요청/응답 DTO
│       │   │   │   ├── SplitItem.kt    # 나눠사기 도메인 모델
│       │   │   │   └── SplitRequest.kt # 등록 요청 DTO
│       │   │   └── api/
│       │   │       └── OneBiteApi.kt   # Ktor HTTP 클라이언트 (전체 API)
│       │   └── ui/
│       │       ├── theme/Theme.kt      # Material3 테마 (OneBite Orange)
│       │       ├── component/CommonUi.kt # Loading, Error, Empty 공통 컴포넌트
│       │       ├── navigation/AppNavigation.kt  # NavHost (4 라우트)
│       │       └── screen/
│       │           ├── LoginScreen.kt          # 소셜 로그인 4종 + 둘러보기
│       │           ├── MainScreen.kt           # 하단 탭 (홈/지도/프로필) + FAB
│       │           ├── CreateSplitScreen.kt    # 상품 등록 폼
│       │           ├── SplitDetailScreen.kt    # 상세 + 참여/취소
│       │           └── tab/
│       │               ├── HomeTab.kt          # 나눠사기 피드 리스트
│       │               ├── MapTab.kt           # 지도 (플레이스홀더)
│       │               └── ProfileTab.kt       # 프로필 + 메뉴
│       ├── androidMain/kotlin/com/onebite/app/
│       │   ├── MainActivity.kt                 # 앱 진입점 + SDK 초기화
│       │   ├── Platform.android.kt             # actual getPlatformName()
│       │   └── auth/
│       │       ├── TokenStorage.android.kt     # EncryptedSharedPreferences
│       │       └── OAuthHandler.android.kt     # 카카오/네이버/구글 SDK
│       └── iosMain/kotlin/com/onebite/app/
│           ├── MainViewController.kt           # ComposeUIViewController 어댑터
│           ├── Platform.ios.kt                 # actual getPlatformName()
│           └── auth/
│               ├── TokenStorage.ios.kt         # iOS Keychain (SecItem*)
│               └── OAuthHandler.ios.kt         # Apple SignIn (full), 나머지 stub
└── iosApp/iosApp/
    ├── iOSApp.swift            # @main 진입점
    └── ContentView.swift        # SwiftUI → Compose 브릿지
```

## 아키텍처 패턴

- **expect/actual**: `TokenStorage`, `OAuthHandler`, `Platform` — 플랫폼별 구현 분리
- **Sealed class**: UI 상태 관리 (Loading, Success, Error, Empty)
- **Singleton API 클라이언트**: `OneBiteApi` — Ktor + JSON 직렬화 + Bearer 토큰 자동 주입
- **Navigation**: Compose NavHost — LOGIN → MAIN → SPLIT_DETAIL / CREATE_SPLIT

## 서버 연동

- Base URL: `http://10.0.2.2:8080/api` (Android 에뮬레이터 → 호스트 localhost)
- 모든 API 호출은 `OneBiteApi` 싱글턴을 통해 수행
- JWT 토큰은 `Authorization: Bearer <token>` 헤더로 자동 전송

## 화면 구성

| 화면 | 라우트 | 상태 |
|------|--------|------|
| 로그인 | LOGIN | ✅ 완료 (4 OAuth + 둘러보기) |
| 메인 (하단탭) | MAIN | ✅ 완료 (홈/지도/프로필 탭) |
| 홈 탭 | — | ✅ 완료 (피드 리스트 + 공용 SplitCard) |
| 지도 탭 | — | ✅ Kakao Map 연동 + 핀 + 현재위치 (`NativeMapView`) |
| 프로필 탭 | — | ✅ 메뉴 → 내/참여 나눠사기 연결, 설정은 비활성 |
| 상품 상세 | SPLIT_DETAIL | ✅ 완료 (정보 + 참여/취소) |
| 상품 등록 | CREATE_SPLIT | ✅ GPS 캡처 + 이미지 picker + **S3 presigned 업로드 후 imageUrl 전송** |
| 내 나눠사기 | MY_SPLITS | ✅ `GET /splits/my` → SplitListScreen |
| 참여한 나눠사기 | PARTICIPATED_SPLITS | ✅ `GET /splits/participated` → SplitListScreen |

## 구현 상태

### 완료 (MVP)
- [x] KMP 프로젝트 구조 (Android + iOS 타겟)
- [x] Ktor API 클라이언트 — 전체 서버 API 연동 (auth / split CRUD / my / participated / uploads / users/me)
- [x] 데이터 모델 (AuthModels, SplitItem, CreateSplitRequest, UploadModels)
- [x] 소셜 로그인 — Android: 카카오/네이버/구글, iOS: 애플
- [x] 토큰 저장 — Android: EncryptedSharedPreferences, iOS: Keychain
- [x] 자동 로그인 (저장된 토큰 기반)
- [x] 로그인 화면 (4 OAuth 버튼 + 둘러보기)
- [x] 메인 화면 (3탭 + FAB)
- [x] 홈 탭 — 피드 + 공용 `SplitCard` (HomeTab/MapTab/MySplits/Participated 공유)
- [x] **지도 탭 — Kakao Map + 현재위치 + Split 핀** (`NativeMapView` expect/actual, `MainActivity.KakaoMapSdk.init`)
- [x] **GPS 위치 캡처** — `LocationProvider` expect/actual (Android FusedLocation, iOS CLLocationManager), 권한 요청 UX
- [x] **카메라/갤러리** — `ImagePicker` expect/actual (Android ActivityResult + FileProvider, iOS UIImagePickerController)
- [x] **이미지 S3 presigned PUT 업로드 플로우** — `OneBiteApi.signUpload` → `uploadToS3` → `createSplit(imageUrl)` (CreateSplitScreen submit 내)
- [x] **프로필 탭 메뉴 → 내 나눠사기 / 참여한 나눠사기 스크린** (`SplitListScreen` 공용 컴포넌트, `MY_SPLITS`/`PARTICIPATED_SPLITS` 라우트)
- [x] 상품 상세 (정보 카드 + 참여/취소 액션)
- [x] 상품 등록 폼 (이름, 가격, 수량, 주소 + 유효성 검증)
- [x] Material3 테마 (OneBite Orange 브랜드)
- [x] 공통 UI 컴포넌트 (Loading, Error, Empty, formatPrice, SplitCard)
- [x] 네비게이션 (6 라우트 + 자동 로그인 분기)
- [x] `cancelSplit` HTTP 메소드 버그 수정 — DELETE → PATCH `/splits/{id}/cancel` (서버 계약 일치)
- [x] iOS `ImagePicker.ios.kt` 컴파일 버그 수정 — `NSDate.timeIntervalSince1970` / `NSData.getBytes` 호환성 (Random.nextLong + memcpy usePinned 패턴)

### TODO

**MVP 운영 정리**
- [ ] **iOS OAuth SDK** — 카카오/네이버/구글 CocoaPods/SPM 추가 (현재 Apple만)
- [ ] **OAuth 키 local.properties 완전 분리** — MainActivity 내 하드코딩 제거
- [ ] **iOS Base URL 분리** — 현재 `OneBiteApi.BASE_URL`이 EIP 하드코딩 (도메인 확정 후 일괄)
- [ ] **에러 처리 고도화** — 401 감지 → 자동 로그아웃, 네트워크 에러 UI
- [ ] **Pull-to-refresh** — 홈/지도/내 나눠사기 탭
- [ ] **페이지네이션 무한 스크롤** — 현재 서버는 지원, 클라는 page=0만 호출

## 이미지 업로드 플로우 주의

- `ImagePicker`는 Android/iOS 모두 **JPEG 0.85로 압축된 `ByteArray`** 반환. `contentType`은 항상 `"image/jpeg"` 고정.
- `CreateSplitScreen` submit 로직은 `pickedImage == null`이면 업로드 step을 skip하고 `imageUrl = null`로 등록 (서버 DTO가 nullable 허용).
- `OneBiteApi.uploadClient`는 base URL과 Bearer 토큰이 **없는 별도 클라이언트**. S3 presigned URL에 PUT할 때 Authorization 헤더가 섞이면 안 되기 때문.
- `presign.publicUrl` 을 DB에 저장하는데, 실제 PUT이 실패해도 DB에는 URL이 박힘. 현재는 PUT 실패 시 예외가 올라와 createSplit까지 도달 안 함 (intentional)—나중에 retry 전략 정리 필요.
