package com.onebite.app.ui.component

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

data class MapMarker(
    val id: Long,
    val latitude: Double,
    val longitude: Double,
    val title: String,
    val snippet: String
)

@Composable
expect fun NativeMapView(
    modifier: Modifier,
    markers: List<MapMarker>,
    onMarkerClick: (Long) -> Unit,
    centerLatitude: Double,
    centerLongitude: Double,
    zoom: Float
)
