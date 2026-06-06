package com.onebite.server.split

import com.onebite.server.user.UserRepository
import java.time.LocalDateTime
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import kotlin.math.*

@Service
class SplitService(
    private val splitRepository: SplitRepository,
    private val splitParticipantRepository: SplitParticipantRepository,
    private val userRepository: UserRepository,
    private val splitLocationQuery: SplitLocationQuery,
    private val eventPublisher: ApplicationEventPublisher,
) {
    @Transactional
    fun create(dto: CreateSplitDto, userId: Long): SplitResponse {
        val author = userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다: $userId") }
        val entity = SplitRequest(
            author = author,
            productName = dto.productName,
            totalPrice = dto.totalPrice,
            totalQty = dto.totalQty,
            splitCount = dto.splitCount,
            imageUrl = dto.imageUrl,
            latitude = dto.latitude,
            longitude = dto.longitude,
            address = dto.address,
        )
        val saved = splitRepository.save(entity)
        eventPublisher.publishEvent(SplitCreatedEvent(saved.id))
        return SplitResponse.from(saved)
    }

    fun findAll(pageable: Pageable): Page<SplitResponse> =
        splitRepository.findAll(pageable).map { toResponse(it) }

    fun findById(id: Long): SplitResponse {
        val entity = splitRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $id") }
        return toResponse(entity)
    }

    fun findByStatus(status: SplitStatus, pageable: Pageable): Page<SplitResponse> =
        splitRepository.findByStatus(status, pageable).map { toResponse(it) }

    fun findByAuthorId(userId: Long, pageable: Pageable): Page<SplitResponse> =
        splitRepository.findByAuthorId(userId, pageable).map { toResponse(it) }

    fun findByParticipantUserId(userId: Long, pageable: Pageable): Page<SplitResponse> =
        splitRepository.findByParticipantUserId(userId, pageable).map { toResponse(it) }

    fun findNearby(lat: Double, lng: Double, radiusKm: Double = 3.0, pageable: Pageable): Page<SplitResponse> {
        val page = splitLocationQuery.findNearby(lat, lng, radiusKm, pageable)
        val responses = page.content.map { entity ->
            val distance = haversineDistance(lat, lng, entity.latitude, entity.longitude)
            val participants = splitParticipantRepository.findBySplitRequestId(entity.id)
            SplitResponse.from(entity, participants, distance)
        }
        return PageImpl(responses, pageable, page.totalElements)
    }

    @Transactional
    fun join(splitId: Long, userId: Long): SplitResponse {
        val split = splitRepository.findById(splitId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $splitId") }

        if (split.status != SplitStatus.WAITING) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "WAITING 상태의 Split만 참여할 수 있습니다")
        }

        if (split.author.id == userId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "본인이 등록한 Split에는 참여할 수 없습니다")
        }

        if (splitParticipantRepository.existsBySplitRequestIdAndUserId(splitId, userId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 참여한 Split입니다")
        }

        val user = userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "유저를 찾을 수 없습니다: $userId") }

        splitParticipantRepository.save(SplitParticipant(splitRequest = split, user = user))

        val participantCount = splitParticipantRepository.countBySplitRequestId(splitId)
        var matched = false
        if (participantCount >= split.splitCount - 1) {
            split.status = SplitStatus.MATCHED
            splitRepository.save(split)
            matched = true
        }

        eventPublisher.publishEvent(SplitJoinedEvent(splitId, userId))
        if (matched) eventPublisher.publishEvent(SplitMatchedEvent(splitId))

        val participants = splitParticipantRepository.findBySplitRequestId(splitId)
        return SplitResponse.from(split, participants)
    }

    @Transactional
    fun cancel(id: Long, userId: Long): SplitResponse {
        val entity = splitRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $id") }

        if (entity.author.id != userId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 취소할 수 있습니다")
        }

        when (entity.status) {
            SplitStatus.WAITING -> {
                entity.status = SplitStatus.CANCELLED
            }
            SplitStatus.MATCHED -> {
                // 매칭 후 취소 = 악성. 주최자 lateCancel + 미처리 참여행 LATE_CANCELLED
                entity.status = SplitStatus.CANCELLED
                entity.author.lateCancelCount += 1
                splitParticipantRepository.findBySplitRequestId(id).forEach { row ->
                    if (row.outcome == ParticipantOutcome.JOINED) {
                        row.outcome = ParticipantOutcome.LATE_CANCELLED
                        splitParticipantRepository.save(row)
                    }
                }
            }
            else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 종료된 반띵입니다")
        }
        val saved = splitRepository.save(entity)
        eventPublisher.publishEvent(SplitCancelledEvent(id))
        val participants = splitParticipantRepository.findBySplitRequestId(id)
        return SplitResponse.from(saved, participants)
    }

    @Transactional
    fun leave(splitId: Long, userId: Long): SplitResponse {
        val split = splitRepository.findById(splitId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $splitId") }
        if (split.status != SplitStatus.MATCHED && split.status != SplitStatus.WAITING) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "진행 중인 반띵만 이탈할 수 있습니다")
        }
        val row = splitParticipantRepository.findBySplitRequestId(splitId)
            .firstOrNull { it.user.id == userId && it.outcome == ParticipantOutcome.JOINED }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "참여 중이 아닙니다")

        val wasMatched = split.status == SplitStatus.MATCHED
        row.outcome = ParticipantOutcome.LATE_CANCELLED
        if (wasMatched) {
            // 매칭 후 이탈만 페널티 (매칭 전 단순 참여취소는 무해)
            row.user.lateCancelCount += 1
            split.status = SplitStatus.WAITING   // 슬롯 재오픈
            splitRepository.save(split)
        }
        splitParticipantRepository.save(row)
        eventPublisher.publishEvent(SplitCancelledEvent(splitId))
        return SplitResponse.from(split, splitParticipantRepository.findBySplitRequestId(splitId))
    }

    @Transactional
    fun confirmComplete(splitId: Long, userId: Long): SplitResponse {
        val split = splitRepository.findById(splitId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $splitId") }
        if (split.status != SplitStatus.MATCHED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "매칭된 반띵만 거래완료할 수 있습니다")
        }
        val participants = splitParticipantRepository.findBySplitRequestId(splitId)
        val isAuthor = split.author.id == userId
        val isParticipant = participants.any { it.user.id == userId }
        if (!isAuthor && !isParticipant) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "참여자만 거래완료할 수 있습니다")
        }

        val now = LocalDateTime.now()
        val rows = if (isAuthor) participants else participants.filter { it.user.id == userId }
        for (row in rows) {
            if (row.outcome != ParticipantOutcome.JOINED) continue
            if (isAuthor) row.authorConfirmedAt = now else row.participantConfirmedAt = now
            if (row.authorConfirmedAt != null && row.participantConfirmedAt != null) {
                row.outcome = ParticipantOutcome.COMPLETED
                // 성사율은 '참여자↔주최자 쌍' 단위로 집계 — N명 split이면 주최자는 성사된 쌍마다 +1
                split.author.completedCount += 1
                row.user.completedCount += 1
            }
            splitParticipantRepository.save(row)
        }

        val all = splitParticipantRepository.findBySplitRequestId(splitId)
        if (all.isNotEmpty() && all.all { it.outcome == ParticipantOutcome.COMPLETED }) {
            split.status = SplitStatus.COMPLETED
            splitRepository.save(split)
            eventPublisher.publishEvent(SplitCompletedEvent(splitId))
        }
        return SplitResponse.from(split, all)
    }

    @Transactional
    fun reportBroken(splitId: Long, reporterId: Long, targetUserId: Long, reasonTag: String?): SplitResponse {
        val split = splitRepository.findById(splitId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $splitId") }
        if (split.status != SplitStatus.MATCHED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "매칭된 반띵만 신고할 수 있습니다")
        }
        val participants = splitParticipantRepository.findBySplitRequestId(splitId)
        val authorId = split.author.id
        val memberIds = participants.map { it.user.id }.toSet() + authorId
        if (reporterId !in memberIds || targetUserId !in memberIds) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "거래 당사자만 신고할 수 있습니다")
        }
        if (reporterId == targetUserId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "본인을 신고할 수 없습니다")
        }
        // 신고는 주최자-참여자 쌍 간에만 (정확히 한쪽이 author) — splitCount>=3에서 참여자끼리 오집계 방지
        val oneIsAuthor = (reporterId == authorId) xor (targetUserId == authorId)
        if (!oneIsAuthor) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "신고는 주최자-참여자 쌍 간에만 가능합니다")
        }
        val participantUserId = listOf(reporterId, targetUserId).first { it != authorId }
        val row = participants.firstOrNull { it.user.id == participantUserId }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 참여 기록이 없습니다")
        if (row.outcome != ParticipantOutcome.JOINED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 처리된 거래입니다")
        }

        val targetIsAuthor = targetUserId == authorId
        // 피신고자(=불이행 주장 대상)가 이미 "본인은 나왔다" 확인했으면 모순 → DISPUTED
        val targetAlreadyConfirmed =
            if (targetIsAuthor) row.authorConfirmedAt != null else row.participantConfirmedAt != null
        row.brokenReasonTag = reasonTag
        if (targetAlreadyConfirmed) {
            row.outcome = ParticipantOutcome.DISPUTED
        } else if (targetIsAuthor) {
            row.outcome = ParticipantOutcome.AUTHOR_BROKEN
            split.author.brokenCount += 1
        } else {
            row.outcome = ParticipantOutcome.PARTICIPANT_BROKEN
            row.user.brokenCount += 1
        }
        splitParticipantRepository.save(row)
        return SplitResponse.from(split, splitParticipantRepository.findBySplitRequestId(splitId))
    }

    private fun toResponse(entity: SplitRequest): SplitResponse {
        val participants = splitParticipantRepository.findBySplitRequestId(entity.id)
        return SplitResponse.from(entity, participants)
    }

    private fun haversineDistance(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
        val r = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLng = Math.toRadians(lng2 - lng1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLng / 2).pow(2)
        val c = 2 * asin(sqrt(a))
        return r * c
    }
}
