package com.onebite.app.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

actual object TokenStorage {

    private const val PREF_NAME = "onebite_secure_prefs"
    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_NICKNAME = "nickname"

    private var prefs: SharedPreferences? = null

    fun initialize(context: Context) {
        if (prefs != null) return
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context,
            PREF_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private fun requirePrefs(): SharedPreferences =
        prefs ?: throw IllegalStateException("TokenStorage not initialized. Call initialize(context) first.")

    actual fun saveToken(token: String) {
        requirePrefs().edit().putString(KEY_TOKEN, token).apply()
    }

    actual fun getToken(): String? {
        return requirePrefs().getString(KEY_TOKEN, null)
    }

    actual fun clearToken() {
        requirePrefs().edit().remove(KEY_TOKEN).apply()
    }

    actual fun saveUserInfo(userId: Long, nickname: String) {
        requirePrefs().edit()
            .putLong(KEY_USER_ID, userId)
            .putString(KEY_NICKNAME, nickname)
            .apply()
    }

    actual fun getUserId(): Long? {
        val prefs = requirePrefs()
        return if (prefs.contains(KEY_USER_ID)) prefs.getLong(KEY_USER_ID, 0L) else null
    }

    actual fun getNickname(): String? {
        return requirePrefs().getString(KEY_NICKNAME, null)
    }

    actual fun clearAll() {
        requirePrefs().edit().clear().apply()
    }
}
