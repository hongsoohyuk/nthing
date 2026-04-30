package com.onebite.server.auth

import jakarta.servlet.http.HttpServletResponse
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {
    // GET /api/auth/callback/{provider} — OAuth callback (iOS 웹 OAuth용)
    // 카카오 등에서 리다이렉트 → 서버에서 토큰 교환 → JWT 발급 → 딥링크로 앱에 전달
    @GetMapping("/callback/{provider}")
    fun oauthCallback(
        @PathVariable provider: String,
        @RequestParam code: String?,
        @RequestParam state: String?,
        @RequestParam error: String?,
        response: HttpServletResponse
    ) {
        val scheme = "com.onebite.app://oauth/$provider"
        if (error != null || code == null) {
            response.sendRedirect("$scheme?error=${error ?: "no_code"}")
            return
        }
        val params = buildString {
            append("code=").append(java.net.URLEncoder.encode(code, "UTF-8"))
            if (state != null) {
                append("&state=").append(java.net.URLEncoder.encode(state, "UTF-8"))
            }
        }
        response.sendRedirect("$scheme?$params")
    }

    // POST /api/auth/kakao — 카카오 로그인 (인가코드 or 액세스토큰)
    @PostMapping("/kakao")
    fun kakaoLogin(@RequestBody request: KakaoLoginRequest): AuthResponse =
        if (request.accessToken != null)
            authService.kakaoLoginWithToken(request.accessToken)
        else
            authService.kakaoLogin(request.code!!)

    // POST /api/auth/naver — 네이버 인가코드로 로그인
    @PostMapping("/naver")
    fun naverLogin(@RequestBody request: NaverLoginRequest): AuthResponse =
        authService.naverLogin(request.code, request.state)

    // POST /api/auth/google — Google 로그인 (인가코드 or ID 토큰)
    @PostMapping("/google")
    fun googleLogin(@RequestBody request: GoogleLoginRequest): AuthResponse =
        if (request.idToken != null)
            authService.googleLoginWithToken(request.idToken)
        else
            authService.googleLogin(request.code!!)

    // POST /api/auth/apple — Apple ID 토큰으로 로그인
    @PostMapping("/apple")
    fun appleLogin(@RequestBody request: AppleLoginRequest): AuthResponse =
        authService.appleLogin(request.idToken)
}

data class KakaoLoginRequest(
    val code: String? = null,        // iOS: 인가 코드
    val accessToken: String? = null  // Android: SDK에서 받은 액세스 토큰
)

data class NaverLoginRequest(
    val code: String,  // 네이버 인가 코드
    val state: String  // CSRF 방지 state 파라미터
)

data class GoogleLoginRequest(
    val code: String? = null,     // iOS: 인가 코드
    val idToken: String? = null   // Android: Credential Manager ID 토큰
)

data class AppleLoginRequest(
    val idToken: String  // Apple ID 토큰 (JWT)
)
