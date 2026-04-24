package com.onebite.server.split

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface SplitRepository : JpaRepository<SplitRequest, Long> {
    fun findByStatus(status: SplitStatus): List<SplitRequest>
    fun findByStatus(status: SplitStatus, pageable: Pageable): Page<SplitRequest>

    fun findByAuthorId(userId: Long): List<SplitRequest>
    fun findByAuthorId(userId: Long, pageable: Pageable): Page<SplitRequest>

    @Query(
        value = "SELECT p.splitRequest FROM SplitParticipant p WHERE p.user.id = :userId ORDER BY p.joinedAt DESC",
        countQuery = "SELECT COUNT(p) FROM SplitParticipant p WHERE p.user.id = :userId"
    )
    fun findByParticipantUserId(@Param("userId") userId: Long, pageable: Pageable): Page<SplitRequest>

    override fun findAll(pageable: Pageable): Page<SplitRequest>

    @Query(
        value = """
            SELECT * FROM split_requests s
            WHERE (6371 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(s.latitude))
                * COS(RADIANS(s.longitude) - RADIANS(:lng))
                + SIN(RADIANS(:lat)) * SIN(RADIANS(s.latitude))
            )) <= :radiusKm
            AND s.status = 'WAITING'
            ORDER BY (6371 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(s.latitude))
                * COS(RADIANS(s.longitude) - RADIANS(:lng))
                + SIN(RADIANS(:lat)) * SIN(RADIANS(s.latitude))
            )) ASC
        """,
        countQuery = """
            SELECT COUNT(*) FROM split_requests s
            WHERE (6371 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(s.latitude))
                * COS(RADIANS(s.longitude) - RADIANS(:lng))
                + SIN(RADIANS(:lat)) * SIN(RADIANS(s.latitude))
            )) <= :radiusKm
            AND s.status = 'WAITING'
        """,
        nativeQuery = true
    )
    fun findNearby(
        @Param("lat") lat: Double,
        @Param("lng") lng: Double,
        @Param("radiusKm") radiusKm: Double,
        pageable: Pageable
    ): Page<SplitRequest>
}
