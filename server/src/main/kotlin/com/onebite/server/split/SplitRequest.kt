package com.onebite.server.split

import com.onebite.server.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

// ── Entity: DB 테이블과 매핑 (Prisma의 model과 같은 역할) ──
@Entity
@Table(name = "split_requests")
class SplitRequest(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    val author: User,

    val productName: String,
    val totalPrice: Int,
    val totalQty: Int,
    val splitCount: Int,
    val imageUrl: String? = null,

    // 위치 정보
    val latitude: Double,
    val longitude: Double,
    val address: String,

    @Enumerated(EnumType.STRING)
    var status: SplitStatus = SplitStatus.WAITING,

    @Enumerated(EnumType.STRING)
    val category: SplitCategory = SplitCategory.OTHER,

    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class SplitStatus {
    WAITING,     // 나눌 사람 대기중
    MATCHED,     // 매칭됨
    COMPLETED,   // 거래 완료
    CANCELLED    // 취소
}

// 상품 카테고리 (한국 커머스 기준). 기본값 OTHER.
enum class SplitCategory {
    FOOD,        // 식품 (두쫀쿠, 과자, 냉동식품 등)
    BEVERAGE,    // 음료 (원두, 생수, 음료 묶음 등)
    HOUSEHOLD,   // 생활용품 (휴지, 세제, 주방용품 등)
    BEAUTY,      // 뷰티 (화장품, 위생용품 등)
    OTHER        // 기타
}
