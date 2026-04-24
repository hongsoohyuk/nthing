package com.onebite.app.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.onebite.app.data.model.PageResponse
import com.onebite.app.data.model.SplitItem
import com.onebite.app.ui.component.EmptyContent
import com.onebite.app.ui.component.ErrorContent
import com.onebite.app.ui.component.LoadingContent
import com.onebite.app.ui.component.SplitCard
import kotlinx.coroutines.launch

private sealed interface SplitListUiState {
    data object Loading : SplitListUiState
    data class Success(val splits: List<SplitItem>) : SplitListUiState
    data class Error(val message: String) : SplitListUiState
    data object Empty : SplitListUiState
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SplitListScreen(
    title: String,
    emptyTitle: String,
    emptySubtitle: String,
    loader: suspend () -> PageResponse<SplitItem>,
    onBack: () -> Unit,
    onSplitClick: (Long) -> Unit,
) {
    var uiState by remember { mutableStateOf<SplitListUiState>(SplitListUiState.Loading) }
    val coroutineScope = rememberCoroutineScope()

    fun load() {
        coroutineScope.launch {
            uiState = SplitListUiState.Loading
            uiState = try {
                val page = loader()
                if (page.content.isEmpty()) SplitListUiState.Empty
                else SplitListUiState.Success(page.content)
            } catch (e: Exception) {
                SplitListUiState.Error(e.message ?: "목록을 불러올 수 없습니다")
            }
        }
    }

    LaunchedEffect(Unit) { load() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "뒤로가기")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            when (val state = uiState) {
                is SplitListUiState.Loading -> LoadingContent(message = "불러오는 중...")

                is SplitListUiState.Error -> ErrorContent(
                    message = state.message,
                    onRetry = { load() }
                )

                is SplitListUiState.Empty -> EmptyContent(
                    title = emptyTitle,
                    subtitle = emptySubtitle
                )

                is SplitListUiState.Success -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.splits, key = { it.id }) { split ->
                        SplitCard(split = split, onClick = { onSplitClick(split.id) })
                    }
                }
            }
        }
    }
}
