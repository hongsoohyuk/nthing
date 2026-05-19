// 루트 build.gradle.kts - 전체 프로젝트 빌드 설정
// React의 최상위 package.json과 비슷한 역할
// 여기서는 플러그인을 "선언만" 하고, 실제 적용은 각 모듈에서 함

plugins {
    alias(libs.plugins.kotlinMultiplatform) apply false
    alias(libs.plugins.kotlinSerialization) apply false
    alias(libs.plugins.composeMultiplatform) apply false
    alias(libs.plugins.composeCompiler) apply false
    alias(libs.plugins.androidApplication) apply false
}
