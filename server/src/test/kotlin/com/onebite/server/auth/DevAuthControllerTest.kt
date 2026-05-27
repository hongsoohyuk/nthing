package com.onebite.server.auth

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
class DevAuthControllerTest {

    @Autowired lateinit var mockMvc: MockMvc
    @Autowired lateinit var objectMapper: ObjectMapper

    @Test
    fun `dev-login 은 실제 JWT 를 발급하고 그 토큰으로 내 정보 조회가 된다`() {
        val body = mockMvc.post("/api/auth/dev-login").andExpect {
            status { isOk() }
            jsonPath("$.token") { exists() }
            jsonPath("$.nickname") { value("개발테스터") }
        }.andReturn().response.contentAsString

        val token = objectMapper.readTree(body).get("token").asText()

        mockMvc.get("/api/users/me") {
            header("Authorization", "Bearer $token")
        }.andExpect {
            status { isOk() }
            jsonPath("$.nickname") { value("개발테스터") }
        }
    }
}
