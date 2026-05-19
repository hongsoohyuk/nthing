package com.onebite.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Theme.kt - 앱 전체 디자인 테마 (React의 ThemeProvider + theme 객체)
//
// React 비교:
//   const theme = createTheme({
//     palette: { primary: { main: '#FF6B35' }, ... }
//   })
//   <ThemeProvider theme={theme}>...</ThemeProvider>

// 한입 브랜드 컬러
private val OneBiteOrange = Color(0xFFFF6B35)
private val OneBiteOrangeDark = Color(0xFFE55A2B)
private val OneBiteBackground = Color(0xFFFFFBFE)
private val OneBiteSurface = Color(0xFFFFFBFE)

// 라이트 모드 색상 (React의 theme 객체 palette와 동일한 개념)
private val LightColorScheme = lightColorScheme(
    primary = OneBiteOrange,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFDBCE),
    secondary = Color(0xFF77574B),
    background = OneBiteBackground,
    surface = OneBiteSurface,
)

// @Composable 함수로 테마를 감싸는 패턴
// React의 <ThemeProvider>와 동일
@Composable
fun OneBiteTheme(
    content: @Composable () -> Unit  // children prop과 같은 개념
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
