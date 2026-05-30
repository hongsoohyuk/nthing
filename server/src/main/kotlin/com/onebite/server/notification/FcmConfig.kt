package com.onebite.server.notification

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.io.FileInputStream

@Configuration
class FcmConfig {
    @Bean
    @ConditionalOnProperty("firebase.credentials-path")
    fun firebaseApp(@Value("\${firebase.credentials-path}") path: String): FirebaseApp {
        val credentials = GoogleCredentials.fromStream(FileInputStream(path))
        val options = FirebaseOptions.builder().setCredentials(credentials).build()
        return if (FirebaseApp.getApps().isEmpty()) FirebaseApp.initializeApp(options) else FirebaseApp.getInstance()
    }

    @Bean
    @ConditionalOnProperty("firebase.credentials-path")
    fun firebaseFcmSender(firebaseApp: FirebaseApp): FcmSender = FirebaseFcmSender(firebaseApp)

    @Bean
    @ConditionalOnMissingBean(FcmSender::class)
    fun loggingFcmSender(): FcmSender = LoggingFcmSender()
}
