import UIKit
import SwiftUI
import ComposeApp

// ContentView.swift - iOS 앱에서 Compose UI를 표시하는 SwiftUI 뷰
// Kotlin의 MainViewController()를 SwiftUI로 감싸는 브릿지 역할

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}

struct ContentView: View {
    var body: some View {
        ComposeView()
            .ignoresSafeArea(.all)
    }
}
