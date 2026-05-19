package com.onebite.app.ui.component

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// CommonUi.kt - 공통 UI 컴포넌트 (로딩, 에러, 빈 상태)

@Composable
fun LoadingContent(
    modifier: Modifier = Modifier,
    message: String = "불러오는 중..."
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun ErrorContent(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "오류가 발생했어요",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(4.dp))
            OutlinedButton(onClick = onRetry) {
                Text("다시 시도")
            }
        }
    }
}

@Composable
fun EmptyContent(
    title: String = "아직 내용이 없어요",
    subtitle: String = "",
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (subtitle.isNotEmpty()) {
                Text(
                    text = subtitle,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.outline,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

// 가격 포맷팅 유틸 (20000 → "20,000원")
fun Int.formatPrice(): String {
    val formatted = this.toString().reversed().chunked(3).joinToString(",").reversed()
    return "${formatted}원"
}
