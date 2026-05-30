package com.onebite.server.notification

import org.springframework.data.jpa.repository.JpaRepository

interface DeviceRepository : JpaRepository<Device, Long> {
    fun findByFcmToken(fcmToken: String): Device?
    fun findByUserId(userId: Long): List<Device>
    fun deleteByFcmToken(fcmToken: String)
}
