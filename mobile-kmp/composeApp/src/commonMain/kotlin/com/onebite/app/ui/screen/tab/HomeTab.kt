package com.onebite.app.ui.screen.tab

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.data.model.SplitItem
import com.onebite.app.ui.component.EmptyContent
import com.onebite.app.ui.component.ErrorContent
import com.onebite.app.ui.component.LoadingContent
import com.onebite.app.ui.component.SplitCard
import kotlinx.coroutines.launch

// HomeTab.kt - 홈 탭 (나눠사기 목록)
//
// React 비교:
//   function HomeTab({ onSplitClick }) {
//     const [state, setState] = useState({ loading: true })
//     const fetchData = async () => { ... }
//     useEffect(() => { fetchData() }, [])
//     if (state.loading) return <Spinner />
//     if (state.error) return <Error onRetry={fetchData} />
//     return <SplitList splits={state.data} />
//   }

private sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Success(val splits: List<SplitItem>) : HomeUiState
    data class Error(val message: String) : HomeUiState
    data object Empty : HomeUiState
}

@Composable
fun HomeTab(
    onSplitClick: (Long) -> Unit
) {
    var uiState by remember { mutableStateOf<HomeUiState>(HomeUiState.Loading) }
    val coroutineScope = rememberCoroutineScope()

    // 데이터 로드 함수 (초기 로드 & 새로고침 모두 사용)
    fun loadSplits() {
        coroutineScope.launch {
            uiState = HomeUiState.Loading
            uiState = try {
                val page = OneBiteApi.getSplits()
                if (page.content.isEmpty()) HomeUiState.Empty
                else HomeUiState.Success(page.content)
            } catch (e: Exception) {
                HomeUiState.Error(e.message ?: "목록을 불러올 수 없습니다")
            }
        }
    }

    // 최초 로드 (React의 useEffect(() => { ... }, []))
    LaunchedEffect(Unit) {
        uiState = try {
            val page = OneBiteApi.getSplits()
            if (page.content.isEmpty()) HomeUiState.Empty
            else HomeUiState.Success(page.content)
        } catch (e: Exception) {
            HomeUiState.Error(e.message ?: "목록을 불러올 수 없습니다")
        }
    }

    when (val state = uiState) {
        is HomeUiState.Loading -> LoadingContent(message = "나눠사기 목록 불러오는 중...")

        is HomeUiState.Error -> ErrorContent(
            message = state.message,
            onRetry = { loadSplits() }
        )

        is HomeUiState.Empty -> EmptyContent(
            title = "아직 나눠사기가 없어요",
            subtitle = "첫 번째 나눠사기를 등록해보세요!"
        )

        is HomeUiState.Success -> {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.splits, key = { it.id }) { split ->
                    SplitCard(
                        split = split,
                        onClick = { onSplitClick(split.id) }
                    )
                }
            }
        }
    }
}
