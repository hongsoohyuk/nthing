package com.onebite.server.auth

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class AuthCallbackRelayTest {

    @Autowired lateinit var mockMvc: MockMvc

    @Test
    fun `callback 은 nthing 스킴으로 provider 와 code 를 실어 리다이렉트한다`() {
        mockMvc.get("/api/auth/callback/kakao") {
            param("code", "ABC123")
        }.andExpect {
            status { is3xxRedirection() }
            redirectedUrl("nthing://auth/callback?provider=kakao&code=ABC123")
        }
    }

    @Test
    fun `code 가 없으면 error 를 실어 리다이렉트한다`() {
        mockMvc.get("/api/auth/callback/naver") {
            param("error", "access_denied")
        }.andExpect {
            status { is3xxRedirection() }
            redirectedUrl("nthing://auth/callback?provider=naver&error=access_denied")
        }
    }
}
