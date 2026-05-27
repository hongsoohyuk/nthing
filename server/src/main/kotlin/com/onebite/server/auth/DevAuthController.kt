package com.onebite.server.auth

import org.springframework.context.annotation.Profile
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

// 개발 전용 로그인. prod 프로파일에서는 빈 등록 자체가 안 됨(@Profile("!prod")).
// /api/auth/** 는 SecurityConfig 에서 이미 permitAll.
@Profile("!prod")
@RestController
@RequestMapping("/api/auth")
class DevAuthController(
    private val authService: AuthService
) {
    @PostMapping("/dev-login")
    fun devLogin(): AuthResponse = authService.devLogin()
}
