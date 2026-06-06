package com.onebite.server.split

import jakarta.persistence.EntityManager
import org.springframework.context.annotation.Profile
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Component

interface SplitLocationQuery {
    // category/q 의 빈 문자열('')은 "필터 없음" 센티넬.
    fun findNearby(
        lat: Double,
        lng: Double,
        radiusKm: Double,
        category: String,
        q: String,
        pageable: Pageable
    ): Page<SplitRequest>
}

@Component
@Profile("!prod")
class H2SplitLocationQuery(
    private val splitRepository: SplitRepository
) : SplitLocationQuery {
    override fun findNearby(
        lat: Double,
        lng: Double,
        radiusKm: Double,
        category: String,
        q: String,
        pageable: Pageable
    ): Page<SplitRequest> =
        splitRepository.findNearby(lat, lng, radiusKm, category, q, pageable)
}

@Component
@Profile("prod")
class PostgisSplitLocationQuery(
    private val entityManager: EntityManager
) : SplitLocationQuery {
    override fun findNearby(
        lat: Double,
        lng: Double,
        radiusKm: Double,
        category: String,
        q: String,
        pageable: Pageable
    ): Page<SplitRequest> {
        val radiusMeters = radiusKm * 1000

        // 빈 문자열 센티넬 → 필터 비활성. 키워드는 부분일치(대소문자 무시).
        val filterSql = """
            AND (:category = '' OR s.category = :category)
            AND (:q = '' OR LOWER(s.product_name) LIKE LOWER(CONCAT('%', :q, '%')))
        """

        val countSql = """
            SELECT COUNT(*) FROM split_requests s
            WHERE s.status = 'WAITING'
            AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
            $filterSql
        """
        val total = (entityManager.createNativeQuery(countSql)
            .setParameter("lat", lat)
            .setParameter("lng", lng)
            .setParameter("radius", radiusMeters)
            .setParameter("category", category)
            .setParameter("q", q)
            .singleResult as Number).toLong()

        val dataSql = """
            SELECT s.* FROM split_requests s
            WHERE s.status = 'WAITING'
            AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
            $filterSql
            ORDER BY ST_Distance(s.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) ASC
        """
        @Suppress("UNCHECKED_CAST")
        val results = entityManager.createNativeQuery(dataSql, SplitRequest::class.java)
            .setParameter("lat", lat)
            .setParameter("lng", lng)
            .setParameter("radius", radiusMeters)
            .setParameter("category", category)
            .setParameter("q", q)
            .setFirstResult(pageable.offset.toInt())
            .setMaxResults(pageable.pageSize)
            .resultList as List<SplitRequest>

        return PageImpl(results, pageable, total)
    }
}
