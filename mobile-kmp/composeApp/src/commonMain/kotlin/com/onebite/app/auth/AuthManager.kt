package com.onebite.app.auth

import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.data.model.LoginResponse

object AuthManager {

    suspend fun login(provider: AuthProvider): Result<LoginResponse> {
        return try {
            val oauthResult = OAuthHandler.login(provider)
            when (oauthResult) {
                is OAuthResult.Success -> {
                    val response = when (provider) {
                        AuthProvider.KAKAO -> OneBiteApi.loginWithKakao(
                            code = oauthResult.authCode,
                            accessToken = oauthResult.accessToken
                        )
                        AuthProvider.NAVER -> OneBiteApi.loginWithNaver(
                            code = oauthResult.authCode!!,
                            state = oauthResult.state ?: ""
                        )
                        AuthProvider.GOOGLE -> OneBiteApi.loginWithGoogle(
                            code = oauthResult.authCode,
                            idToken = oauthResult.idToken
                        )
                        AuthProvider.APPLE -> OneBiteApi.loginWithApple(
                            idToken = oauthResult.idToken!!
                        )
                    }
                    TokenStorage.saveToken(response.token)
                    TokenStorage.saveUserInfo(response.userId, response.nickname)
                    OneBiteApi.setToken(response.token)
                    Result.success(response)
                }
                is OAuthResult.Error -> Result.failure(Exception(oauthResult.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun tryAutoLogin(): Boolean {
        val token = TokenStorage.getToken()
        if (token != null) {
            OneBiteApi.setToken(token)
            return true
        }
        return false
    }

    fun logout() {
        OAuthHandler.logout()
        TokenStorage.clearAll()
        OneBiteApi.clearToken()
    }

    fun isLoggedIn(): Boolean = TokenStorage.getToken() != null

    fun getCurrentNickname(): String? = TokenStorage.getNickname()
}
