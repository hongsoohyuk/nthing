package com.onebite.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PresignUploadRequest(
    val contentType: String,
    val size: Long,
)

@Serializable
data class PresignUploadResponse(
    val uploadUrl: String,
    val publicUrl: String,
    val key: String,
    val expiresInSeconds: Long,
)
