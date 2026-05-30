package com.onebite.server.notification

data class PushMessage(
    val type: NotificationType,
    val title: String,
    val body: String,
    val splitId: Long? = null,
)

data class PushTarget(val token: String, val message: PushMessage)

enum class SendOutcome { SUCCESS, INVALID_TOKEN, FAILED }
