package com.onebite.server.notification

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.ByteArrayInputStream
import java.io.FileInputStream
import java.io.InputStream
import java.util.Base64

/**
 * Firebase Admin SDK 초기화.
 *
 * 자격증명(service-account JSON) 로딩 우선순위:
 *   1. FIREBASE_CREDENTIALS_BASE64 (firebase.credentials-base64)
 *      — base64로 인코딩된 service-account JSON. prod에서 secrets 볼륨 마운트 없이
 *        env(infra/.env → ONEBITE_ENV_B64)로 주입할 때 사용. **존재하면 우선.**
 *   2. FIREBASE_CREDENTIALS_PATH (firebase.credentials-path)
 *      — service-account JSON 파일 경로(폴백, 로컬/볼륨 마운트용).
 *
 * 둘 다 비어 있으면 이 빈들은 생성되지 않고(@ConditionalOnExpression) LoggingFcmSender가
 * 폴백으로 동작 → 푸시는 비활성화되지만 부팅은 실패하지 않는다(기존 동작 유지).
 *
 * 운영자용 base64 생성 명령:
 *   - macOS:  base64 -i server/secrets/firebase-adminsdk.json
 *   - Linux:  base64 -w0 server/secrets/firebase-adminsdk.json
 *   결과를 infra/.env 의 FIREBASE_CREDENTIALS_BASE64= 에 한 줄로 넣는다.
 */
@Configuration
class FcmConfig {

    @Bean
    @ConditionalOnExpression(CREDENTIALS_PRESENT)
    fun firebaseApp(
        @Value("\${firebase.credentials-base64:}") base64: String,
        @Value("\${firebase.credentials-path:}") path: String,
    ): FirebaseApp {
        val credentials = FirebaseCredentialsResolver.resolve(base64, path).use {
            GoogleCredentials.fromStream(it)
        }
        val options = FirebaseOptions.builder().setCredentials(credentials).build()
        return if (FirebaseApp.getApps().isEmpty()) FirebaseApp.initializeApp(options) else FirebaseApp.getInstance()
    }

    @Bean
    @ConditionalOnExpression(CREDENTIALS_PRESENT)
    fun firebaseFcmSender(firebaseApp: FirebaseApp): FcmSender = FirebaseFcmSender(firebaseApp)

    @Bean
    @ConditionalOnMissingBean(FcmSender::class)
    fun loggingFcmSender(): FcmSender = LoggingFcmSender()

    companion object {
        /** base64 또는 path 중 하나라도 비어있지 않으면 Firebase 활성화. */
        const val CREDENTIALS_PRESENT =
            "'\${firebase.credentials-base64:}' != '' or '\${firebase.credentials-path:}' != ''"
    }
}

/**
 * base64/path 자격증명을 InputStream으로 변환하는 순수 로직(단위 테스트 대상).
 * base64가 존재하면 우선, 없으면 파일 경로 폴백.
 */
internal object FirebaseCredentialsResolver {
    fun resolve(base64: String, path: String): InputStream = when {
        base64.isNotBlank() -> ByteArrayInputStream(Base64.getDecoder().decode(base64.trim()))
        path.isNotBlank() -> FileInputStream(path)
        else -> throw IllegalStateException(
            "No Firebase credentials configured (set FIREBASE_CREDENTIALS_BASE64 or FIREBASE_CREDENTIALS_PATH)"
        )
    }
}
