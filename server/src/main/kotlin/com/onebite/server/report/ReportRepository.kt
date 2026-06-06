package com.onebite.server.report

import org.springframework.data.jpa.repository.JpaRepository

interface ReportRepository : JpaRepository<Report, Long>

interface BlockRepository : JpaRepository<Block, Long> {
    fun findByBlockerId(blockerId: Long): List<Block>
    fun existsByBlockerIdAndBlockedId(blockerId: Long, blockedId: Long): Boolean
    fun deleteByBlockerIdAndBlockedId(blockerId: Long, blockedId: Long): Long
}
