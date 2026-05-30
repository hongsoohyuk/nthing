package com.onebite.server.notification

import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.MessagingErrorCode
import com.google.firebase.messaging.Notification as FcmNotification
import org.slf4j.LoggerFactory

interface FcmSender {
    fun send(targets: List<PushTarget>): List<SendOutcome>
}

class LoggingFcmSender : FcmSender {
    private val log = LoggerFactory.getLogger(javaClass)
    override fun send(targets: List<PushTarget>): List<SendOutcome> {
        targets.forEach { log.info("[FCM:noop] -> {} : {} / {}", it.token.take(8), it.message.title, it.message.body) }
        return targets.map { SendOutcome.SUCCESS }
    }
}

class FirebaseFcmSender(@Suppress("unused") firebaseApp: FirebaseApp) : FcmSender {
    private val log = LoggerFactory.getLogger(javaClass)
    override fun send(targets: List<PushTarget>): List<SendOutcome> {
        if (targets.isEmpty()) return emptyList()
        val messages = targets.map { t ->
            Message.builder()
                .setToken(t.token)
                .setNotification(FcmNotification.builder().setTitle(t.message.title).setBody(t.message.body).build())
                .putData("type", t.message.type.name)
                .apply { t.message.splitId?.let { putData("splitId", it.toString()) } }
                .build()
        }
        val response = FirebaseMessaging.getInstance().sendEach(messages)
        return response.responses.map { r ->
            when {
                r.isSuccessful -> SendOutcome.SUCCESS
                r.exception?.messagingErrorCode in setOf(MessagingErrorCode.UNREGISTERED, MessagingErrorCode.INVALID_ARGUMENT) -> SendOutcome.INVALID_TOKEN
                else -> { log.warn("FCM send failed: {}", r.exception?.message); SendOutcome.FAILED }
            }
        }
    }
}
