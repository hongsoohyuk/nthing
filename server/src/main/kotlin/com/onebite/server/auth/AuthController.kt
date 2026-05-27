package com.onebite.server.auth

import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
    @Value("\${app.oauth.callback-url:nthing://auth/callback}") private val callbackUrl: String
) {
    // GET /api/auth/callback/{provider} — OAuth 릴레이.
    // provider 콘솔에는 이 https URL 을 redirect_uri 로 등록. 서버가 인가코드를
    // 앱 커스텀 스킴(nthing://auth/callback?provider=..&code=..)으로 딥링크해 되돌린다.
    @GetMapping("/callback/{provider}")
    fun oauthCallback(
        @PathVariable provider: String,
        @RequestParam code: String?,
        @RequestParam state: String?,
        @RequestParam error: String?,
        response: HttpServletResponse
    ) {
        fun enc(v: String) = java.net.URLEncoder.encode(v, "UTF-8")
        val query = buildString {
            append("provider=").append(enc(provider))
            if (error != null || code == null) {
                append("&error=").append(enc(error ?: "no_code"))
            } else {
                append("&code=").append(enc(code))
                if (state != null) append("&state=").append(enc(state))
            }
        }
        response.sendRedirect("$callbackUrl?$query")
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
