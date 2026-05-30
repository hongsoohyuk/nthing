package com.onebite.server.notification

import com.fasterxml.jackson.databind.ObjectMapper
import com.onebite.server.auth.JwtProvider
import com.onebite.server.user.AuthProvider
import com.onebite.server.user.User
import com.onebite.server.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
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
class DeviceControllerIntegrationTest {
    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper
    @Autowired lateinit var jwtProvider: JwtProvider
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var deviceRepository: DeviceRepository

    private lateinit var token: String

    @BeforeEach
    fun setup() {
        deviceRepository.deleteAll()
        userRepository.deleteAll()
        val user = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "a1", nickname = "유저A"))
        token = jwtProvider.generateToken(user.id)
    }

    @Test
    fun `기기 등록 인증 필요`() {
        mockMvc.post("/api/devices") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"fcmToken":"tok-1","platform":"ANDROID"}"""
        }.andExpect { status { isUnauthorized() } }
    }

    @Test
    fun `기기 등록 성공`() {
        mockMvc.post("/api/devices") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"fcmToken":"tok-1","platform":"ANDROID","lat":37.5,"lng":127.0}"""
        }.andExpect { status { isOk() } }
        assertEquals(1, deviceRepository.findByFcmToken("tok-1")?.let { 1 } ?: 0)
    }

    @Test
    fun `unregister 204`() {
        mockMvc.post("/api/devices") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"fcmToken":"tok-1","platform":"IOS"}"""
        }
        mockMvc.post("/api/devices/unregister") {
            header("Authorization", "Bearer $token")
            contentType = MediaType.APPLICATION_JSON
            content = """{"fcmToken":"tok-1"}"""
        }.andExpect { status { isNoContent() } }
    }
}
