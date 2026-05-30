package com.onebite.server.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.time.LocalDateTime

@SpringBootTest
class DeviceLocationQueryTest {
    @Autowired lateinit var deviceRepository: DeviceRepository
    @Autowired lateinit var query: DeviceLocationQuery

    // 서울시청
    private val baseLat = 37.5665
    private val baseLng = 126.9780
    private val recently = LocalDateTime.now().minusMinutes(5)
    private val activeAfter = LocalDateTime.now().minusDays(14)

    @BeforeEach fun setup() { deviceRepository.deleteAll() }

    private fun device(
        userId: Long, lat: Double?, lng: Double?, enabled: Boolean = true,
        locAt: LocalDateTime? = recently,
    ) = deviceRepository.save(
        Device(userId = userId, fcmToken = "tok-$userId-${System.nanoTime()}", platform = Platform.ANDROID,
            latitude = lat, longitude = lng, locationUpdatedAt = locAt, nearbyAlertsEnabled = enabled),
    )

    @Test
    fun `반경 내 활성 기기만 조회되고 작성자는 제외`() {
        device(userId = 1, lat = baseLat, lng = baseLng)               // 작성자 → 제외
        device(userId = 2, lat = 37.5670, lng = 126.9785)              // 근처 → 포함
        device(userId = 3, lat = 35.1796, lng = 129.0756)             // 부산 → 반경 밖
        device(userId = 4, lat = baseLat, lng = baseLng, enabled = false) // 알림 끔 → 제외
        device(userId = 5, lat = null, lng = null)                     // 위치 없음 → 제외
        device(userId = 6, lat = baseLat, lng = baseLng, locAt = LocalDateTime.now().minusDays(30)) // 비활성 → 제외

        val result = query.findActiveNearbyExcludingUser(baseLat, baseLng, 3.0, excludeUserId = 1, activeAfter)

        assertEquals(1, result.size)
        assertEquals(2L, result.first().userId)
        assertTrue(result.none { it.userId == 1L })
    }
}
