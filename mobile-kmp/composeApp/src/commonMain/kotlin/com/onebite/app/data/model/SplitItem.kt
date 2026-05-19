package com.onebite.app.data.model

import kotlinx.serialization.Serializable

// SplitItem.kt - 나눠사기 데이터 모델
//
// React/TypeScript 비교:
//   interface SplitItem {
//     id: number
//     productName: string
//     totalPrice: number
//     ...
//   }
//
// @Serializable = JSON 직렬화/역직렬화 지원
// TypeScript에서는 자동이지만, Kotlin에서는 이 어노테이션이 필요
// React에서 response.json()으로 받는 데이터의 타입 정의와 같은 역할

@Serializable
data class SplitItem(
    val id: Long,
    val productName: String,
    val totalPrice: Int,
    val totalQty: Int = 0,
    val splitCount: Int,
    val pricePerPerson: Int,
    val qtyPerPerson: Int = 0,
    val imageUrl: String? = null,      // ? = nullable (TypeScript의 string | null)
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val address: String = "",
    val status: String = "WAITING",
    val createdAt: String? = null,
    val author: Author? = null
)

@Serializable
data class Author(
    val id: Long,
    val nickname: String,
    val profileImageUrl: String? = null
)

@Serializable
data class PageResponse<T>(
    val content: List<T>,
    val page: Int = 0,
    val size: Int = 20,
    val totalElements: Long = 0,
    val totalPages: Int = 0,
    val hasNext: Boolean = false
)
