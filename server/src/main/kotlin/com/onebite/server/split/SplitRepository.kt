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

    // 카테고리/키워드 검색 (위치 무관). 빈 문자열('')은 "필터 없음" 센티넬.
    // status/category 는 enum name 문자열로 비교, q 는 productName 부분일치(대소문자 무시).
    @Query(
        value = """
            SELECT * FROM split_requests s
            WHERE (:status = '' OR s.status = :status)
            AND (:category = '' OR s.category = :category)
            AND (:q = '' OR LOWER(s.product_name) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY s.created_at DESC
        """,
        countQuery = """
            SELECT COUNT(*) FROM split_requests s
            WHERE (:status = '' OR s.status = :status)
            AND (:category = '' OR s.category = :category)
            AND (:q = '' OR LOWER(s.product_name) LIKE LOWER(CONCAT('%', :q, '%')))
        """,
        nativeQuery = true
    )
    fun search(
        @Param("status") status: String,
        @Param("category") category: String,
        @Param("q") q: String,
        pageable: Pageable
    ): Page<SplitRequest>

    // 근처(WAITING) 조회 + 카테고리/키워드 필터. category/q 의 빈 문자열('')은 "필터 없음" 센티넬.
    @Query(
        value = """
            SELECT * FROM split_requests s
            WHERE (6371 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(s.latitude))
                * COS(RADIANS(s.longitude) - RADIANS(:lng))
                + SIN(RADIANS(:lat)) * SIN(RADIANS(s.latitude))
            )) <= :radiusKm
            AND s.status = 'WAITING'
            AND (:category = '' OR s.category = :category)
            AND (:q = '' OR LOWER(s.product_name) LIKE LOWER(CONCAT('%', :q, '%')))
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
            AND (:category = '' OR s.category = :category)
            AND (:q = '' OR LOWER(s.product_name) LIKE LOWER(CONCAT('%', :q, '%')))
        """,
        nativeQuery = true
    )
    fun findNearby(
        @Param("lat") lat: Double,
        @Param("lng") lng: Double,
        @Param("radiusKm") radiusKm: Double,
        @Param("category") category: String,
        @Param("q") q: String,
        pageable: Pageable
    ): Page<SplitRequest>
}
