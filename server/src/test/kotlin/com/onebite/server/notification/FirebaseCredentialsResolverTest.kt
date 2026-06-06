package com.onebite.server.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.io.File
import java.util.Base64

class FirebaseCredentialsResolverTest {

    private val json = """{"type":"service_account","project_id":"n-thing"}"""

    @Test
    fun `base64 자격증명을 디코딩해 원본 JSON 스트림을 돌려준다`() {
        val base64 = Base64.getEncoder().encodeToString(json.toByteArray())

        val decoded = FirebaseCredentialsResolver.resolve(base64, "").use { it.readBytes().decodeToString() }

        assertEquals(json, decoded)
    }

    @Test
    fun `base64에 줄바꿈 공백이 섞여도 trim 후 디코딩한다`() {
        val base64 = "\n  " + Base64.getEncoder().encodeToString(json.toByteArray()) + "  \n"

        val decoded = FirebaseCredentialsResolver.resolve(base64, "").use { it.readBytes().decodeToString() }

        assertEquals(json, decoded)
    }

    @Test
    fun `base64와 path가 모두 있으면 base64를 우선한다`() {
        val base64 = Base64.getEncoder().encodeToString(json.toByteArray())

        val decoded = FirebaseCredentialsResolver.resolve(base64, "/nonexistent/path.json").use {
            it.readBytes().decodeToString()
        }

        assertEquals(json, decoded)
    }

    @Test
    fun `base64가 비어있으면 path 파일을 폴백으로 읽는다`() {
        val file = File.createTempFile("firebase-creds", ".json").apply { writeText(json); deleteOnExit() }

        val decoded = FirebaseCredentialsResolver.resolve("", file.absolutePath).use {
            it.readBytes().decodeToString()
        }

        assertEquals(json, decoded)
    }

    @Test
    fun `둘 다 비어있으면 예외를 던진다 (호출부는 빈 미생성으로 회피)`() {
        assertThrows(IllegalStateException::class.java) {
            FirebaseCredentialsResolver.resolve("", "")
        }
    }
}
