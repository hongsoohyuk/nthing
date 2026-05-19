package com.onebite.app.data.model

import kotlinx.serialization.Serializable

// SplitRequest.kt - 나눠사기 등록 요청 모델
// API 명세의 POST /splits 요청 body에 맞춤

@Serializable
data class CreateSplitRequest(
    val productName: String,
    val totalPrice: Int,
    val totalQty: Int,
    val splitCount: Int,
    val imageUrl: String? = null,
    val latitude: Double,
    val longitude: Double,
    val address: String
)
