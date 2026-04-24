package com.onebite.server.upload

import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

data class PresignRequest(
    @field:NotBlank
    @field:Pattern(
        regexp = "^image/(jpeg|jpg|png|webp)$",
        message = "지원하지 않는 이미지 타입입니다 (image/jpeg, image/png, image/webp 만 허용)"
    )
    val contentType: String,

    @field:Min(1)
    val size: Long,
)

data class PresignResponse(
    val uploadUrl: String,
    val publicUrl: String,
    val key: String,
    val expiresInSeconds: Long,
)
