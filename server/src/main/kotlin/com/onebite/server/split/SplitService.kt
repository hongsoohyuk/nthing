package com.onebite.server.split

import com.onebite.server.user.UserRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import kotlin.math.*

@Service
class SplitService(
    private val splitRepository: SplitRepository,
    private val splitParticipantRepository: SplitParticipantRepository,
    private val userRepository: UserRepository,
    private val splitLocationQuery: SplitLocationQuery
) {
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
            address = dto.address
        )
        return SplitResponse.from(splitRepository.save(entity))
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
        if (participantCount >= split.splitCount - 1) {
            split.status = SplitStatus.MATCHED
            splitRepository.save(split)
        }

        val participants = splitParticipantRepository.findBySplitRequestId(splitId)
        return SplitResponse.from(split, participants)
    }

    fun cancel(id: Long, userId: Long): SplitResponse {
        val entity = splitRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Split을 찾을 수 없습니다: $id") }

        if (entity.author.id != userId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 취소할 수 있습니다")
        }

        if (entity.status != SplitStatus.WAITING) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "WAITING 상태의 Split만 취소할 수 있습니다")
        }

        entity.status = SplitStatus.CANCELLED
        val saved = splitRepository.save(entity)
        val participants = splitParticipantRepository.findBySplitRequestId(id)
        return SplitResponse.from(saved, participants)
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
