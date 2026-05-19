import org.jetbrains.kotlin.gradle.ExperimentalKotlinGradlePluginApi
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.kotlinSerialization)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.androidApplication)
}

kotlin {
    androidTarget {
        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            // Compose UI
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.ui)
            implementation(compose.components.resources)

            // Navigation
            implementation(libs.navigation.compose)

            // ViewModel & Lifecycle
            implementation(libs.lifecycle.viewmodel.compose)
            implementation(libs.lifecycle.runtime.compose)

            // Ktor HTTP Client
            implementation(libs.ktor.client.core)
            implementation(libs.ktor.client.content.negotiation)
            implementation(libs.ktor.serialization.kotlinx.json)
            implementation(libs.ktor.client.logging)
            implementation(libs.ktor.client.auth)

            // Kotlinx
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.coroutines.core)
        }

        androidMain.dependencies {
            // Ktor Android engine
            implementation(libs.ktor.client.okhttp)

            // OAuth - Kakao SDK
            implementation(libs.kakao.user)

            // OAuth - Naver SDK
            implementation(libs.naver.oauth)

            // OAuth - Google Credential Manager
            implementation(libs.credentials)
            implementation(libs.credentials.play.services)
            implementation(libs.googleid)

            // Token 영속 저장 - EncryptedSharedPreferences
            implementation(libs.security.crypto)

            // Location - GPS
            implementation(libs.play.services.location)

            // Maps - Kakao Maps V2
            implementation(libs.kakao.maps)

            // Activity Compose - permission launcher
            implementation(libs.activity.compose)
        }

        iosMain.dependencies {
            // Ktor iOS engine
            implementation(libs.ktor.client.darwin)
        }
    }
}

// local.properties에서 API 키 읽기
val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) load(file.inputStream())
}

android {
    namespace = "com.onebite.app"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "com.onebite.app"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 1
        versionName = "0.1.0"

        // local.properties → BuildConfig
        buildConfigField("String", "KAKAO_NATIVE_APP_KEY", "\"${localProperties["KAKAO_NATIVE_APP_KEY"] ?: ""}\"")
        buildConfigField("String", "NAVER_CLIENT_ID", "\"${localProperties["NAVER_CLIENT_ID"] ?: ""}\"")
        buildConfigField("String", "GOOGLE_CLIENT_ID_ANDROID", "\"${localProperties["GOOGLE_CLIENT_ID_ANDROID"] ?: ""}\"")
        buildConfigField("String", "GOOGLE_CLIENT_ID_IOS", "\"${localProperties["GOOGLE_CLIENT_ID_IOS"] ?: ""}\"")

        // 카카오 로그인 redirect scheme
        manifestPlaceholders["KAKAO_NATIVE_APP_KEY"] = localProperties["KAKAO_NATIVE_APP_KEY"] ?: ""
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
