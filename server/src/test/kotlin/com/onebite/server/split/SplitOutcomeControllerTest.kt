package com.onebite.server.split

import com.fasterxml.jackson.databind.ObjectMapper
import com.onebite.server.auth.JwtProvider
import com.onebite.server.user.AuthProvider
import com.onebite.server.user.User
import com.onebite.server.user.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
class SplitOutcomeControllerTest {
    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper
    @Autowired lateinit var jwtProvider: JwtProvider
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var splitRepository: SplitRepository
    @Autowired lateinit var participantRepository: SplitParticipantRepository
    @Autowired lateinit var splitService: SplitService

    private lateinit var author: User
    private lateinit var joiner: User
    private lateinit var tokenA: String
    private lateinit var tokenB: String

    @BeforeEach
    fun setup() {
        participantRepository.deleteAll(); splitRepository.deleteAll(); userRepository.deleteAll()
        author = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "au${System.nanoTime()}", nickname = "작성자"))
        joiner = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "jo${System.nanoTime()}", nickname = "참여자"))
        tokenA = jwtProvider.generateToken(author.id)
        tokenB = jwtProvider.generateToken(joiner.id)
    }

    private fun matchedSplit(): Long {
        val s = splitService.create(
            CreateSplitDto(
                productName = "두쫀쿠",
                totalPrice = 20000,
                totalQty = 4,
                splitCount = 2,
                imageUrl = null,
                latitude = 37.5665,
                longitude = 126.9780,
                address = "서울"
            ),
            author.id
        )
        splitService.join(s.id, joiner.id)
        return s.id
    }

    @Test
    fun `complete 비인증 401`() {
        val id = matchedSplit()
        mockMvc.post("/api/splits/$id/complete").andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `complete 양방확인 후 COMPLETED`() {
        val id = matchedSplit()
        mockMvc.post("/api/splits/$id/complete") { header("Authorization", "Bearer $tokenA") }
            .andExpect { status { isOk() } }
        mockMvc.post("/api/splits/$id/complete") { header("Authorization", "Bearer $tokenB") }
            .andExpect { status { isOk() }; jsonPath("$.status") { value("COMPLETED") } }
    }

    @Test
    fun `report-broken 참여자가 주최자 신고`() {
        val id = matchedSplit()
        mockMvc.post("/api/splits/$id/report-broken") {
            header("Authorization", "Bearer $tokenB")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(ReportBrokenDto(targetUserId = author.id, reasonTag = "안나옴"))
        }.andExpect { status { isOk() } }
    }

    @Test
    fun `leave 참여자 이탈`() {
        val id = matchedSplit()
        mockMvc.post("/api/splits/$id/leave") { header("Authorization", "Bearer $tokenB") }
            .andExpect { status { isOk() } }
    }
}
