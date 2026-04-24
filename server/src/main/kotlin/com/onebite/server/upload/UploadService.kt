package com.onebite.server.upload

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import software.amazon.awssdk.services.s3.presigner.S3Presigner
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest
import java.time.Duration
import java.util.UUID

@Service
class UploadService(
    private val s3Presigner: S3Presigner,
    @Value("\${aws.s3.bucket}") private val bucket: String,
    @Value("\${aws.s3.public-url-base:}") private val publicUrlBase: String,
    @Value("\${aws.s3.presign-expiry-seconds:300}") private val expirySeconds: Long,
    @Value("\${aws.region}") private val region: String,
) {
    fun presignForSplit(contentType: String, size: Long): PresignResponse {
        if (size > MAX_SIZE_BYTES) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "이미지는 최대 ${MAX_SIZE_BYTES / 1024 / 1024}MB 까지 업로드할 수 있습니다",
            )
        }
        val ext = EXT_BY_CONTENT_TYPE[contentType]
            ?: throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "지원하지 않는 이미지 타입입니다: $contentType",
            )

        val key = "splits/${UUID.randomUUID()}.$ext"

        val putObjectRequest = PutObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .contentType(contentType)
            .build()

        val presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(expirySeconds))
            .putObjectRequest(putObjectRequest)
            .build()

        val presignedRequest = s3Presigner.presignPutObject(presignRequest)

        val publicUrl =
            if (publicUrlBase.isNotBlank()) "${publicUrlBase.trimEnd('/')}/$key"
            else "https://$bucket.s3.$region.amazonaws.com/$key"

        return PresignResponse(
            uploadUrl = presignedRequest.url().toString(),
            publicUrl = publicUrl,
            key = key,
            expiresInSeconds = expirySeconds,
        )
    }

    companion object {
        private const val MAX_SIZE_BYTES = 5L * 1024 * 1024
        private val EXT_BY_CONTENT_TYPE = mapOf(
            "image/jpeg" to "jpg",
            "image/jpg" to "jpg",
            "image/png" to "png",
            "image/webp" to "webp",
        )
    }
}
