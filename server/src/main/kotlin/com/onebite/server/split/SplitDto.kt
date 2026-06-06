package com.onebite.server.split

import com.onebite.server.user.User
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.springframework.data.domain.Page

// ── Request DTO: 클라이언트가 보내는 데이터 ──
data class CreateSplitDto(
    @field:NotBlank
    val productName: String,

    @field:Min(1)
    val totalPrice: Int,

    @field:Min(1)
    val totalQty: Int,

    @field:Min(2)
    val splitCount: Int,

    val imageUrl: String? = null,
    val latitude: Double,
    val longitude: Double,
    val address: String,

    val category: SplitCategory = SplitCategory.OTHER
)

// ── Author DTO: 작성자 정보 ──
data class AuthorDto(
    val id: Long,
    val nickname: String,
    val profileImageUrl: String?
) {
    companion object {
        fun from(user: User) = AuthorDto(
            id = user.id,
            nickname = user.nickname,
            profileImageUrl = user.profileImageUrl
        )
    }
}

// ── Participant DTO: 참여자 정보 ──
data class ParticipantDto(
    val userId: Long,
    val nickname: String,
    val profileImageUrl: String?,
    val joinedAt: String
)

// ── Response DTO: 클라이언트에 보내는 데이터 ──
data class SplitResponse(
    val id: Long,
    val productName: String,
    val totalPrice: Int,
    val totalQty: Int,
    val splitCount: Int,
    val pricePerPerson: Int,
    val qtyPerPerson: Int,
    val imageUrl: String?,
    val latitude: Double,
    val longitude: Double,
    val address: String,
    val status: SplitStatus,
    val category: SplitCategory,
    val author: AuthorDto,
    val createdAt: String,
    val participants: List<ParticipantDto> = emptyList(),
    val currentParticipants: Int = 1,
    val distanceKm: Double? = null
) {
    companion object {
        fun from(
            entity: SplitRequest,
            participants: List<SplitParticipant> = emptyList(),
            distanceKm: Double? = null
        ) = SplitResponse(
            id = entity.id,
            productName = entity.productName,
            totalPrice = entity.totalPrice,
            totalQty = entity.totalQty,
            splitCount = entity.splitCount,
            pricePerPerson = entity.totalPrice / entity.splitCount,
            qtyPerPerson = entity.totalQty / entity.splitCount,
            imageUrl = entity.imageUrl,
            latitude = entity.latitude,
            longitude = entity.longitude,
            address = entity.address,
            status = entity.status,
            category = entity.category,
            author = AuthorDto.from(entity.author),
            createdAt = entity.createdAt.toString(),
            participants = participants.map {
                ParticipantDto(
                    userId = it.user.id,
                    nickname = it.user.nickname,
                    profileImageUrl = it.user.profileImageUrl,
                    joinedAt = it.joinedAt.toString()
                )
            },
            currentParticipants = participants.size + 1,
            distanceKm = distanceKm?.let { Math.round(it * 100) / 100.0 }
        )
    }
}

// ── 페이지네이션 응답 ──
data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val hasNext: Boolean
) {
    companion object {
        fun <T> from(page: Page<T>) = PageResponse(
            content = page.content,
            page = page.number,
            size = page.size,
            totalElements = page.totalElements,
            totalPages = page.totalPages,
            hasNext = page.hasNext()
        )
    }
}
