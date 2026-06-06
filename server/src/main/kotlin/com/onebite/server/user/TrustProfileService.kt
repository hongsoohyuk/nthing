package com.onebite.server.user

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import kotlin.math.roundToInt

@Service
class TrustProfileService(
    private val userRepository: UserRepository,
    @Value("\${nthing.trust.cold-start-threshold:5}") private val coldStartThreshold: Int,
) {
    fun getProfile(userId: Long): TrustProfileResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다: $userId") }

        val promiseCount = user.completedCount + user.brokenCount + user.lateCancelCount
        // promiseCount == 0 → 데이터 없음 → 임계치 설정과 무관하게 신규 처리 (0 나눗셈 방지)
        val isNewcomer = promiseCount == 0 || promiseCount < coldStartThreshold
        val successRate = if (isNewcomer) null
            else (user.completedCount.toDouble() / promiseCount * 100).roundToInt()

        return TrustProfileResponse(
            userId = user.id,
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl,
            isNewcomer = isNewcomer,
            successRate = successRate,
            promiseCount = promiseCount,
            completedCount = user.completedCount,
            brokenCount = user.brokenCount,
            lateCancelCount = user.lateCancelCount,
            toneLabel = toneLabel(isNewcomer, successRate),
        )
    }

    private fun toneLabel(isNewcomer: Boolean, rate: Int?): String = when {
        isNewcomer -> "🌱 신규 · 아직 거래 기록이 적어요"
        rate!! >= 90 -> "약속을 잘 지켜요"
        rate >= 70 -> "약속을 잘 지키는 편이에요"
        else -> "최근 약속을 자주 못 지켰어요"
    }
}
