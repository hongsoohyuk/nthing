package com.onebite.server.report

import com.onebite.server.auth.JwtProvider
import com.onebite.server.notification.DeviceRepository
import com.onebite.server.split.SplitParticipantRepository
import com.onebite.server.split.SplitRepository
import com.onebite.server.user.AuthProvider
import com.onebite.server.user.User
import com.onebite.server.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
class ReportControllerIntegrationTest {
    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var jwtProvider: JwtProvider
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var reportRepository: ReportRepository
    @Autowired lateinit var blockRepository: BlockRepository
    @Autowired lateinit var splitParticipantRepository: SplitParticipantRepository
    @Autowired lateinit var splitRepository: SplitRepository
    @Autowired lateinit var deviceRepository: DeviceRepository

    private lateinit var token: String
    private var meId: Long = 0
    private var otherId: Long = 0

    @BeforeEach
    fun setup() {
        // 다른 통합 테스트가 남긴 users FK 참조 행을 먼저 정리한다
        blockRepository.deleteAll()
        reportRepository.deleteAll()
        splitParticipantRepository.deleteAll()
        splitRepository.deleteAll()
        deviceRepository.deleteAll()
        userRepository.deleteAll()
        val me = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "me", nickname = "나"))
        val other = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "other", nickname = "상대"))
        meId = me.id
        otherId = other.id
        token = jwtProvider.generateToken(me.id)
    }

    @Test
    fun `신고 인증 필요`() {
        mockMvc.post("/api/reports") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"targetType":"USER","targetId":$otherId,"reason":"SPAM"}"""
        }.andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `유저 신고 성공`() {
        mockMvc.post("/api/reports") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"targetType":"USER","targetId":$otherId,"reason":"FRAUD","detail":"사기 의심"}"""
        }.andExpect { status { isCreated() } }
        assertEquals(1, reportRepository.count())
    }

    @Test
    fun `존재하지 않는 유저 신고 404`() {
        mockMvc.post("/api/reports") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"targetType":"USER","targetId":999999,"reason":"SPAM"}"""
        }.andExpect { status { isNotFound() } }
    }

    @Test
    fun `본인 신고 불가 400`() {
        mockMvc.post("/api/reports") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"targetType":"USER","targetId":$meId,"reason":"SPAM"}"""
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `차단 생성 조회 해제 플로우`() {
        // block
        mockMvc.post("/api/blocks") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"userId":$otherId}"""
        }.andExpect { status { isCreated() } }
        assertTrue(blockRepository.existsByBlockerIdAndBlockedId(meId, otherId))

        // duplicate block is idempotent (still CREATED, no second row)
        mockMvc.post("/api/blocks") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"userId":$otherId}"""
        }.andExpect { status { isCreated() } }
        assertEquals(1, blockRepository.count())

        // list
        mockMvc.get("/api/blocks") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.blockedUserIds[0]") { value(otherId.toInt()) }
        }

        // unblock
        mockMvc.delete("/api/blocks/$otherId") {
            header("Authorization", "Bearer $token")
        }.andExpect { status { isNoContent() } }
        assertTrue(blockRepository.findByBlockerId(meId).isEmpty())
    }

    @Test
    fun `본인 차단 불가 400`() {
        mockMvc.post("/api/blocks") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"userId":$meId}"""
        }.andExpect { status { isBadRequest() } }
    }
}
