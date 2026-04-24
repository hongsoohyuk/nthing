package com.onebite.server.split

import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/splits")
class SplitController(
    private val splitService: SplitService
) {
    // GET /api/splits?page=0&size=20&lat=37.5&lng=126.9&radiusKm=3&status=WAITING
    @GetMapping
    fun getAll(
        @RequestParam status: SplitStatus? = null,
        @RequestParam lat: Double? = null,
        @RequestParam lng: Double? = null,
        @RequestParam radiusKm: Double? = null,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): PageResponse<SplitResponse> {
        val pageable = PageRequest.of(page, size)
        val result = if (lat != null && lng != null)
            splitService.findNearby(lat, lng, radiusKm ?: 3.0, pageable)
        else if (status != null)
            splitService.findByStatus(status, pageable)
        else
            splitService.findAll(pageable)
        return PageResponse.from(result)
    }

    // GET /api/splits/{id}
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): SplitResponse =
        splitService.findById(id)

    // POST /api/splits
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody dto: CreateSplitDto, authentication: Authentication): SplitResponse {
        val userId = authentication.principal as Long
        return splitService.create(dto, userId)
    }

    // GET /api/splits/my?page=0&size=20  (내가 등록한 나눠사기)
    @GetMapping("/my")
    fun getMy(
        authentication: Authentication,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): PageResponse<SplitResponse> {
        val userId = authentication.principal as Long
        val pageable = PageRequest.of(page, size)
        return PageResponse.from(splitService.findByAuthorId(userId, pageable))
    }

    // GET /api/splits/participated?page=0&size=20  (내가 참여한 나눠사기)
    @GetMapping("/participated")
    fun getParticipated(
        authentication: Authentication,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): PageResponse<SplitResponse> {
        val userId = authentication.principal as Long
        val pageable = PageRequest.of(page, size)
        return PageResponse.from(splitService.findByParticipantUserId(userId, pageable))
    }

    // POST /api/splits/{id}/join
    @PostMapping("/{id}/join")
    fun join(@PathVariable id: Long, authentication: Authentication): SplitResponse {
        val userId = authentication.principal as Long
        return splitService.join(id, userId)
    }

    // PATCH /api/splits/{id}/cancel
    @PatchMapping("/{id}/cancel")
    fun cancel(@PathVariable id: Long, authentication: Authentication): SplitResponse {
        val userId = authentication.principal as Long
        return splitService.cancel(id, userId)
    }
}
