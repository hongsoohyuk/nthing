package com.onebite.server.notification

import com.onebite.server.split.SplitParticipant
import com.onebite.server.split.SplitParticipantRepository
import com.onebite.server.split.SplitRepository
import com.onebite.server.split.SplitRequest
import com.onebite.server.user.AuthProvider
import com.onebite.server.user.User
import com.onebite.server.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import java.time.LocalDateTime

class RecordingFcmSender : FcmSender {
    val sent = mutableListOf<PushTarget>()
    var nextOutcome: (PushTarget) -> SendOutcome = { SendOutcome.SUCCESS }
    override fun send(targets: List<PushTarget>): List<SendOutcome> {
        sent.addAll(targets); return targets.map(nextOutcome)
    }
    fun reset() { sent.clear(); nextOutcome = { SendOutcome.SUCCESS } }
}

@SpringBootTest
class NotificationServiceTest {
    @TestConfiguration
    class Config {
        @Bean @Primary fun recordingFcmSender() = RecordingFcmSender()
    }

    @Autowired lateinit var service: NotificationService
    @Autowired lateinit var sender: RecordingFcmSender
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var deviceRepository: DeviceRepository
    @Autowired lateinit var splitRepository: SplitRepository
    @Autowired lateinit var participantRepository: SplitParticipantRepository

    private lateinit var author: User
    private lateinit var neighbor: User

    @BeforeEach
    fun setup() {
        participantRepository.deleteAll(); splitRepository.deleteAll()
        deviceRepository.deleteAll(); userRepository.deleteAll()
        sender.reset()
        author = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "au", nickname = "작성자"))
        neighbor = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "ne", nickname = "이웃"))
    }

    private fun saveSplit() = splitRepository.save(
        SplitRequest(author = author, productName = "두쫀쿠", totalPrice = 20000, totalQty = 4,
            splitCount = 2, latitude = 37.5665, longitude = 126.9780, address = "서울"),
    )

    private fun saveDevice(userId: Long, token: String, lat: Double? = 37.567, lng: Double? = 126.978) =
        deviceRepository.save(Device(userId = userId, fcmToken = token, platform = Platform.ANDROID,
            latitude = lat, longitude = lng, locationUpdatedAt = LocalDateTime.now()))

    @Test
    fun `근처 새 반띵 — 이웃에게 전송, 작성자 제외`() {
        saveDevice(author.id, "tok-author")
        saveDevice(neighbor.id, "tok-neighbor")
        val split = saveSplit()

        service.notifyNearbyNewSplit(split.id)

        assertEquals(1, sender.sent.size)
        assertEquals("tok-neighbor", sender.sent.first().token)
        assertTrue(sender.sent.first().message.body.contains("두쫀쿠"))
    }

    @Test
    fun `참여 알림 — 작성자에게 전송`() {
        saveDevice(author.id, "tok-author")
        val split = saveSplit()
        service.notifySplitJoined(split.id, neighbor.id)
        assertEquals(1, sender.sent.size)
        assertEquals(NotificationType.SPLIT_JOINED, sender.sent.first().message.type)
    }

    @Test
    fun `취소 알림 — 참여자에게 전송`() {
        val split = saveSplit()
        participantRepository.save(SplitParticipant(splitRequest = split, user = neighbor))
        saveDevice(neighbor.id, "tok-neighbor")
        service.notifySplitCancelled(split.id)
        assertEquals(1, sender.sent.size)
        assertEquals(NotificationType.SPLIT_CANCELLED, sender.sent.first().message.type)
    }

    @Test
    fun `무효 토큰은 기기 삭제`() {
        saveDevice(neighbor.id, "tok-neighbor")
        val split = saveSplit()
        sender.nextOutcome = { SendOutcome.INVALID_TOKEN }
        service.notifyNearbyNewSplit(split.id)
        assertNull(deviceRepository.findByFcmToken("tok-neighbor"))
    }
}
