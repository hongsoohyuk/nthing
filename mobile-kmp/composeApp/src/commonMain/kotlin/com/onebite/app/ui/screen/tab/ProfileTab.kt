package com.onebite.app.ui.screen.tab

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onebite.app.auth.AuthManager
import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.data.model.UserProfile
import com.onebite.app.ui.component.ErrorContent
import com.onebite.app.ui.component.LoadingContent
import kotlinx.coroutines.launch

private sealed interface ProfileUiState {
    data object Guest : ProfileUiState
    data object Loading : ProfileUiState
    data class Success(val profile: UserProfile) : ProfileUiState
    data class Error(val message: String) : ProfileUiState
}

@Composable
fun ProfileTab(
    onMySplits: () -> Unit = {},
    onParticipatedSplits: () -> Unit = {},
    onLogout: () -> Unit = {},
) {
    var uiState by remember {
        mutableStateOf<ProfileUiState>(
            if (AuthManager.isLoggedIn()) ProfileUiState.Loading else ProfileUiState.Guest
        )
    }
    val coroutineScope = rememberCoroutineScope()

    fun loadProfile() {
        coroutineScope.launch {
            uiState = ProfileUiState.Loading
            uiState = try {
                ProfileUiState.Success(OneBiteApi.getMyProfile())
            } catch (e: Exception) {
                ProfileUiState.Error(e.message ?: "프로필을 불러올 수 없습니다")
            }
        }
    }

    LaunchedEffect(Unit) {
        if (!AuthManager.isLoggedIn()) return@LaunchedEffect
        uiState = try {
            ProfileUiState.Success(OneBiteApi.getMyProfile())
        } catch (e: Exception) {
            ProfileUiState.Error(e.message ?: "프로필을 불러올 수 없습니다")
        }
    }

    when (val state = uiState) {
        is ProfileUiState.Guest -> GuestProfile(onLogin = onLogout)

        is ProfileUiState.Loading -> LoadingContent(message = "프로필 불러오는 중...")

        is ProfileUiState.Error -> ErrorContent(
            message = state.message,
            onRetry = { loadProfile() }
        )

        is ProfileUiState.Success -> {
            val profile = state.profile

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(32.dp))

                // 프로필 아바타
                Surface(
                    modifier = Modifier.size(80.dp),
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = profile.nickname.firstOrNull()?.toString() ?: "?",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = profile.nickname,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                profile.createdAt?.let { date ->
                    Text(
                        text = "가입일: $date",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                HorizontalDivider()

                Spacer(modifier = Modifier.height(16.dp))

                // 메뉴 항목들
                ProfileMenuItem(
                    title = "내 나눠사기",
                    subtitle = "등록한 상품 목록",
                    onClick = onMySplits,
                )
                ProfileMenuItem(
                    title = "참여한 나눠사기",
                    subtitle = "참여 요청한 상품 목록",
                    onClick = onParticipatedSplits,
                )
                ProfileMenuItem(
                    title = "설정",
                    subtitle = "알림, 위치, 계정 관리",
                    onClick = {},
                    enabled = false,
                )

                Spacer(modifier = Modifier.weight(1f))

                // 로그아웃 버튼
                OutlinedButton(
                    onClick = {
                        AuthManager.logout()
                        onLogout()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("로그아웃")
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun GuestProfile(onLogin: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "둘러보기 모드",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "프로필과 내 나눠사기를 보려면 로그인하세요.",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onLogin,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("로그인하기")
        }
    }
}

@Composable
private fun ProfileMenuItem(
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    enabled: Boolean = true,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        onClick = onClick,
        enabled = enabled,
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp)
        ) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium,
                color = if (enabled) MaterialTheme.colorScheme.onSurface
                else MaterialTheme.colorScheme.outline,
            )
            Text(
                text = subtitle,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
