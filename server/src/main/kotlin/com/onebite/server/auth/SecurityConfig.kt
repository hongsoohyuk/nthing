package com.onebite.server.auth

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtFilter: JwtFilter
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .cors { it.configurationSource(corsConfigurationSource()) } // 네이티브 웹뷰(cross-origin) preflight 허용
            .csrf { it.disable() }                          // API 서버니까 CSRF 비활성화
            .formLogin { it.disable() }                     // 폼 로그인 비활성화 (JWT 사용)
            .httpBasic { it.disable() }                     // HTTP Basic 비활성화
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // JWT 쓰니까 세션 안 씀
            }
            .authorizeHttpRequests {
                it
                    .requestMatchers("/api/auth/**").permitAll()   // 인증 없이 접근 가능
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/splits/my", "/api/splits/participated").authenticated() // /my, /participated 는 인증 필요 ({id}보다 먼저 매칭)
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/splits", "/api/splits/{id}").permitAll() // 둘러보기
                    .requestMatchers("/actuator/health").permitAll() // 헬스체크
                    .requestMatchers("/h2-console/**").permitAll() // 개발용 H2 콘솔
                    .requestMatchers("/error").permitAll()         // 에러 페이지 접근 허용
                    .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/{id}/trust").permitAll() // 공개 신뢰 프로필
                    .anyRequest().authenticated()                  // 나머지는 JWT 필요
            }
            .exceptionHandling {
                it.authenticationEntryPoint { _, response, _ ->
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), "인증이 필요합니다")
                }
            }
            .headers { it.frameOptions { fo -> fo.disable() } }   // H2 콘솔용
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter::class.java)
            .build()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        // 앱(웹뷰)의 AJAX 호출: Capacitor 웹뷰 origin(iOS/Android 모두 https://localhost)만 허용.
        // 토큰은 Authorization 헤더로 보내므로(쿠키 X) credentials 는 불필요.
        val appConfig = CorsConfiguration().apply {
            allowedOrigins = listOf(
                "https://localhost",     // iOS(iosScheme=https) + Android(androidScheme=https) 웹뷰
                "http://localhost",      // fallback
                "capacitor://localhost", // capacitor 기본 스킴 fallback
            )
            allowedMethods = listOf("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
            allowedHeaders = listOf("*")
        }
        // OAuth 콜백 릴레이는 provider 도메인(appleid.apple.com 등)에서 form_post/redirect 로
        // 들어오는 공개 네비게이션이라 origin 을 제한하면 안 된다(제한 시 "invalid cors request").
        val callbackConfig = CorsConfiguration().apply {
            allowedOriginPatterns = listOf("*")
            allowedMethods = listOf("GET", "POST", "OPTIONS")
            allowedHeaders = listOf("*")
        }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/api/auth/callback/**", callbackConfig) // 더 구체적인 패턴 먼저
            registerCorsConfiguration("/**", appConfig)
        }
    }
}
