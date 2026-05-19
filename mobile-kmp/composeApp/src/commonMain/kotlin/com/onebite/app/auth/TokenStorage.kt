package com.onebite.app.auth

expect object TokenStorage {
    fun saveToken(token: String)
    fun getToken(): String?
    fun clearToken()
    fun saveUserInfo(userId: Long, nickname: String)
    fun getUserId(): Long?
    fun getNickname(): String?
    fun clearAll()
}
