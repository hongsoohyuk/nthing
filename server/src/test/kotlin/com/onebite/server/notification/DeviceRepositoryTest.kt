package com.onebite.server.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class DeviceRepositoryTest {
    @Autowired lateinit var deviceRepository: DeviceRepository

    @BeforeEach fun setup() { deviceRepository.deleteAll() }

    @Test
    fun `토큰으로 upsert 후 조회`() {
        deviceRepository.save(Device(userId = 1, fcmToken = "tok-1", platform = Platform.ANDROID))
        val found = deviceRepository.findByFcmToken("tok-1")
        assertEquals(1L, found?.userId)
    }

    @Test
    @org.springframework.transaction.annotation.Transactional
    fun `토큰으로 삭제`() {
        deviceRepository.save(Device(userId = 1, fcmToken = "tok-1", platform = Platform.IOS))
        deviceRepository.deleteByFcmToken("tok-1")
        assertNull(deviceRepository.findByFcmToken("tok-1"))
    }
}
