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
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
class SplitControllerIntegrationTest {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper
    @Autowired lateinit var jwtProvider: JwtProvider
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var splitRepository: SplitRepository
    @Autowired lateinit var splitParticipantRepository: SplitParticipantRepository

    private lateinit var userA: User
    private lateinit var userB: User
    private lateinit var tokenA: String
    private lateinit var tokenB: String

    @BeforeEach
    fun setup() {
        splitParticipantRepository.deleteAll()
        splitRepository.deleteAll()
        userRepository.deleteAll()

        userA = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "a1", nickname = "유저A"))
        userB = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "b1", nickname = "유저B"))
        tokenA = jwtProvider.generateToken(userA.id)
        tokenB = jwtProvider.generateToken(userB.id)
    }

    private fun createSplitDto(
        productName: String = "두쫀쿠 4개입",
        category: SplitCategory = SplitCategory.OTHER
    ) = CreateSplitDto(
        productName = productName,
        totalPrice = 20000,
        totalQty = 4,
        splitCount = 2,
        latitude = 37.5665,
        longitude = 126.9780,
        address = "서울시 중구",
        category = category
    )

    private fun postSplit(dto: CreateSplitDto) {
        mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(dto)
        }.andExpect { status { isCreated() } }
    }

    @Test
    fun `GET splits 비인증 조회 가능`() {
        mockMvc.get("/api/splits").andExpect { status { isOk() } }
    }

    @Test
    fun `POST splits 인증 필요`() {
        mockMvc.post("/api/splits") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto())
        }.andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `POST splits 인증 후 생성 성공`() {
        mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto())
        }.andExpect {
            status { isCreated() }
            jsonPath("$.productName") { value("두쫀쿠 4개입") }
            jsonPath("$.author.nickname") { value("유저A") }
            jsonPath("$.status") { value("WAITING") }
        }
    }

    @Test
    fun `GET splits by id 조회`() {
        val result = mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto())
        }.andReturn()

        val id = objectMapper.readTree(result.response.contentAsString)["id"].asLong()

        mockMvc.get("/api/splits/$id").andExpect {
            status { isOk() }
            jsonPath("$.id") { value(id) }
        }
    }

    @Test
    fun `GET splits 존재하지 않는 id 404`() {
        mockMvc.get("/api/splits/99999").andExpect { status { isNotFound() } }
    }

    @Test
    fun `POST join 참여 성공`() {
        val result = mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto())
        }.andReturn()

        val id = objectMapper.readTree(result.response.contentAsString)["id"].asLong()

        mockMvc.post("/api/splits/$id/join") {
            header("Authorization", "Bearer $tokenB")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("MATCHED") }
            jsonPath("$.currentParticipants") { value(2) }
        }
    }

    @Test
    fun `POST join 본인 글 참여 불가`() {
        val result = mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto())
        }.andReturn()

        val id = objectMapper.readTree(result.response.contentAsString)["id"].asLong()

        mockMvc.post("/api/splits/$id/join") {
            header("Authorization", "Bearer $tokenA")
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `PATCH cancel 작성자만 취소 가능`() {
        val result = mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto())
        }.andReturn()

        val id = objectMapper.readTree(result.response.contentAsString)["id"].asLong()

        // 다른 유저가 취소 시도 → 403
        mockMvc.patch("/api/splits/$id/cancel") {
            header("Authorization", "Bearer $tokenB")
        }.andExpect { status { isForbidden() } }

        // 작성자가 취소 → 성공
        mockMvc.patch("/api/splits/$id/cancel") {
            header("Authorization", "Bearer $tokenA")
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("CANCELLED") }
        }
    }

    @Test
    fun `GET splits my 인증 필요`() {
        mockMvc.get("/api/splits/my").andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `POST splits 카테고리 저장 및 응답`() {
        mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(createSplitDto(category = SplitCategory.FOOD))
        }.andExpect {
            status { isCreated() }
            jsonPath("$.category") { value("FOOD") }
        }
    }

    @Test
    fun `POST splits 카테고리 미지정 시 OTHER 기본값`() {
        mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            // category 필드 없이 전송
            content = """{"productName":"휴지 30롤","totalPrice":18000,"totalQty":30,"splitCount":2,"latitude":37.5,"longitude":127.0,"address":"서울"}"""
        }.andExpect {
            status { isCreated() }
            jsonPath("$.category") { value("OTHER") }
        }
    }

    @Test
    fun `GET splits category 필터`() {
        postSplit(createSplitDto(productName = "두쫀쿠 4개입", category = SplitCategory.FOOD))
        postSplit(createSplitDto(productName = "휴지 30롤", category = SplitCategory.HOUSEHOLD))
        postSplit(createSplitDto(productName = "원두 1kg", category = SplitCategory.BEVERAGE))

        mockMvc.get("/api/splits?category=HOUSEHOLD").andExpect {
            status { isOk() }
            jsonPath("$.totalElements") { value(1) }
            jsonPath("$.content[0].productName") { value("휴지 30롤") }
            jsonPath("$.content[0].category") { value("HOUSEHOLD") }
        }
    }

    @Test
    fun `GET splits q 키워드 검색`() {
        postSplit(createSplitDto(productName = "두쫀쿠 4개입", category = SplitCategory.FOOD))
        postSplit(createSplitDto(productName = "초코 두쫀쿠 6개입", category = SplitCategory.FOOD))
        postSplit(createSplitDto(productName = "휴지 30롤", category = SplitCategory.HOUSEHOLD))

        mockMvc.get("/api/splits?q=두쫀쿠").andExpect {
            status { isOk() }
            jsonPath("$.totalElements") { value(2) }
        }
    }

    @Test
    fun `GET splits category 와 q 동시 필터`() {
        postSplit(createSplitDto(productName = "두쫀쿠 4개입", category = SplitCategory.FOOD))
        postSplit(createSplitDto(productName = "두쫀쿠 베이킹세트", category = SplitCategory.HOUSEHOLD))

        mockMvc.get("/api/splits?category=FOOD&q=두쫀쿠").andExpect {
            status { isOk() }
            jsonPath("$.totalElements") { value(1) }
            jsonPath("$.content[0].category") { value("FOOD") }
        }
    }

    @Test
    fun `GET splits 필터 없으면 전체 반환`() {
        postSplit(createSplitDto(productName = "두쫀쿠 4개입", category = SplitCategory.FOOD))
        postSplit(createSplitDto(productName = "휴지 30롤", category = SplitCategory.HOUSEHOLD))

        mockMvc.get("/api/splits").andExpect {
            status { isOk() }
            jsonPath("$.totalElements") { value(2) }
        }
    }

    @Test
    fun `POST splits validation 에러`() {
        mockMvc.post("/api/splits") {
            header("Authorization", "Bearer $tokenA")
            contentType = MediaType.APPLICATION_JSON
            content = """{"productName":"","totalPrice":0,"totalQty":0,"splitCount":1,"latitude":0,"longitude":0,"address":"addr"}"""
        }.andExpect { status { isBadRequest() } }
    }
}
