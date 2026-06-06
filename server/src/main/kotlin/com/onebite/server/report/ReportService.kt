package com.onebite.server.report

import com.onebite.server.split.SplitRepository
import com.onebite.server.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class ReportService(
    private val reportRepository: ReportRepository,
    private val blockRepository: BlockRepository,
    private val userRepository: UserRepository,
    private val splitRepository: SplitRepository,
) {
    @Transactional
    fun createReport(reporterId: Long, req: CreateReportRequest): ReportResponse {
        // 신고 대상 존재 검증
        when (req.targetType) {
            ReportTargetType.SPLIT ->
                if (!splitRepository.existsById(req.targetId))
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: ${req.targetId}")
            ReportTargetType.USER -> {
                if (!userRepository.existsById(req.targetId))
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다: ${req.targetId}")
                if (req.targetId == reporterId)
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "본인은 신고할 수 없습니다")
            }
        }

        val saved = reportRepository.save(
            Report(
                reporterId = reporterId,
                targetType = req.targetType,
                targetId = req.targetId,
                reason = req.reason,
                detail = req.detail?.takeIf { it.isNotBlank() },
            )
        )
        return ReportResponse(saved.id)
    }

    @Transactional
    fun block(blockerId: Long, blockedId: Long): BlockResponse {
        if (blockerId == blockedId)
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "본인은 차단할 수 없습니다")
        if (!userRepository.existsById(blockedId))
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다: $blockedId")

        val existing = blockRepository.findByBlockerId(blockerId).firstOrNull { it.blockedId == blockedId }
        if (existing != null) return BlockResponse(existing.id, blockedId)

        val saved = blockRepository.save(Block(blockerId = blockerId, blockedId = blockedId))
        return BlockResponse(saved.id, blockedId)
    }

    @Transactional
    fun unblock(blockerId: Long, blockedId: Long) {
        blockRepository.deleteByBlockerIdAndBlockedId(blockerId, blockedId)
    }

    @Transactional(readOnly = true)
    fun blockedUserIds(blockerId: Long): BlockedUsersResponse =
        BlockedUsersResponse(blockRepository.findByBlockerId(blockerId).map { it.blockedId })
}
