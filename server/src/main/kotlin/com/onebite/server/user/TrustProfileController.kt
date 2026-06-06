package com.onebite.server.user

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/users")
class TrustProfileController(
    private val trustProfileService: TrustProfileService,
) {
    // 공개 신뢰 프로필 — 참여/수락 전 상대 확인용
    @GetMapping("/{id}/trust")
    fun getTrust(@PathVariable id: Long): TrustProfileResponse =
        trustProfileService.getProfile(id)
}
