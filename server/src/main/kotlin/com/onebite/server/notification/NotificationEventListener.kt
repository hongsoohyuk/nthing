package com.onebite.server.notification

import com.onebite.server.split.SplitCancelledEvent
import com.onebite.server.split.SplitCreatedEvent
import com.onebite.server.split.SplitJoinedEvent
import com.onebite.server.split.SplitMatchedEvent
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class NotificationEventListener(private val notificationService: NotificationService) {

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onSplitCreated(e: SplitCreatedEvent) = notificationService.notifyNearbyNewSplit(e.splitId)

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onSplitJoined(e: SplitJoinedEvent) = notificationService.notifySplitJoined(e.splitId, e.joinerUserId)

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onSplitMatched(e: SplitMatchedEvent) = notificationService.notifySplitMatched(e.splitId)

    @Async("notificationExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onSplitCancelled(e: SplitCancelledEvent) = notificationService.notifySplitCancelled(e.splitId)
}
