package com.onebite.server.report

import jakarta.persistence.*
import java.time.LocalDateTime

enum class ReportTargetType {
    SPLIT, USER
}

enum class ReportReason {
    SPAM,             // 스팸/광고
    FRAUD,            // 사기 의심
    INAPPROPRIATE,    // 부적절한 콘텐츠
    HARASSMENT,       // 욕설/괴롭힘
    OTHER             // 기타 (detail 권장)
}

@Entity
@Table(
    name = "reports",
    indexes = [
        Index(name = "idx_report_reporter", columnList = "reporter_id"),
        Index(name = "idx_report_target", columnList = "target_type,target_id"),
    ]
)
class Report(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "reporter_id", nullable = false)
    val reporterId: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    val targetType: ReportTargetType,

    @Column(name = "target_id", nullable = false)
    val targetId: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val reason: ReportReason,

    @Column(length = 1000)
    val detail: String? = null,

    val createdAt: LocalDateTime = LocalDateTime.now(),
)
