package com.onebite.server.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class DeviceServiceTest {
    @Autowired lateinit var deviceService: DeviceService
    @Autowired lateinit var deviceRepository: DeviceRepository

    @BeforeEach fun setup() { deviceRepository.deleteAll() }

    @Test
    fun `신규 등록 후 같은 토큰 재등록은 같은 행 갱신`() {
        deviceService.upsert(1, RegisterDeviceRequest("tok-1", Platform.ANDROID, lat = 37.5, lng = 127.0))
        deviceService.upsert(1, RegisterDeviceRequest("tok-1", Platform.ANDROID, lat = 37.6, lng = 127.1))

        val all = deviceRepository.findByUserId(1)
        assertEquals(1, all.size)
        assertEquals(37.6, all.first().latitude)
        assertNotNull(all.first().locationUpdatedAt)
    }

    @Test
    fun `nearbyAlertsEnabled 토글`() {
        deviceService.upsert(1, RegisterDeviceRequest("tok-1", Platform.IOS))
        deviceService.upsert(1, RegisterDeviceRequest("tok-1", Platform.IOS, nearbyAlertsEnabled = false))
        assertEquals(false, deviceRepository.findByFcmToken("tok-1")?.nearbyAlertsEnabled)
    }

    @Test
    fun `unregister 삭제`() {
        deviceService.upsert(1, RegisterDeviceRequest("tok-1", Platform.IOS))
        deviceService.unregister("tok-1")
        assertNull(deviceRepository.findByFcmToken("tok-1"))
    }
}
