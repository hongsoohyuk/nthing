package com.onebite.server.split

import com.onebite.server.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "split_participants",
    uniqueConstraints = [UniqueConstraint(columnNames = ["split_request_id", "user_id"])]
)
class SplitParticipant(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "split_request_id", nullable = false)
    val splitRequest: SplitRequest,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    val joinedAt: LocalDateTime = LocalDateTime.now(),

    @Enumerated(EnumType.STRING)
    var outcome: ParticipantOutcome = ParticipantOutcome.JOINED,

    var authorConfirmedAt: LocalDateTime? = null,
    var participantConfirmedAt: LocalDateTime? = null,
    var brokenReasonTag: String? = null,
)
