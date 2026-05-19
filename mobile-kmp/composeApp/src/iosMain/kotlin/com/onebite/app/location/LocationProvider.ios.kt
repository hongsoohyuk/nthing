package com.onebite.app.location

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.useContents
import kotlinx.coroutines.suspendCancellableCoroutine
import platform.CoreLocation.CLLocation
import platform.CoreLocation.CLLocationManager
import platform.CoreLocation.CLLocationManagerDelegateProtocol
import platform.CoreLocation.kCLAuthorizationStatusAuthorizedAlways
import platform.CoreLocation.kCLAuthorizationStatusAuthorizedWhenInUse
import platform.CoreLocation.kCLLocationAccuracyBest
import platform.Foundation.NSError
import platform.darwin.NSObject
import kotlin.coroutines.resume

actual object LocationProvider {
    private val locationManager = CLLocationManager()
    private var delegate: LocationDelegate? = null

    actual fun initialize(context: Any) {
        // iOS doesn't need activity context
    }

    actual fun hasPermission(): Boolean {
        val status = locationManager.authorizationStatus
        return status == kCLAuthorizationStatusAuthorizedWhenInUse ||
                status == kCLAuthorizationStatusAuthorizedAlways
    }

    actual suspend fun requestPermission(): Boolean {
        if (hasPermission()) return true
        return suspendCancellableCoroutine { cont ->
            var resumed = false
            delegate = LocationDelegate(
                onAuthChange = { granted ->
                    if (!resumed) {
                        resumed = true
                        cont.resume(granted)
                    }
                }
            )
            locationManager.delegate = delegate
            locationManager.requestWhenInUseAuthorization()
        }
    }

    actual suspend fun getCurrentLocation(): DeviceLocation? {
        if (!hasPermission()) return null
        return suspendCancellableCoroutine { cont ->
            var resumed = false
            delegate = LocationDelegate(
                onLocation = { location ->
                    if (!resumed) {
                        resumed = true
                        cont.resume(location)
                    }
                }
            )
            locationManager.delegate = delegate
            locationManager.desiredAccuracy = kCLLocationAccuracyBest
            locationManager.requestLocation()
        }
    }
}

@OptIn(ExperimentalForeignApi::class)
private class LocationDelegate(
    private val onAuthChange: ((Boolean) -> Unit)? = null,
    private val onLocation: ((DeviceLocation?) -> Unit)? = null
) : NSObject(), CLLocationManagerDelegateProtocol {

    override fun locationManager(
        manager: CLLocationManager,
        didUpdateLocations: List<*>
    ) {
        val clLocation = didUpdateLocations.lastOrNull() as? CLLocation
        val location = clLocation?.coordinate?.useContents {
            DeviceLocation(
                latitude = latitude,
                longitude = longitude
            )
        }
        onLocation?.invoke(location)
    }

    override fun locationManager(
        manager: CLLocationManager,
        didFailWithError: NSError
    ) {
        onLocation?.invoke(null)
    }

    override fun locationManagerDidChangeAuthorization(manager: CLLocationManager) {
        val status = manager.authorizationStatus
        val granted = status == kCLAuthorizationStatusAuthorizedWhenInUse ||
                status == kCLAuthorizationStatusAuthorizedAlways
        onAuthChange?.invoke(granted)
    }
}
