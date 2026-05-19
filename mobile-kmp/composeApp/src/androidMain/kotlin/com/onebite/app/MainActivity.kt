package com.onebite.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.kakao.vectormap.KakaoMapSdk
import com.onebite.app.auth.OAuthHandler
import com.onebite.app.auth.TokenStorage
import com.onebite.app.location.LocationProvider
import com.onebite.app.media.ImagePicker

class MainActivity : ComponentActivity() {

    private val oauthCallbackScheme = "com.onebite.app"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 위치 서비스 초기화 (registerForActivityResult 포함이므로 가장 먼저 호출)
        LocationProvider.initialize(this)
        ImagePicker.initialize(this)

        // 카카오맵 SDK 초기화
        KakaoMapSdk.init(this, BuildConfig.KAKAO_NATIVE_APP_KEY)

        // 인증 인프라 초기화
        TokenStorage.initialize(this)
        OAuthHandler.initialize(
            activity = this,
            kakaoAppKey = BuildConfig.KAKAO_NATIVE_APP_KEY,
            naverClientId = BuildConfig.NAVER_CLIENT_ID,
            googleClientId = BuildConfig.GOOGLE_CLIENT_ID_ANDROID
        )

        // 딥링크로 시작된 경우 OAuth 콜백 처리
        handleOAuthIntent(intent)

        setContent {
            App()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleOAuthIntent(intent)
    }

    private fun handleOAuthIntent(intent: Intent) {
        val uri = intent.data ?: return
        if (uri.scheme == oauthCallbackScheme) {
            OAuthHandler.handleOAuthCallback(uri)
        }
    }
}
