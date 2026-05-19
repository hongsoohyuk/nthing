package com.onebite.app.location

data class DeviceLocation(
    val latitude: Double,
    val longitude: Double
)

expect object LocationProvider {
    fun initialize(context: Any)
    fun hasPermission(): Boolean
    suspend fun requestPermission(): Boolean
    suspend fun getCurrentLocation(): DeviceLocation?
}
