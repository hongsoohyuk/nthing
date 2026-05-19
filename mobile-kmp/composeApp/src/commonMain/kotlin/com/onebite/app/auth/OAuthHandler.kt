package com.onebite.app.auth

expect object OAuthHandler {
    suspend fun login(provider: AuthProvider): OAuthResult
    fun logout()
    fun isAvailable(provider: AuthProvider): Boolean
}
