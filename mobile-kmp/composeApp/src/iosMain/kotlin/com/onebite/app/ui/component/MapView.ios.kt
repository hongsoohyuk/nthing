package com.onebite.app.ui.component

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import platform.CoreLocation.CLLocationCoordinate2DMake
import platform.MapKit.MKCoordinateRegionMake
import platform.MapKit.MKCoordinateSpanMake
import platform.MapKit.MKMapView
import platform.MapKit.MKMapViewDelegateProtocol
import platform.MapKit.MKPointAnnotation
import platform.darwin.NSObject

private class MapViewDelegate(
    private val markers: List<MapMarker>,
    private val onMarkerClick: (Long) -> Unit
) : NSObject(), MKMapViewDelegateProtocol {
    override fun mapView(mapView: MKMapView, didSelectAnnotation: platform.MapKit.MKAnnotationProtocol) {
        val annotation = didSelectAnnotation as? MKPointAnnotation ?: return
        val title = annotation.title ?: return
        val marker = markers.find { it.title == title }
        if (marker != null) {
            onMarkerClick(marker.id)
        }
        mapView.deselectAnnotation(annotation, animated = true)
    }
}

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun NativeMapView(
    modifier: Modifier,
    markers: List<MapMarker>,
    onMarkerClick: (Long) -> Unit,
    centerLatitude: Double,
    centerLongitude: Double,
    zoom: Float
) {
    val annotations = remember(markers) {
        markers.map { marker ->
            MKPointAnnotation().apply {
                setCoordinate(CLLocationCoordinate2DMake(marker.latitude, marker.longitude))
                setTitle(marker.title)
                setSubtitle(marker.snippet)
            }
        }
    }

    val delegate = remember(markers) { MapViewDelegate(markers, onMarkerClick) }

    UIKitView(
        factory = {
            MKMapView().apply {
                val span = MKCoordinateSpanMake(
                    0.01 * (20 - zoom),
                    0.01 * (20 - zoom)
                )
                val region = MKCoordinateRegionMake(
                    CLLocationCoordinate2DMake(centerLatitude, centerLongitude),
                    span
                )
                setRegion(region, animated = false)
                showsUserLocation = true
                setDelegate(delegate)
            }
        },
        update = { mapView ->
            // 카메라 위치 업데이트 (내 위치 버튼 클릭 시 반영)
            val span = MKCoordinateSpanMake(
                0.01 * (20 - zoom),
                0.01 * (20 - zoom)
            )
            val region = MKCoordinateRegionMake(
                CLLocationCoordinate2DMake(centerLatitude, centerLongitude),
                span
            )
            mapView.setRegion(region, animated = true)

            // 마커 업데이트
            mapView.removeAnnotations(mapView.annotations)
            annotations.forEach { mapView.addAnnotation(it) }
            mapView.setDelegate(delegate)
        },
        modifier = modifier
    )
}
