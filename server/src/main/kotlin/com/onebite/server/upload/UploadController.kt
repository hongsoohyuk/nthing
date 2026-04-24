package com.onebite.server.upload

import jakarta.validation.Valid
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/uploads")
class UploadController(
    private val uploadService: UploadService,
) {
    @PostMapping("/sign")
    fun sign(
        @Valid @RequestBody request: PresignRequest,
        authentication: Authentication,
    ): PresignResponse = uploadService.presignForSplit(request.contentType, request.size)
}
