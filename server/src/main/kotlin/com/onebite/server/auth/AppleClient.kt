package com.onebite.server.auth

import io.jsonwebtoken.Jwts
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestTemplate
import java.math.BigInteger
import java.security.KeyFactory
import java.security.PublicKey
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.RSAPublicKeySpec
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Base64
import java.util.Date
import java.util.concurrent.ConcurrentHashMap

@Component
class AppleClient(
    @Value("\${apple.client-id}") private val clientId: String,           // Services ID (web OAuth aud)
    @Value("\${apple.bundle-id:}") private val bundleId: String,          // 앱 번들 ID (네이티브 로그인 aud)
    @Value("\${apple.team-id:}") private val teamId: String,
    @Value("\${apple.key-id:}") private val keyId: String,
    @Value("\${apple.private-key-base64:}") private val privateKeyBase64: String,
    @Value("\${apple.redirect-uri:}") private val redirectUri: String
) {
    // 허용 audience: 웹(Services ID) + 네이티브(번들 ID). 빈 값은 제외.
    private val allowedAudiences: Set<String>
        get() = setOf(clientId, bundleId).filter { it.isNotBlank() }.toSet()

    private val restTemplate = RestTemplate()
    private val keyCache = ConcurrentHashMap<String, PublicKey>()

    @Volatile
    private var lastKeyFetchTime = 0L
    private val keyTtlMs = 24 * 60 * 60 * 1000L // 24시간 캐시

    // ── 웹 리다이렉트 플로우 (Services ID + .p8) ──

    // 인가코드 → Apple 토큰 교환 → id_token 검증 → 유저 정보.
    // userJson 은 Apple 이 첫 로그인 form_post 시에만 보내는 이름 정보(JSON).
    fun exchangeCodeAndGetUserInfo(authCode: String, userJson: String?): SocialUserInfo {
        val idToken = exchangeCodeForIdToken(authCode)
        val info = verifyAndGetUserInfo(idToken)
        val name = parseAppleUserName(userJson)
        return if (name != null) info.copy(nickname = name) else info
    }

    // 인가코드를 Apple /auth/token 에 보내 id_token 을 받는다.
    private fun exchangeCodeForIdToken(authCode: String): String {
        val headers = HttpHeaders().apply { contentType = MediaType.APPLICATION_FORM_URLENCODED }
        val params = LinkedMultiValueMap<String, String>().apply {
            add("client_id", clientId)
            add("client_secret", generateClientSecret())
            add("grant_type", "authorization_code")
            add("code", authCode)
            add("redirect_uri", redirectUri)
        }
        val response = restTemplate.postForObject(
            "https://appleid.apple.com/auth/token",
            HttpEntity(params, headers),
            Map::class.java
        ) ?: throw RuntimeException("Apple 토큰 교환 실패")

        return response["id_token"] as? String
            ?: throw RuntimeException("Apple 응답에 id_token 이 없습니다")
    }

    // Apple client_secret = .p8(EC P-256)로 서명한 ES256 JWT. 매 요청마다 짧은 만료로 생성.
    private fun generateClientSecret(): String {
        val privateKey = loadPrivateKey()
        val now = Instant.now()
        return Jwts.builder()
            .header().keyId(keyId).and()
            .issuer(teamId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(5, ChronoUnit.MINUTES)))
            .audience().add("https://appleid.apple.com").and()
            .subject(clientId)
            .signWith(privateKey, Jwts.SIG.ES256)
            .compact()
    }

    private fun loadPrivateKey(): java.security.PrivateKey {
        require(privateKeyBase64.isNotBlank()) { "apple.private-key-base64 가 설정되지 않았습니다" }
        // env 값(base64) → PEM 텍스트 → DER → EC PrivateKey
        val pem = String(Base64.getDecoder().decode(privateKeyBase64))
        val der = Base64.getDecoder().decode(
            pem.replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("\\s".toRegex(), "")
        )
        return KeyFactory.getInstance("EC").generatePrivate(PKCS8EncodedKeySpec(der))
    }

    // Apple form_post 의 user 필드(JSON)에서 이름 추출. 첫 로그인 때만 존재.
    private fun parseAppleUserName(userJson: String?): String? {
        if (userJson.isNullOrBlank()) return null
        val first = Regex("\"firstName\"\\s*:\\s*\"([^\"]+)\"").find(userJson)?.groupValues?.get(1)
        val last = Regex("\"lastName\"\\s*:\\s*\"([^\"]+)\"").find(userJson)?.groupValues?.get(1)
        // 한국어 이름 순서(성+이름)로 결합
        return listOfNotNull(last, first).joinToString("").ifBlank { null }
    }

    // ── 네이티브 플로우 (ID 토큰 직접 검증) ──

    // Apple ID 토큰(JWT) 서명 검증 후 유저 정보 추출
    fun verifyAndGetUserInfo(idToken: String): SocialUserInfo {
        val publicKey = getApplePublicKey(idToken)

        val claims = Jwts.parser()
            .verifyWith(publicKey as java.security.interfaces.RSAPublicKey)
            .requireIssuer("https://appleid.apple.com")
            .build()
            .parseSignedClaims(idToken)
            .payload

        // aud 가 웹(Services ID) 또는 네이티브(번들 ID) 중 하나와 일치해야 함
        require(claims.audience?.any { it in allowedAudiences } == true) {
            "Apple ID 토큰 audience 불일치 (aud=${claims.audience})"
        }

        val sub = claims.subject
            ?: throw RuntimeException("Apple ID 토큰에서 sub을 찾을 수 없습니다")
        val email = claims["email"] as? String

        return SocialUserInfo(
            id = sub,
            nickname = email?.substringBefore("@") ?: "한입유저",
            profileImageUrl = null  // Apple은 프로필 이미지를 제공하지 않음
        )
    }

    // JWT 헤더의 kid로 Apple 공개키 조회
    private fun getApplePublicKey(idToken: String): PublicKey {
        val headerJson = String(Base64.getUrlDecoder().decode(idToken.split(".")[0]))
        val kid = Regex("\"kid\"\\s*:\\s*\"([^\"]+)\"").find(headerJson)?.groupValues?.get(1)
            ?: throw RuntimeException("Apple ID 토큰에서 kid를 찾을 수 없습니다")

        refreshKeysIfNeeded()

        return keyCache[kid]
            ?: run {
                // 캐시 미스 — 키가 로테이션됐을 수 있으므로 강제 갱신
                fetchAndCacheKeys()
                keyCache[kid] ?: throw RuntimeException("Apple 공개키를 찾을 수 없습니다 (kid=$kid)")
            }
    }

    private fun refreshKeysIfNeeded() {
        if (keyCache.isEmpty() || System.currentTimeMillis() - lastKeyFetchTime > keyTtlMs) {
            fetchAndCacheKeys()
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun fetchAndCacheKeys() {
        val response = restTemplate.getForObject(
            "https://appleid.apple.com/auth/keys",
            Map::class.java
        ) ?: throw RuntimeException("Apple 공개키 조회 실패")

        val keys = response["keys"] as? List<Map<String, Any>>
            ?: throw RuntimeException("Apple JWKS 파싱 실패")

        keyCache.clear()
        for (key in keys) {
            val kid = key["kid"] as String
            val n = key["n"] as String
            val e = key["e"] as String
            keyCache[kid] = buildRsaPublicKey(n, e)
        }
        lastKeyFetchTime = System.currentTimeMillis()
    }

    private fun buildRsaPublicKey(n: String, e: String): PublicKey {
        val modulus = BigInteger(1, Base64.getUrlDecoder().decode(n))
        val exponent = BigInteger(1, Base64.getUrlDecoder().decode(e))
        return KeyFactory.getInstance("RSA").generatePublic(RSAPublicKeySpec(modulus, exponent))
    }
}
