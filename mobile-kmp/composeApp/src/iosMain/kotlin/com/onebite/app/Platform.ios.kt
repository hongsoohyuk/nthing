package com.onebite.app

import platform.UIKit.UIDevice

// Platform.ios.kt - iOS 전용 구현
// Android의 Platform.android.kt와 쌍을 이루는 파일
// UIDevice는 iOS 네이티브 API - Kotlin/Native가 Objective-C/Swift API를 직접 호출 가능

actual fun getPlatformName(): String =
    "${UIDevice.currentDevice.systemName()} ${UIDevice.currentDevice.systemVersion}"
