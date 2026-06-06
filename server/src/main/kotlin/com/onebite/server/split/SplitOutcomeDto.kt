package com.onebite.server.split

import jakarta.validation.constraints.NotNull

data class ReportBrokenDto(
    @field:NotNull
    val targetUserId: Long?,
    val reasonTag: String? = null,   // "안나옴" | "연락두절" (관리자 참고 + 카피용)
)
