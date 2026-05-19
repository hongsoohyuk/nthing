package com.onebite.app.ui.screen

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onebite.app.auth.AuthManager
import com.onebite.app.auth.AuthProvider
import com.onebite.app.auth.OAuthHandler
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "한입",
            fontSize = 48.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "벌크 상품, 같이 나눠요",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(48.dp))

        Text(
            text = "근처 사람과 묶음 상품을\n반씩 나눠 구매하세요",
            fontSize = 18.sp,
            textAlign = TextAlign.Center,
            lineHeight = 28.sp,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(48.dp))

        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(48.dp),
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        errorMessage?.let { msg ->
            Text(
                text = msg,
                color = MaterialTheme.colorScheme.error,
                fontSize = 13.sp,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        // 카카오 로그인 (카카오 디자인 가이드라인 준수)
        KakaoLoginButton(
            enabled = !isLoading && OAuthHandler.isAvailable(AuthProvider.KAKAO),
            onClick = {
                scope.launch {
                    isLoading = true
                    errorMessage = null
                    val result = AuthManager.login(AuthProvider.KAKAO)
                    isLoading = false
                    result.fold(
                        onSuccess = { onLoginSuccess() },
                        onFailure = { errorMessage = it.message }
                    )
                }
            }
        )

        Spacer(modifier = Modifier.height(10.dp))

        // 네이버 로그인 (네이버 브랜드 가이드라인 준수)
        NaverLoginButton(
            enabled = !isLoading && OAuthHandler.isAvailable(AuthProvider.NAVER),
            onClick = {
                scope.launch {
                    isLoading = true
                    errorMessage = null
                    val result = AuthManager.login(AuthProvider.NAVER)
                    isLoading = false
                    result.fold(
                        onSuccess = { onLoginSuccess() },
                        onFailure = { errorMessage = it.message }
                    )
                }
            }
        )

        Spacer(modifier = Modifier.height(10.dp))

        // 구글 로그인 (Google 브랜드 가이드라인 준수)
        GoogleLoginButton(
            enabled = !isLoading && OAuthHandler.isAvailable(AuthProvider.GOOGLE),
            onClick = {
                scope.launch {
                    isLoading = true
                    errorMessage = null
                    val result = AuthManager.login(AuthProvider.GOOGLE)
                    isLoading = false
                    result.fold(
                        onSuccess = { onLoginSuccess() },
                        onFailure = { errorMessage = it.message }
                    )
                }
            }
        )

        Spacer(modifier = Modifier.height(10.dp))

        // Apple 로그인
        SocialLoginButton(
            text = "Apple로 시작하기",
            containerColor = Color.Black,
            contentColor = Color.White,
            enabled = !isLoading && OAuthHandler.isAvailable(AuthProvider.APPLE),
            onClick = {
                scope.launch {
                    isLoading = true
                    errorMessage = null
                    val result = AuthManager.login(AuthProvider.APPLE)
                    isLoading = false
                    result.fold(
                        onSuccess = { onLoginSuccess() },
                        onFailure = { errorMessage = it.message }
                    )
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(
            onClick = { onLoginSuccess() },
            enabled = !isLoading
        ) {
            Text(
                text = "둘러보기",
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun SocialLoginButton(
    text: String,
    containerColor: Color,
    contentColor: Color,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor,
            disabledContainerColor = containerColor.copy(alpha = 0.4f),
            disabledContentColor = contentColor.copy(alpha = 0.4f)
        ),
        shape = MaterialTheme.shapes.medium
    ) {
        Text(
            text = text,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

/** Google 브랜드 가이드라인 준수 로그인 버튼 (Light 테마) */
@Composable
private fun GoogleLoginButton(
    enabled: Boolean,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        enabled = enabled,
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = Color.White,
            contentColor = Color(0xFF1F1F1F),
            disabledContainerColor = Color.White.copy(alpha = 0.4f),
            disabledContentColor = Color(0xFF1F1F1F).copy(alpha = 0.4f)
        ),
        border = BorderStroke(1.dp, Color(0xFF747775)),
        shape = MaterialTheme.shapes.medium
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            GoogleGLogo(modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Google 계정으로 로그인",
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

/** 카카오 디자인 가이드: 배경 #FEE500, 심볼 #000000, 레이블 #000000 85%, radius 12px */
@Composable
private fun KakaoLoginButton(
    enabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xFFFEE500),
            contentColor = Color(0xFF000000),
            disabledContainerColor = Color(0xFFFEE500).copy(alpha = 0.4f),
            disabledContentColor = Color(0xFF000000).copy(alpha = 0.4f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            KakaoLogo(modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "카카오 로그인",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF000000).copy(alpha = 0.85f)
            )
        }
    }
}

/** 네이버 브랜드 가이드: 배경 #03A94D, 로고/레이블 #FFFFFF, 로고-레이블 간격 8px */
@Composable
private fun NaverLoginButton(
    enabled: Boolean,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp),
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(
            containerColor = Color(0xFF03A94D),
            contentColor = Color.White,
            disabledContainerColor = Color(0xFF03A94D).copy(alpha = 0.4f),
            disabledContentColor = Color.White.copy(alpha = 0.4f)
        ),
        shape = MaterialTheme.shapes.medium
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            NaverNLogo(modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "네이버 로그인",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

/** 카카오 말풍선 심볼 (Canvas) */
@Composable
private fun KakaoLogo(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        // 말풍선 본체 (둥근 사각형)
        drawRoundRect(
            color = Color.Black,
            topLeft = Offset(0f, 0f),
            size = Size(w, h * 0.75f),
            cornerRadius = CornerRadius(w * 0.3f, h * 0.3f)
        )
        // 말풍선 꼬리 (삼각형)
        val tailPath = Path().apply {
            moveTo(w * 0.3f, h * 0.68f)
            lineTo(w * 0.2f, h)
            lineTo(w * 0.52f, h * 0.72f)
            close()
        }
        drawPath(path = tailPath, color = Color.Black)
    }
}

/** 네이버 N 로고 (Canvas) */
@Composable
private fun NaverNLogo(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val strokeW = w * 0.22f
        val nPath = Path().apply {
            // 왼쪽 세로 획
            moveTo(0f, h)
            lineTo(0f, 0f)
            lineTo(strokeW, 0f)
            // 대각선 획
            lineTo(w - strokeW, h * 0.65f)
            // 오른쪽 세로 획 (위로)
            lineTo(w - strokeW, 0f)
            lineTo(w, 0f)
            lineTo(w, h)
            lineTo(w - strokeW, h)
            // 대각선 복귀
            lineTo(strokeW, h * 0.35f)
            // 왼쪽 세로 아래
            lineTo(strokeW, h)
            close()
        }
        drawPath(path = nPath, color = Color.White)
    }
}

/** Google 'G' 멀티컬러 로고 (Canvas) */
@Composable
private fun GoogleGLogo(modifier: Modifier = Modifier) {
    val blue = Color(0xFF4285F4)
    val red = Color(0xFFEA4335)
    val yellow = Color(0xFFFBBC05)
    val green = Color(0xFF34A853)

    Canvas(modifier = modifier) {
        val strokeWidth = size.width * 0.22f
        val radius = (size.width - strokeWidth) / 2f
        val center = Offset(size.width / 2f, size.height / 2f)
        val arcStyle = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
        val arcTopLeft = Offset(center.x - radius, center.y - radius)
        val arcSize = Size(radius * 2f, radius * 2f)

        // Blue: 오른쪽 (315° ~ 45°, 즉 -45° ~ 45°)
        drawArc(color = blue, startAngle = -45f, sweepAngle = 90f, useCenter = false, topLeft = arcTopLeft, size = arcSize, style = arcStyle)
        // Green: 아래쪽 (45° ~ 135°)
        drawArc(color = green, startAngle = 45f, sweepAngle = 90f, useCenter = false, topLeft = arcTopLeft, size = arcSize, style = arcStyle)
        // Yellow: 왼쪽 (135° ~ 225°)
        drawArc(color = yellow, startAngle = 135f, sweepAngle = 90f, useCenter = false, topLeft = arcTopLeft, size = arcSize, style = arcStyle)
        // Red: 위쪽 (225° ~ 315°)
        drawArc(color = red, startAngle = 225f, sweepAngle = 90f, useCenter = false, topLeft = arcTopLeft, size = arcSize, style = arcStyle)

        // 파란색 가로 바 (G의 안쪽 수평선)
        val barHeight = strokeWidth
        val barLeft = center.x
        val barTop = center.y - barHeight / 2f
        drawRect(color = blue, topLeft = Offset(barLeft, barTop), size = Size(radius + strokeWidth / 2f, barHeight))
    }
}
