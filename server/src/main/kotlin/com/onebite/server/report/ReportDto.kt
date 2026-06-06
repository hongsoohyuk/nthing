package com.onebite.server.report

import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size

// ── Request DTOs ──
data class CreateReportRequest(
    val targetType: ReportTargetType,

    @field:Positive
    val targetId: Long,

    val reason: ReportReason,

    @field:Size(max = 1000)
    val detail: String? = null,
)

data class CreateBlockRequest(
    @field:Positive
    val userId: Long,
)

// ── Response DTOs ──
data class ReportResponse(val id: Long)

data class BlockResponse(val id: Long, val blockedUserId: Long)

data class BlockedUsersResponse(val blockedUserIds: List<Long>)
