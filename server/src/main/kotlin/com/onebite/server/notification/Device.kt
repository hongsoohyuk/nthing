package com.onebite.server.notification

import jakarta.persistence.*
import java.time.LocalDateTime

enum class Platform { IOS, ANDROID }

@Entity
@Table(name = "devices", uniqueConstraints = [UniqueConstraint(columnNames = ["fcm_token"])])
class Device(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id")
    val userId: Long,

    @Column(name = "fcm_token")
    var fcmToken: String,

    @Enumerated(EnumType.STRING)
    var platform: Platform,

    var latitude: Double? = null,
    var longitude: Double? = null,
    var locationUpdatedAt: LocalDateTime? = null,

    @Column(name = "nearby_alerts_enabled")
    var nearbyAlertsEnabled: Boolean = true,

    val createdAt: LocalDateTime = LocalDateTime.now(),
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
