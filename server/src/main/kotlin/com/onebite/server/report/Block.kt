package com.onebite.server.report

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "blocks",
    uniqueConstraints = [UniqueConstraint(name = "uk_block_pair", columnNames = ["blocker_id", "blocked_id"])],
    indexes = [Index(name = "idx_block_blocker", columnList = "blocker_id")]
)
class Block(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "blocker_id", nullable = false)
    val blockerId: Long,

    @Column(name = "blocked_id", nullable = false)
    val blockedId: Long,

    val createdAt: LocalDateTime = LocalDateTime.now(),
)
