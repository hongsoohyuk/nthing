package com.onebite.app

// Platform.android.kt - Android 전용 구현
// expect/actual 패턴: TypeScript의 인터페이스 구현과 비슷
// commonMain에서 expect로 선언하고, 각 플랫폼에서 actual로 구현

actual fun getPlatformName(): String = "Android"
