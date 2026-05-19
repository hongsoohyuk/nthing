package com.onebite.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.onebite.app.ui.navigation.AppNavigation
import com.onebite.app.ui.theme.OneBiteTheme

// App.kt - 앱의 최상위 컴포저블 (React의 App.tsx와 동일한 역할)
//
// React 비교:
//   function App() {
//     return (
//       <ThemeProvider theme={theme}>
//         <BrowserRouter>
//           <AppRoutes />
//         </BrowserRouter>
//       </ThemeProvider>
//     )
//   }
//
// @Composable = React의 함수 컴포넌트 선언과 같은 의미
// Compose에서는 이 어노테이션이 있어야 UI를 그릴 수 있음

@Composable
fun App() {
    // OneBiteTheme = ThemeProvider (색상, 폰트 등 전역 디자인 토큰)
    OneBiteTheme {
        // Surface = 배경색이 적용된 최상위 컨테이너 (<div className="app"> 같은 것)
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            // AppNavigation = <BrowserRouter> + <Routes> 역할
            AppNavigation()
        }
    }
}
