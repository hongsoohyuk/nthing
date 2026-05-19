package com.onebite.app

import androidx.compose.ui.window.ComposeUIViewController

// MainViewController - iOS 앱에서 Compose UI를 표시하는 진입점
// Swift의 UIViewController를 Compose로 감싸는 어댑터 역할
// iOS의 SwiftUI에서 이 함수를 호출해서 Compose 화면을 표시함

fun MainViewController() = ComposeUIViewController { App() }
