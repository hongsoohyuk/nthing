package com.onebite.server.report

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
class ReportController(
    private val reportService: ReportService,
) {
    // POST /api/reports — 신고 생성
    @PostMapping("/reports")
    @ResponseStatus(HttpStatus.CREATED)
    fun report(@Valid @RequestBody req: CreateReportRequest, authentication: Authentication): ReportResponse {
        val userId = authentication.principal as Long
        return reportService.createReport(userId, req)
    }

    // POST /api/blocks — 유저 차단
    @PostMapping("/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    fun block(@Valid @RequestBody req: CreateBlockRequest, authentication: Authentication): BlockResponse {
        val userId = authentication.principal as Long
        return reportService.block(userId, req.userId)
    }

    // DELETE /api/blocks/{userId} — 차단 해제
    @DeleteMapping("/blocks/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun unblock(@PathVariable userId: Long, authentication: Authentication) {
        val blockerId = authentication.principal as Long
        reportService.unblock(blockerId, userId)
    }

    // GET /api/blocks — 내가 차단한 유저 id 목록
    @GetMapping("/blocks")
    fun blocks(authentication: Authentication): BlockedUsersResponse {
        val userId = authentication.principal as Long
        return reportService.blockedUserIds(userId)
    }
}
