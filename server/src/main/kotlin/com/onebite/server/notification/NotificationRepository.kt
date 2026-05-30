package com.onebite.server.notification

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

interface NotificationRepository : JpaRepository<Notification, Long> {
    fun countByUserIdAndTypeAndCreatedAtAfter(
        userId: Long,
        type: NotificationType,
        createdAt: LocalDateTime,
    ): Long
}
