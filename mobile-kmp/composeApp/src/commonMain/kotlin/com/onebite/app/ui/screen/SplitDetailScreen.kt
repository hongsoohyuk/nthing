package com.onebite.app.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.data.model.SplitItem
import com.onebite.app.ui.component.ErrorContent
import com.onebite.app.ui.component.LoadingContent
import com.onebite.app.ui.component.formatPrice
import kotlinx.coroutines.launch

// SplitDetailScreen.kt - 나눠사기 상세 화면
//
// React 비교:
//   function SplitDetailPage() {
//     const { id } = useParams()
//     const { data: split, isLoading, error } = useQuery(['split', id], () => fetchSplit(id))
//     const joinMutation = useMutation(() => joinSplit(id))
//     ...
//   }

private sealed interface DetailUiState {
    data object Loading : DetailUiState
    data class Success(val split: SplitItem) : DetailUiState
    data class Error(val message: String) : DetailUiState
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SplitDetailScreen(
    splitId: Long,
    onBack: () -> Unit
) {
    var uiState by remember { mutableStateOf<DetailUiState>(DetailUiState.Loading) }
    var isJoining by remember { mutableStateOf(false) }
    var isCancelling by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    fun loadSplit() {
        coroutineScope.launch {
            uiState = DetailUiState.Loading
            uiState = try {
                DetailUiState.Success(OneBiteApi.getSplit(splitId))
            } catch (e: Exception) {
                DetailUiState.Error(e.message ?: "상세 정보를 불러올 수 없습니다")
            }
        }
    }

    LaunchedEffect(splitId) {
        uiState = try {
            DetailUiState.Success(OneBiteApi.getSplit(splitId))
        } catch (e: Exception) {
            DetailUiState.Error(e.message ?: "상세 정보를 불러올 수 없습니다")
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("상세 정보") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "뒤로가기"
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is DetailUiState.Loading -> LoadingContent(message = "상세 정보 불러오는 중...")

                is DetailUiState.Error -> ErrorContent(
                    message = state.message,
                    onRetry = { loadSplit() }
                )

                is DetailUiState.Success -> {
                    val split = state.split
                    val isMyPost = split.author?.id == OneBiteApi.getCurrentUserId()

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp)
                    ) {
                        // 상품명
                        Text(
                            text = split.productName,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // 작성자 정보
                        split.author?.let { author ->
                            Text(
                                text = "등록자: ${author.nickname}",
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        // 상품 정보 카드
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                DetailRow(label = "전체 가격", value = split.totalPrice.formatPrice())
                                DetailRow(label = "전체 수량", value = "${split.totalQty}개")
                                DetailRow(label = "나눌 인원", value = "${split.splitCount}명")
                                DetailRow(
                                    label = "1인당 가격",
                                    value = split.pricePerPerson.formatPrice(),
                                    highlight = true
                                )
                                DetailRow(label = "1인당 수량", value = "${split.qtyPerPerson}개")
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // 위치 정보 카드
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                DetailRow(label = "위치", value = split.address)
                                split.createdAt?.let {
                                    DetailRow(label = "등록일", value = it)
                                }
                                DetailRow(
                                    label = "상태",
                                    value = when (split.status) {
                                        "WAITING" -> "대기중"
                                        "MATCHED" -> "매칭됨"
                                        "COMPLETED" -> "완료"
                                        "CANCELLED" -> "취소됨"
                                        else -> split.status
                                    }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.weight(1f))

                        // 참여/취소 버튼
                        if (isMyPost) {
                            // 작성자 본인 → 취소하기
                            OutlinedButton(
                                onClick = {
                                    coroutineScope.launch {
                                        isCancelling = true
                                        try {
                                            OneBiteApi.cancelSplit(splitId)
                                            snackbarHostState.showSnackbar("나눠사기가 취소되었습니다")
                                            onBack()
                                        } catch (e: Exception) {
                                            snackbarHostState.showSnackbar(
                                                e.message ?: "취소에 실패했습니다"
                                            )
                                        } finally {
                                            isCancelling = false
                                        }
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = MaterialTheme.shapes.medium,
                                enabled = !isCancelling && split.status == "WAITING",
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            ) {
                                if (isCancelling) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(20.dp),
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Text(
                                        text = "취소하기",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        } else {
                            // 다른 유저 → 참여하기
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        isJoining = true
                                        try {
                                            OneBiteApi.joinSplit(splitId)
                                            snackbarHostState.showSnackbar("참여 완료!")
                                            loadSplit() // 상태 갱신
                                        } catch (e: Exception) {
                                            snackbarHostState.showSnackbar(
                                                e.message ?: "참여에 실패했습니다"
                                            )
                                        } finally {
                                            isJoining = false
                                        }
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp),
                                shape = MaterialTheme.shapes.medium,
                                enabled = !isJoining && split.status == "WAITING"
                            ) {
                                if (isJoining) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(20.dp),
                                        strokeWidth = 2.dp,
                                        color = MaterialTheme.colorScheme.onPrimary
                                    )
                                } else {
                                    Text(
                                        text = "나눠사기 참여하기",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(
    label: String,
    value: String,
    highlight: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 14.sp
        )
        Text(
            text = value,
            fontWeight = if (highlight) FontWeight.Bold else FontWeight.Medium,
            fontSize = 14.sp,
            color = if (highlight) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.onSurface
        )
    }
}
