package com.onebite.app.location

import android.annotation.SuppressLint
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

actual object LocationProvider {
    private var activity: ComponentActivity? = null
    private var fusedClient: com.google.android.gms.location.FusedLocationProviderClient? = null
    private var permissionLauncher: ActivityResultLauncher<Array<String>>? = null
    private var permissionContinuation: kotlinx.coroutines.CancellableContinuation<Boolean>? = null

    actual fun initialize(context: Any) {
        val act = context as ComponentActivity
        activity = act
        fusedClient = LocationServices.getFusedLocationProviderClient(act)
        permissionLauncher = act.registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val granted = permissions.values.any { it }
            permissionContinuation?.resume(granted)
            permissionContinuation = null
        }
    }

    actual fun hasPermission(): Boolean {
        val ctx = activity ?: return false
        return ContextCompat.checkSelfPermission(
            ctx, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    actual suspend fun requestPermission(): Boolean {
        if (hasPermission()) return true
        return suspendCancellableCoroutine { cont ->
            permissionContinuation = cont
            permissionLauncher?.launch(
                arrayOf(
                    android.Manifest.permission.ACCESS_FINE_LOCATION,
                    android.Manifest.permission.ACCESS_COARSE_LOCATION
                )
            ) ?: cont.resume(false)
        }
    }

    @SuppressLint("MissingPermission")
    actual suspend fun getCurrentLocation(): DeviceLocation? {
        if (!hasPermission()) return null
        val client = fusedClient ?: return null
        return suspendCancellableCoroutine { cont ->
            client.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { location ->
                    cont.resume(
                        location?.let { DeviceLocation(it.latitude, it.longitude) }
                    )
                }
                .addOnFailureListener {
                    cont.resume(null)
                }
        }
    }
}
