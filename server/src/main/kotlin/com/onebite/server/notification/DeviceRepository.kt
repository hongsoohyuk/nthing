package com.onebite.server.notification

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface DeviceRepository : JpaRepository<Device, Long> {
    fun findByFcmToken(fcmToken: String): Device?
    fun findByUserId(userId: Long): List<Device>
    fun deleteByFcmToken(fcmToken: String)

    @Query(
        value = """
            SELECT * FROM devices d
            WHERE d.nearby_alerts_enabled = TRUE
              AND d.latitude IS NOT NULL
              AND d.location_updated_at >= :activeAfter
              AND d.user_id <> :excludeUserId
              AND (6371 * ACOS(
                    COS(RADIANS(:lat)) * COS(RADIANS(d.latitude))
                    * COS(RADIANS(d.longitude) - RADIANS(:lng))
                    + SIN(RADIANS(:lat)) * SIN(RADIANS(d.latitude))
                  )) <= :radiusKm
        """,
        nativeQuery = true,
    )
    fun findActiveNearbyH2(
        @Param("lat") lat: Double,
        @Param("lng") lng: Double,
        @Param("radiusKm") radiusKm: Double,
        @Param("excludeUserId") excludeUserId: Long,
        @Param("activeAfter") activeAfter: LocalDateTime,
    ): List<Device>
}
