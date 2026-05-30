package com.onebite.server.notification

import jakarta.persistence.*
import java.time.LocalDateTime

enum class NotificationType { NEARBY_NEW_SPLIT, SPLIT_JOINED, SPLIT_MATCHED, SPLIT_CANCELLED }
enum class NotificationStatus { SENT, FAILED }

@Entity
@Table(name = "notifications")
class Notification(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id")
    val userId: Long,

    @Enumerated(EnumType.STRING)
    val type: NotificationType,

    val title: String,
    val body: String,

    @Column(name = "split_id")
    val splitId: Long? = null,

    @Enumerated(EnumType.STRING)
    val status: NotificationStatus,

    val createdAt: LocalDateTime = LocalDateTime.now(),
)
