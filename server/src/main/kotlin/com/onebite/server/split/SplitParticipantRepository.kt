package com.onebite.server.split

import org.springframework.data.jpa.repository.JpaRepository

interface SplitParticipantRepository : JpaRepository<SplitParticipant, Long> {
    fun findBySplitRequestId(splitRequestId: Long): List<SplitParticipant>
    fun existsBySplitRequestIdAndUserId(splitRequestId: Long, userId: Long): Boolean
    fun countBySplitRequestId(splitRequestId: Long): Long
    fun countBySplitRequestIdAndOutcome(splitRequestId: Long, outcome: ParticipantOutcome): Long
}
