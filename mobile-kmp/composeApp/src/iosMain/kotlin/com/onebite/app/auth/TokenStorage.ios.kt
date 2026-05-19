package com.onebite.app.auth

import platform.Foundation.NSUserDefaults

// TODO: Keychain 으로 교체. 직전 시도(SecItem* 직접 호출)는 Kotlin/Native에서
// CFStringRef → NSString 캐스팅이 런타임에 안전하지 않아 크래시. Swift 헬퍼로
// `import iosApp` 후 호출하거나, CFDictionaryCreate 로 CF 키/값을 직접 다루는
// 구현으로 교체해야 함.
actual object TokenStorage {

    private const val KEY_TOKEN = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_NICKNAME = "nickname"

    private val defaults get() = NSUserDefaults.standardUserDefaults

    actual fun saveToken(token: String) {
        defaults.setObject(token, forKey = KEY_TOKEN)
    }

    actual fun getToken(): String? = defaults.stringForKey(KEY_TOKEN)

    actual fun clearToken() {
        defaults.removeObjectForKey(KEY_TOKEN)
    }

    actual fun saveUserInfo(userId: Long, nickname: String) {
        defaults.setObject(userId.toString(), forKey = KEY_USER_ID)
        defaults.setObject(nickname, forKey = KEY_NICKNAME)
    }

    actual fun getUserId(): Long? = defaults.stringForKey(KEY_USER_ID)?.toLongOrNull()

    actual fun getNickname(): String? = defaults.stringForKey(KEY_NICKNAME)

    actual fun clearAll() {
        defaults.removeObjectForKey(KEY_TOKEN)
        defaults.removeObjectForKey(KEY_USER_ID)
        defaults.removeObjectForKey(KEY_NICKNAME)
    }
}
