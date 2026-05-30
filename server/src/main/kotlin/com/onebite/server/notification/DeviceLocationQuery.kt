package com.onebite.server.notification

import jakarta.persistence.EntityManager
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import java.time.LocalDateTime

interface DeviceLocationQuery {
    fun findActiveNearbyExcludingUser(
        lat: Double, lng: Double, radiusKm: Double, excludeUserId: Long, activeAfter: LocalDateTime,
    ): List<Device>
}

@Component
@Profile("!prod")
class H2DeviceLocationQuery(private val deviceRepository: DeviceRepository) : DeviceLocationQuery {
    override fun findActiveNearbyExcludingUser(
        lat: Double, lng: Double, radiusKm: Double, excludeUserId: Long, activeAfter: LocalDateTime,
    ): List<Device> = deviceRepository.findActiveNearbyH2(lat, lng, radiusKm, excludeUserId, activeAfter)
}

@Component
@Profile("prod")
class PostgisDeviceLocationQuery(private val entityManager: EntityManager) : DeviceLocationQuery {
    override fun findActiveNearbyExcludingUser(
        lat: Double, lng: Double, radiusKm: Double, excludeUserId: Long, activeAfter: LocalDateTime,
    ): List<Device> {
        val radiusMeters = radiusKm * 1000
        val sql = """
            SELECT d.* FROM devices d
            WHERE d.nearby_alerts_enabled = TRUE
              AND d.location IS NOT NULL
              AND d.location_updated_at >= :activeAfter
              AND d.user_id <> :excludeUserId
              AND ST_DWithin(d.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
        """
        @Suppress("UNCHECKED_CAST")
        return entityManager.createNativeQuery(sql, Device::class.java)
            .setParameter("lat", lat)
            .setParameter("lng", lng)
            .setParameter("radius", radiusMeters)
            .setParameter("excludeUserId", excludeUserId)
            .setParameter("activeAfter", activeAfter)
            .resultList as List<Device>
    }
}
