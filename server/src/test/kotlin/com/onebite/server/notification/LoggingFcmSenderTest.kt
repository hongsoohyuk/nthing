package com.onebite.server.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class LoggingFcmSenderTest {
    @Test
    fun `noop sender 는 모든 타겟에 SUCCESS`() {
        val sender = LoggingFcmSender()
        val outcomes = sender.send(
            listOf(
                PushTarget("tok-1", PushMessage(NotificationType.SPLIT_JOINED, "t", "b")),
                PushTarget("tok-2", PushMessage(NotificationType.NEARBY_NEW_SPLIT, "t", "b", splitId = 9)),
            ),
        )
        assertEquals(listOf(SendOutcome.SUCCESS, SendOutcome.SUCCESS), outcomes)
    }
}
