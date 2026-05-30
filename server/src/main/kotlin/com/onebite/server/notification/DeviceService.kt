package com.onebite.server.notification

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class DeviceService(private val deviceRepository: DeviceRepository) {

    @Transactional
    fun upsert(userId: Long, req: RegisterDeviceRequest): DeviceResponse {
        val now = LocalDateTime.now()
        val existing = deviceRepository.findByFcmToken(req.fcmToken)
        val device = existing ?: Device(userId = userId, fcmToken = req.fcmToken, platform = req.platform)

        device.platform = req.platform
        device.updatedAt = now
        if (existing != null && existing.userId != userId) {
            // 같은 토큰이 다른 유저로 재사용된 경우(기기 양도 등) — 소유자 갱신은 필드 직접 대입 불가(val)이므로
            // 행을 교체한다. 간단히 삭제 후 신규 저장.
            deviceRepository.deleteByFcmToken(req.fcmToken)
            val replaced = Device(userId = userId, fcmToken = req.fcmToken, platform = req.platform)
            applyMutable(replaced, req, now)
            return DeviceResponse(deviceRepository.save(replaced).id)
        }
        applyMutable(device, req, now)
        return DeviceResponse(deviceRepository.save(device).id)
    }

    private fun applyMutable(device: Device, req: RegisterDeviceRequest, now: LocalDateTime) {
        if (req.lat != null && req.lng != null) {
            device.latitude = req.lat
            device.longitude = req.lng
            device.locationUpdatedAt = now
        }
        if (req.nearbyAlertsEnabled != null) device.nearbyAlertsEnabled = req.nearbyAlertsEnabled
        device.updatedAt = now
    }

    @Transactional
    fun unregister(fcmToken: String) {
        deviceRepository.deleteByFcmToken(fcmToken)
    }
}
