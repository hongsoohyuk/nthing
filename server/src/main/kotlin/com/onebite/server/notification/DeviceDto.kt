package com.onebite.server.notification

import jakarta.validation.constraints.NotBlank

data class RegisterDeviceRequest(
    @field:NotBlank val fcmToken: String,
    val platform: Platform,
    val lat: Double? = null,
    val lng: Double? = null,
    val nearbyAlertsEnabled: Boolean? = null,
)

data class UnregisterDeviceRequest(
    @field:NotBlank val fcmToken: String,
)

data class DeviceResponse(val id: Long)
