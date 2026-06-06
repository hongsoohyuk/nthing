package com.onebite.server.user

data class TrustProfileResponse(
    val userId: Long,
    val nickname: String,
    val profileImageUrl: String?,
    val isNewcomer: Boolean,    // 약속 < cold-start 임계치
    val successRate: Int?,      // 성사율(%), 신규면 null
    val promiseCount: Int,      // 성사+불이행+매칭후취소
    val completedCount: Int,
    val brokenCount: Int,
    val lateCancelCount: Int,
    val toneLabel: String       // UI 카피
)
