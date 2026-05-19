package com.onebite.app.auth

import kotlinx.coroutines.suspendCancellableCoroutine
import platform.AuthenticationServices.ASWebAuthenticationPresentationContextProvidingProtocol
import platform.AuthenticationServices.ASWebAuthenticationSession
import platform.Foundation.NSURL
import platform.Foundation.NSURLComponents
import platform.Foundation.NSURLQueryItem
import platform.Foundation.NSUUID
import platform.UIKit.UIApplication
import platform.UIKit.UIWindow
import platform.UIKit.UIWindowScene
import platform.darwin.NSObject
import kotlin.coroutines.resume

actual object OAuthHandler {

    // OAuth 설정 — Secrets.kt에서 키 로드 (gitignore 대상)
    private val kakaoRestApiKey get() = com.onebite.app.Secrets.KAKAO_REST_API_KEY
    private val naverClientId get() = com.onebite.app.Secrets.NAVER_CLIENT_ID
    private val googleClientId get() = com.onebite.app.Secrets.GOOGLE_CLIENT_ID

    private const val CALLBACK_SCHEME = "com.onebite.app"
    // 서버 OAuth redirect relay — 서버가 커스텀 스킴으로 리다이렉트해줌
    private const val SERVER_BASE = "http://43.200.206.239"
    private const val KAKAO_REDIRECT_URI = "$SERVER_BASE/api/auth/callback/kakao"
    private const val NAVER_REDIRECT_URI = "$SERVER_BASE/api/auth/callback/naver"
    private const val GOOGLE_REDIRECT_URI = "$SERVER_BASE/api/auth/callback/google"

    actual suspend fun login(provider: AuthProvider): OAuthResult {
        return when (provider) {
            AuthProvider.KAKAO -> loginWithKakao()
            AuthProvider.NAVER -> loginWithNaver()
            AuthProvider.GOOGLE -> loginWithGoogle()
            AuthProvider.APPLE -> OAuthResult.Error("Apple 로그인은 비활성화되어 있습니다")
        }
    }

    private suspend fun loginWithKakao(): OAuthResult {
        val url = "https://kauth.kakao.com/oauth/authorize" +
                "?client_id=$kakaoRestApiKey" +
                "&redirect_uri=$KAKAO_REDIRECT_URI" +
                "&response_type=code"
        return webOAuth(url, AuthProvider.KAKAO)
    }

    private suspend fun loginWithNaver(): OAuthResult {
        val state = NSUUID().UUIDString
        val url = "https://nid.naver.com/oauth2.0/authorize" +
                "?client_id=$naverClientId" +
                "&redirect_uri=$NAVER_REDIRECT_URI" +
                "&response_type=code" +
                "&state=$state"
        return webOAuth(url, AuthProvider.NAVER, state)
    }

    private suspend fun loginWithGoogle(): OAuthResult {
        val url = "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=$googleClientId" +
                "&redirect_uri=$GOOGLE_REDIRECT_URI" +
                "&response_type=code" +
                "&scope=openid%20email%20profile"
        return webOAuth(url, AuthProvider.GOOGLE)
    }

    private suspend fun webOAuth(
        urlString: String,
        provider: AuthProvider,
        state: String? = null
    ): OAuthResult = suspendCancellableCoroutine { cont ->
        val url = NSURL.URLWithString(urlString)
        if (url == null) {
            cont.resume(OAuthResult.Error("잘못된 OAuth URL"))
            return@suspendCancellableCoroutine
        }

        val contextProvider = object : NSObject(),
            ASWebAuthenticationPresentationContextProvidingProtocol {
            override fun presentationAnchorForWebAuthenticationSession(
                session: ASWebAuthenticationSession
            ): UIWindow {
                return getKeyWindow()!!
            }
        }

        val session = ASWebAuthenticationSession(
            uRL = url,
            callbackURLScheme = CALLBACK_SCHEME
        ) { callbackURL: NSURL?, error: platform.Foundation.NSError? ->
            if (error != null) {
                cont.resume(OAuthResult.Error("${provider.name} 로그인 취소됨"))
                return@ASWebAuthenticationSession
            }
            val components = callbackURL?.let {
                NSURLComponents(uRL = it, resolvingAgainstBaseURL = false)
            }
            val code = components?.queryItems
                ?.filterIsInstance<NSURLQueryItem>()
                ?.firstOrNull { it.name == "code" }
                ?.value

            if (code != null) {
                cont.resume(
                    OAuthResult.Success(
                        provider = provider,
                        authCode = code,
                        state = state
                    )
                )
            } else {
                cont.resume(OAuthResult.Error("인증 코드를 받지 못했습니다"))
            }
        }

        session.presentationContextProvider = contextProvider
        session.prefersEphemeralWebBrowserSession = true
        session.start()
    }

    actual fun logout() {
        // 웹 OAuth는 별도 로그아웃 불필요 (토큰 삭제로 처리)
    }

    actual fun isAvailable(provider: AuthProvider): Boolean {
        return when (provider) {
            AuthProvider.KAKAO -> true
            AuthProvider.NAVER -> true
            AuthProvider.GOOGLE -> true
            AuthProvider.APPLE -> false
        }
    }

    private fun getKeyWindow(): UIWindow? {
        return UIApplication.sharedApplication.connectedScenes
            .filterIsInstance<UIWindowScene>()
            .firstOrNull()
            ?.windows
            ?.firstOrNull { (it as UIWindow).isKeyWindow() } as? UIWindow
    }
}
