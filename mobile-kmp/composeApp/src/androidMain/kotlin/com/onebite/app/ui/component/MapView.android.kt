package com.onebite.app.ui.component

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.KakaoMapReadyCallback
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.camera.CameraAnimation
import com.kakao.vectormap.camera.CameraUpdateFactory
import com.kakao.vectormap.label.LabelOptions
import com.kakao.vectormap.label.LabelStyle
import com.kakao.vectormap.label.LabelStyles
import com.onebite.app.R

@Composable
actual fun NativeMapView(
    modifier: Modifier,
    markers: List<MapMarker>,
    onMarkerClick: (Long) -> Unit,
    centerLatitude: Double,
    centerLongitude: Double,
    zoom: Float
) {
    var kakaoMap by remember { mutableStateOf<KakaoMap?>(null) }
    val lifecycleOwner = LocalLifecycleOwner.current

    val mapView = remember {
        MapView::class.java // placeholder, actual instance created in factory
    }
    var mapViewInstance by remember { mutableStateOf<MapView?>(null) }

    // Lifecycle 관리 (resume/pause)
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> mapViewInstance?.resume()
                Lifecycle.Event.ON_PAUSE -> mapViewInstance?.pause()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapViewInstance?.finish()
        }
    }

    // 마커 업데이트 (markers 변경 시만)
    LaunchedEffect(kakaoMap, markers) {
        val map = kakaoMap ?: return@LaunchedEffect
        updateMarkers(map, markers, onMarkerClick)
    }

    // 카메라 이동 (좌표 변경 시만)
    LaunchedEffect(kakaoMap, centerLatitude, centerLongitude) {
        val map = kakaoMap ?: return@LaunchedEffect
        val position = LatLng.from(centerLatitude, centerLongitude)
        val cameraUpdate = CameraUpdateFactory.newCenterPosition(position, zoom.toInt())
        map.moveCamera(cameraUpdate, CameraAnimation.from(500, true, true))
    }

    AndroidView(
        factory = { context ->
            MapView(context).also { view ->
                mapViewInstance = view
                view.start(
                    object : MapLifeCycleCallback() {
                        override fun onMapDestroy() {
                            kakaoMap = null
                        }

                        override fun onMapError(error: Exception) {
                            // 맵 로드 실패 (네트워크 오류, 앱 키 오류 등)
                        }
                    },
                    object : KakaoMapReadyCallback() {
                        override fun onMapReady(map: KakaoMap) {
                            kakaoMap = map

                            // 라벨 클릭 리스너 등록
                            map.setOnLabelClickListener { _, _, label ->
                                val markerId = (label.tag as? Long) ?: return@setOnLabelClickListener false
                                onMarkerClick(markerId)
                                true
                            }
                        }

                        override fun getPosition(): LatLng =
                            LatLng.from(centerLatitude, centerLongitude)

                        override fun getZoomLevel(): Int = zoom.toInt()
                    }
                )
            }
        },
        modifier = modifier
    )
}

private fun updateMarkers(map: KakaoMap, markers: List<MapMarker>, onMarkerClick: (Long) -> Unit) {
    val labelManager = map.labelManager ?: return
    val layer = labelManager.layer ?: return

    // 기존 라벨 제거
    layer.removeAll()

    if (markers.isEmpty()) return

    // 마커 스타일 생성
    val markerStyle = LabelStyles.from(
        LabelStyle.from(R.drawable.ic_map_marker)
    )

    // 새 마커 추가
    markers.forEach { marker ->
        val options = LabelOptions.from(
            "marker_${marker.id}",
            LatLng.from(marker.latitude, marker.longitude)
        )
            .setStyles(markerStyle)
            .setClickable(true)
            .setTag(marker.id)

        layer.addLabel(options)
    }
}
