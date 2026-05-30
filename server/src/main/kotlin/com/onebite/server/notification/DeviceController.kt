package com.onebite.server.notification

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/devices")
class DeviceController(private val deviceService: DeviceService) {

    @PostMapping
    fun register(@Valid @RequestBody req: RegisterDeviceRequest, authentication: Authentication): DeviceResponse {
        val userId = authentication.principal as Long
        return deviceService.upsert(userId, req)
    }

    @PostMapping("/unregister")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unregister(@Valid @RequestBody req: UnregisterDeviceRequest) {
        deviceService.unregister(req.fcmToken)
    }
}
