package com.onebite.app.ui.screen.tab

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.data.model.SplitItem
import com.onebite.app.location.DeviceLocation
import com.onebite.app.location.LocationProvider
import com.onebite.app.ui.component.EmptyContent
import com.onebite.app.ui.component.ErrorContent
import com.onebite.app.ui.component.LoadingContent
import com.onebite.app.ui.component.MapMarker
import com.onebite.app.ui.component.NativeMapView
import com.onebite.app.ui.component.formatPrice
import kotlinx.coroutines.launch

private sealed interface MapUiState {
    data object Loading : MapUiState
    data class Success(val splits: List<SplitItem>) : MapUiState
    data class Error(val message: String) : MapUiState
    data object Empty : MapUiState
}

// 서울시청 기본 좌표
private const val DEFAULT_LAT = 37.5666
private const val DEFAULT_LNG = 126.9780

@Composable
fun MapTab(
    onSplitClick: (Long) -> Unit = {}
) {
    var uiState by remember { mutableStateOf<MapUiState>(MapUiState.Loading) }
    var userLocation by remember { mutableStateOf<DeviceLocation?>(null) }
    var hasRequestedPermission by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    val centerLat = userLocation?.latitude ?: DEFAULT_LAT
    val centerLng = userLocation?.longitude ?: DEFAULT_LNG

    fun loadNearbySplits(lat: Double? = null, lng: Double? = null) {
        coroutineScope.launch {
            uiState = MapUiState.Loading
            uiState = try {
                val page = OneBiteApi.getSplits(
                    lat = lat,
                    lng = lng,
                    radiusKm = 3.0
                )
                if (page.content.isEmpty()) MapUiState.Empty
                else MapUiState.Success(page.content)
            } catch (e: Exception) {
                MapUiState.Error(e.message ?: "주변 나눠사기를 불러올 수 없습니다")
            }
        }
    }

    // 위치 권한 요청 + 현재 위치 가져오기 + 근처 목록 로드
    LaunchedEffect(Unit) {
        if (!hasRequestedPermission) {
            hasRequestedPermission = true
            val granted = LocationProvider.requestPermission()
            if (granted) {
                val location = LocationProvider.getCurrentLocation()
                userLocation = location
                loadNearbySplits(lat = location?.latitude, lng = location?.longitude)
            } else {
                loadNearbySplits()
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // 지도 영역
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
        ) {
            val markers = when (val state = uiState) {
                is MapUiState.Success -> state.splits.map { split ->
                    MapMarker(
                        id = split.id,
                        latitude = split.latitude,
                        longitude = split.longitude,
                        title = split.productName,
                        snippet = "${split.pricePerPerson.formatPrice()} · ${split.address}"
                    )
                }
                else -> emptyList()
            }

            NativeMapView(
                modifier = Modifier.fillMaxSize(),
                markers = markers,
                onMarkerClick = { id -> onSplitClick(id) },
                centerLatitude = centerLat,
                centerLongitude = centerLng,
                zoom = 15f
            )

            // 내 위치 버튼
            FloatingActionButton(
                onClick = {
                    coroutineScope.launch {
                        val location = LocationProvider.getCurrentLocation()
                        if (location != null) {
                            userLocation = location
                            loadNearbySplits(lat = location.latitude, lng = location.longitude)
                        }
                    }
                },
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(12.dp)
                    .size(40.dp),
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Icon(
                    Icons.Default.LocationOn,
                    contentDescription = "내 위치",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // 주변 나눠사기 목록
        Text(
            text = "주변 나눠사기",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        when (val state = uiState) {
            is MapUiState.Loading -> LoadingContent(message = "주변 검색 중...")

            is MapUiState.Error -> ErrorContent(
                message = state.message,
                onRetry = { loadNearbySplits(lat = userLocation?.latitude, lng = userLocation?.longitude) }
            )

            is MapUiState.Empty -> EmptyContent(
                title = "주변에 나눠사기가 없어요",
                subtitle = "위치를 변경하거나 나중에 다시 확인해보세요"
            )

            is MapUiState.Success -> {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.splits, key = { it.id }) { split ->
                        NearbyItem(
                            split = split,
                            onClick = { onSplitClick(split.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun NearbyItem(
    split: SplitItem,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.LocationOn,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = split.productName,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = split.address,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Text(
                text = split.pricePerPerson.formatPrice(),
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
