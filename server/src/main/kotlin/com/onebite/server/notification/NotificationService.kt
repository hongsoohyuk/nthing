package com.onebite.server.notification

import com.onebite.server.split.SplitParticipantRepository
import com.onebite.server.split.SplitRepository
import com.onebite.server.user.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import kotlin.math.*

@Service
class NotificationService(
    private val deviceRepository: DeviceRepository,
    private val notificationRepository: NotificationRepository,
    private val deviceLocationQuery: DeviceLocationQuery,
    private val fcmSender: FcmSender,
    private val splitRepository: SplitRepository,
    private val splitParticipantRepository: SplitParticipantRepository,
    private val userRepository: UserRepository,
    @Value("\${push.nearby.radius-km:3.0}") private val radiusKm: Double,
    @Value("\${push.nearby.active-window-days:14}") private val activeWindowDays: Long,
    @Value("\${push.nearby.daily-cap:10}") private val dailyCap: Int,
) {
    @Transactional
    fun notifyNearbyNewSplit(splitId: Long) {
        val split = splitRepository.findById(splitId).orElse(null) ?: return
        val activeAfter = LocalDateTime.now().minusDays(activeWindowDays)
        val devices = deviceLocationQuery.findActiveNearbyExcludingUser(
            split.latitude, split.longitude, radiusKm, split.author.id, activeAfter,
        )
        if (devices.isEmpty()) return
        val authorNick = split.author.nickname
        val startOfDay = LocalDate.now().atStartOfDay()
        val targets = devices
            .filter { d -> notificationRepository.countByUserIdAndTypeAndCreatedAtAfter(d.userId, NotificationType.NEARBY_NEW_SPLIT, startOfDay) < dailyCap }
            .map { d ->
                val meters = distanceMeters(d.latitude!!, d.longitude!!, split.latitude, split.longitude)
                d to PushMessage(
                    NotificationType.NEARBY_NEW_SPLIT,
                    "근처에 새 반띵이 떴어요",
                    "${authorNick}님이 ${meters}m 근처에서 ${split.productName} ${split.totalQty}개를 반띵하길 원해요",
                    split.id,
                )
            }
        sendToTargets(targets)
    }

    @Transactional
    fun notifySplitJoined(splitId: Long, joinerUserId: Long) {
        val split = splitRepository.findById(splitId).orElse(null) ?: return
        val joiner = userRepository.findById(joinerUserId).orElse(null) ?: return
        val msg = PushMessage(NotificationType.SPLIT_JOINED, "반띵 참여 알림",
            "${joiner.nickname}님이 회원님의 ${split.productName} 반띵에 참여했어요", split.id)
        sendToUsers(listOf(split.author.id), msg)
    }

    @Transactional
    fun notifySplitMatched(splitId: Long) {
        val split = splitRepository.findById(splitId).orElse(null) ?: return
        val participants = splitParticipantRepository.findBySplitRequestId(splitId).map { it.user.id }
        val msg = PushMessage(NotificationType.SPLIT_MATCHED, "반띵 매칭 완료 🎉",
            "${split.productName} 반띵이 성사됐어요. 만나서 나눠요!", split.id)
        sendToUsers(listOf(split.author.id) + participants, msg)
    }

    @Transactional
    fun notifySplitCancelled(splitId: Long) {
        val split = splitRepository.findById(splitId).orElse(null) ?: return
        val participants = splitParticipantRepository.findBySplitRequestId(splitId).map { it.user.id }
        val msg = PushMessage(NotificationType.SPLIT_CANCELLED, "반띵 취소",
            "${split.productName} 반띵이 취소됐어요", split.id)
        sendToUsers(participants, msg)
    }

    private fun sendToUsers(userIds: List<Long>, message: PushMessage) {
        val devices = userIds.distinct().flatMap { deviceRepository.findByUserId(it) }
        sendToTargets(devices.map { it to message })
    }

    private fun sendToTargets(targets: List<Pair<Device, PushMessage>>) {
        if (targets.isEmpty()) return
        val outcomes = fcmSender.send(targets.map { (d, m) -> PushTarget(d.fcmToken, m) })
        targets.forEachIndexed { i, (d, m) ->
            val outcome = outcomes[i]
            notificationRepository.save(Notification(
                userId = d.userId, type = m.type, title = m.title, body = m.body, splitId = m.splitId,
                status = if (outcome == SendOutcome.SUCCESS) NotificationStatus.SENT else NotificationStatus.FAILED,
            ))
            if (outcome == SendOutcome.INVALID_TOKEN) deviceRepository.deleteByFcmToken(d.fcmToken)
        }
    }

    private fun distanceMeters(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Int {
        val r = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLng = Math.toRadians(lng2 - lng1)
        val a = sin(dLat / 2).pow(2) + cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLng / 2).pow(2)
        return (r * 2 * asin(sqrt(a))).roundToInt()
    }
}
