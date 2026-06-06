package com.onebite.server.split

enum class ParticipantOutcome {
    JOINED,             // 참여 확정, 만남 대기
    COMPLETED,          // 양방 완료확인 → 성사
    AUTHOR_BROKEN,      // 주최자가 약속 불이행 (참여자가 신고)
    PARTICIPANT_BROKEN, // 참여자가 약속 불이행 (주최자가 신고)
    LATE_CANCELLED,     // 매칭 후 취소
    DISPUTED            // 양방 주장 불일치 → 보류 (관리자 큐, 계획 2)
}
