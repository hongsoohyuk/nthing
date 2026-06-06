package com.onebite.server.user

import com.onebite.server.split.SplitParticipantRepository
import com.onebite.server.split.SplitRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlin.test.assertFalse

@SpringBootTest
@AutoConfigureMockMvc
class TrustProfileTest {
    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var splitParticipantRepository: SplitParticipantRepository
    @Autowired lateinit var splitRepository: SplitRepository
    @Autowired lateinit var trustProfileService: TrustProfileService

    @BeforeEach
    fun setup() {
        splitParticipantRepository.deleteAll()
        splitRepository.deleteAll()
        userRepository.deleteAll()
    }

    private fun newUser(c: Int, b: Int, lc: Int): User {
        val u = User(provider = AuthProvider.KAKAO, providerId = "p${System.nanoTime()}", nickname = "유저")
        u.completedCount = c; u.brokenCount = b; u.lateCancelCount = lc
        return userRepository.save(u)
    }

    @Test
    fun `약속 5회 미만이면 신규 배지 성사율 null`() {
        val u = newUser(c = 2, b = 0, lc = 0)
        val p = trustProfileService.getProfile(u.id)
        assertTrue(p.isNewcomer)
        assertNull(p.successRate)
        assertEquals("🌱 신규 · 아직 거래 기록이 적어요", p.toneLabel)
    }

    @Test
    fun `약속 5회 이상이면 성사율 계산`() {
        val u = newUser(c = 34, b = 3, lc = 0)  // 약속 37, 34/37=91.89 → 92
        val p = trustProfileService.getProfile(u.id)
        assertFalse(p.isNewcomer)
        assertEquals(92, p.successRate)
        assertEquals(37, p.promiseCount)
        assertEquals("약속을 잘 지켜요", p.toneLabel)
    }

    @Test
    fun `성사율 70 미만 경고 톤`() {
        val u = newUser(c = 3, b = 4, lc = 0)   // 약속 7, 3/7=42.8 → 43
        val p = trustProfileService.getProfile(u.id)
        assertEquals(43, p.successRate)
        assertEquals("최근 약속을 자주 못 지켰어요", p.toneLabel)
    }

    @Test
    fun `GET trust 비인증 공개 조회`() {
        val u = newUser(c = 10, b = 0, lc = 0)
        mockMvc.get("/api/users/${u.id}/trust").andExpect { status { isOk() } }
    }
}
