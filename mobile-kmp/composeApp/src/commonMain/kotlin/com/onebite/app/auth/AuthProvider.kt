package com.onebite.app.auth

enum class AuthProvider {
    KAKAO, NAVER, GOOGLE, APPLE
}

sealed class OAuthResult {
    data class Success(
        val provider: AuthProvider,
        val accessToken: String? = null,
        val authCode: String? = null,
        val state: String? = null,
        val idToken: String? = null
    ) : OAuthResult()

    data class Error(val message: String) : OAuthResult()
}
