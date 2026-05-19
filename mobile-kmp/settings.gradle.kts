// settings.gradle.kts - 프로젝트 전체 설정
// React의 monorepo에서 workspaces를 정의하는 것과 비슷한 역할

rootProject.name = "onebite"

// 플러그인 저장소 설정 (npm registry처럼 라이브러리를 가져올 곳을 지정)
pluginManagement {
    repositories {
        google {
            // Android 관련 플러그인 (AGP 등)
            mavenContent {
                includeGroupByRegex(".*google.*")
                includeGroupByRegex(".*android.*")
            }
        }
        mavenCentral()     // Java/Kotlin 생태계의 npm registry
        gradlePluginPortal() // Gradle 전용 플러그인
    }
}

// 의존성 해결 저장소 (dependencies를 다운로드할 곳)
dependencyResolutionManagement {
    repositories {
        google {
            mavenContent {
                includeGroupByRegex(".*google.*")
                includeGroupByRegex(".*android.*")
            }
        }
        mavenCentral()
        // 카카오 SDK Maven 저장소
        maven { url = uri("https://devrepo.kakao.com/nexus/content/groups/public/") }
    }
}

// 모듈 포함 (React monorepo의 packages 목록과 비슷)
include(":composeApp")
