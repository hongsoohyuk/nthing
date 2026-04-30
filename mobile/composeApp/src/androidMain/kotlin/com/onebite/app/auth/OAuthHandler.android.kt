package com.onebite.app.auth

import android.content.Intent
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.kakao.sdk.auth.model.OAuthToken
import com.kakao.sdk.common.model.ClientError
import com.kakao.sdk.common.model.ClientErrorCause
import com.kakao.sdk.user.UserApiClient
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.suspendCancellableCoroutine
import java.lang.ref.WeakReference
import java.util.UUID
import kotlin.coroutines.resume

actual object OAuthHandler {

    private var activityRef: WeakReference<ComponentActivity>? = null
    private var googleClientId: String = ""
    private var naverClientId: String = ""

    // 웹 OAuth 콜백 대기용
    private var pendingOAuthResult: CompletableDeferred<OAuthResult>? = null

    private const val SERVER_BASE = "http://43.200.206.239"
    private const val NAVER_REDIRECT_URI = "$SERVER_BASE/api/auth/callback/naver"

    fun initialize(
        activity: ComponentActivity,
        kakaoAppKey: String,
        naverClientId: String,
        googleClientId: String
    ) {
        activityRef = WeakReference(activity)
        this.googleClientId = googleClientId
        this.naverClientId = naverClientId

        // Kakao SDK 초기화
        com.kakao.sdk.common.KakaoSdk.init(activity, kakaoAppKey)
    }

    private fun requireActivity(): ComponentActivity =
        activityRef?.get() ?: throw IllegalStateException("Activity not available")

    actual suspend fun login(provider: AuthProvider): OAuthResult {
        return when (provider) {
            AuthProvider.KAKAO -> loginWithKakao()
            AuthProvider.NAVER -> loginWithNaver()
            AuthProvider.GOOGLE -> loginWithGoogle()
            AuthProvider.APPLE -> OAuthResult.Error("Apple 로그인은 iOS에서만 지원됩니다")
        }
    }

    private suspend fun loginWithKakao(): OAuthResult = suspendCancellableCoroutine { cont ->
        val activity = requireActivity()
        val callback: (OAuthToken?, Throwable?) -> Unit = { token, error ->
            if (error != null) {
                cont.resume(OAuthResult.Error(error.message ?: "카카오 로그인 실패"))
            } else if (token != null) {
                cont.resume(
                    OAuthResult.Success(
                        provider = AuthProvider.KAKAO,
                        accessToken = token.accessToken
                    )
                )
            } else {
                cont.resume(OAuthResult.Error("카카오 로그인 취소"))
            }
        }

        if (UserApiClient.instance.isKakaoTalkLoginAvailable(activity)) {
            UserApiClient.instance.loginWithKakaoTalk(activity) { token, error ->
                if (error != null) {
                    if (error is ClientError && error.reason == ClientErrorCause.Cancelled) {
                        cont.resume(OAuthResult.Error("카카오 로그인 취소"))
                        return@loginWithKakaoTalk
                    }
                    // 카카오톡 로그인 실패 시 카카오계정 로그인 시도
                    UserApiClient.instance.loginWithKakaoAccount(activity, callback = callback)
                } else {
                    callback(token, null)
                }
            }
        } else {
            UserApiClient.instance.loginWithKakaoAccount(activity, callback = callback)
        }
    }

    private suspend fun loginWithNaver(): OAuthResult {
        val activity = requireActivity()
        val state = UUID.randomUUID().toString()
        val url = "https://nid.naver.com/oauth2.0/authorize" +
                "?client_id=$naverClientId" +
                "&redirect_uri=$NAVER_REDIRECT_URI" +
                "&response_type=code" +
                "&state=$state"

        val deferred = CompletableDeferred<OAuthResult>()
        pendingOAuthResult = deferred

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        activity.startActivity(intent)

        return deferred.await()
    }

    /**
     * 서버 callback relay에서 돌아온 OAuth 딥링크 처리.
     * URI 형식: com.onebite.app://oauth/naver?code=...&state=...
     */
    fun handleOAuthCallback(uri: Uri) {
        val code = uri.getQueryParameter("code")
        val state = uri.getQueryParameter("state")

        if (code != null) {
            pendingOAuthResult?.complete(
                OAuthResult.Success(
                    provider = AuthProvider.NAVER,
                    authCode = code,
                    state = state
                )
            )
        } else {
            val error = uri.getQueryParameter("error") ?: "인증 코드를 받지 못했습니다"
            pendingOAuthResult?.complete(OAuthResult.Error(error))
        }
        pendingOAuthResult = null
    }

    private suspend fun loginWithGoogle(): OAuthResult {
        val activity = requireActivity()
        return try {
            val credentialManager = CredentialManager.create(activity)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(googleClientId)
                .build()
            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()
            val result = credentialManager.getCredential(activity, request)
            val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(result.credential.data)
            OAuthResult.Success(
                provider = AuthProvider.GOOGLE,
                idToken = googleIdTokenCredential.idToken
            )
        } catch (e: Exception) {
            OAuthResult.Error("Google 로그인 실패: ${e.message}")
        }
    }

    actual fun logout() {
        // Kakao 로그아웃
        UserApiClient.instance.logout { }
        // Naver — 서버 경유 웹 OAuth이므로 별도 SDK 로그아웃 불필요 (토큰 삭제로 처리)
    }

    actual fun isAvailable(provider: AuthProvider): Boolean {
        return when (provider) {
            AuthProvider.KAKAO -> true
            AuthProvider.NAVER -> true
            AuthProvider.GOOGLE -> true
            AuthProvider.APPLE -> false  // Android에서 Apple 로그인 미지원
        }
    }
}
