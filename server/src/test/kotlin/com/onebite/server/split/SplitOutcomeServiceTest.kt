package com.onebite.server.split

import com.onebite.server.user.AuthProvider
import com.onebite.server.user.User
import com.onebite.server.user.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.web.server.ResponseStatusException
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

@SpringBootTest
class SplitOutcomeServiceTest {
    @Autowired lateinit var splitService: SplitService
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var splitRepository: SplitRepository
    @Autowired lateinit var participantRepository: SplitParticipantRepository

    private lateinit var author: User
    private lateinit var joiner: User

    @BeforeEach
    fun setup() {
        participantRepository.deleteAll(); splitRepository.deleteAll(); userRepository.deleteAll()
        author = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "au${System.nanoTime()}", nickname = "작성자"))
        joiner = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "jo${System.nanoTime()}", nickname = "참여자"))
    }

    private fun dto() = CreateSplitDto("두쫀쿠", 20000, 4, 2, null, 37.5665, 126.9780, "서울")

    /** create + join → MATCHED 인 split의 id 반환 */
    private fun matchedSplit(): Long {
        val s = splitService.create(dto(), author.id)
        splitService.join(s.id, joiner.id)
        return s.id
    }

    @Test
    fun `양쪽 확인 시 성사 양쪽 completedCount 증가`() {
        val id = matchedSplit()
        splitService.confirmComplete(id, author.id)
        assertEquals(0, userRepository.findById(author.id).get().completedCount)
        assertEquals(SplitStatus.MATCHED, splitRepository.findById(id).get().status)

        splitService.confirmComplete(id, joiner.id)
        assertEquals(1, userRepository.findById(author.id).get().completedCount)
        assertEquals(1, userRepository.findById(joiner.id).get().completedCount)
        assertEquals(SplitStatus.COMPLETED, splitRepository.findById(id).get().status)
        assertEquals(ParticipantOutcome.COMPLETED, participantRepository.findBySplitRequestId(id).first().outcome)
    }

    @Test
    fun `WAITING 상태에서는 완료확인 불가`() {
        val s = splitService.create(dto(), author.id)
        assertFailsWith<ResponseStatusException> { splitService.confirmComplete(s.id, author.id) }
    }

    @Test
    fun `멤버가 아니면 완료확인 불가`() {
        val id = matchedSplit()
        val stranger = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "st${System.nanoTime()}", nickname = "외부인"))
        assertFailsWith<ResponseStatusException> { splitService.confirmComplete(id, stranger.id) }
    }

    @Test
    fun `참여자가 주최자 불이행 신고하면 주최자 brokenCount 증가`() {
        val id = matchedSplit()
        splitService.reportBroken(id, reporterId = joiner.id, targetUserId = author.id, reasonTag = "안나옴")
        assertEquals(1, userRepository.findById(author.id).get().brokenCount)
        val row = participantRepository.findBySplitRequestId(id).first()
        assertEquals(ParticipantOutcome.AUTHOR_BROKEN, row.outcome)
        assertEquals("안나옴", row.brokenReasonTag)
    }

    @Test
    fun `주최자가 참여자 불이행 신고하면 참여자 brokenCount 증가`() {
        val id = matchedSplit()
        splitService.reportBroken(id, reporterId = author.id, targetUserId = joiner.id, reasonTag = "연락두절")
        assertEquals(1, userRepository.findById(joiner.id).get().brokenCount)
        assertEquals(ParticipantOutcome.PARTICIPANT_BROKEN, participantRepository.findBySplitRequestId(id).first().outcome)
    }

    @Test
    fun `상대가 이미 완료확인했으면 불이행 신고는 DISPUTED 카운터 변화 없음`() {
        val id = matchedSplit()
        splitService.confirmComplete(id, author.id)  // 주최자는 본인이 나왔다고 확인
        splitService.reportBroken(id, reporterId = joiner.id, targetUserId = author.id, reasonTag = "안나옴")
        assertEquals(0, userRepository.findById(author.id).get().brokenCount)
        assertEquals(ParticipantOutcome.DISPUTED, participantRepository.findBySplitRequestId(id).first().outcome)
    }

    @Test
    fun `참여자끼리 신고는 거부`() {
        val s = splitService.create(CreateSplitDto("두쫀쿠", 30000, 6, 3, null, 37.5665, 126.9780, "서울"), author.id)
        val joiner2 = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "j2${System.nanoTime()}", nickname = "참여자2"))
        splitService.join(s.id, joiner.id)
        splitService.join(s.id, joiner2.id)   // splitCount 3 → 참여자 2명 → MATCHED
        assertFailsWith<ResponseStatusException> {
            splitService.reportBroken(s.id, reporterId = joiner.id, targetUserId = joiner2.id, reasonTag = "안나옴")
        }
    }

    @Test
    fun `매칭후 주최자 취소하면 lateCancel 증가 + 참여행 LATE_CANCELLED`() {
        val id = matchedSplit()
        splitService.cancel(id, author.id)
        assertEquals(1, userRepository.findById(author.id).get().lateCancelCount)
        assertEquals(SplitStatus.CANCELLED, splitRepository.findById(id).get().status)
        assertEquals(ParticipantOutcome.LATE_CANCELLED, participantRepository.findBySplitRequestId(id).first().outcome)
    }

    @Test
    fun `WAITING 주최자 취소는 lateCancel 없음`() {
        val s = splitService.create(dto(), author.id)
        splitService.cancel(s.id, author.id)
        assertEquals(0, userRepository.findById(author.id).get().lateCancelCount)
    }

    @Test
    fun `매칭후 참여자 이탈하면 본인 lateCancel + split WAITING 복귀`() {
        val id = matchedSplit()
        splitService.leave(id, joiner.id)
        assertEquals(1, userRepository.findById(joiner.id).get().lateCancelCount)
        assertEquals(SplitStatus.WAITING, splitRepository.findById(id).get().status)
        assertEquals(ParticipantOutcome.LATE_CANCELLED, participantRepository.findBySplitRequestId(id).first().outcome)
    }

    @Test
    fun `매칭전 참여자 이탈은 페널티 없음 WAITING 유지`() {
        val s = splitService.create(CreateSplitDto("두쫀쿠", 30000, 6, 3, null, 37.5665, 126.9780, "서울"), author.id)
        splitService.join(s.id, joiner.id)   // splitCount 3 → 참여자 1명 → 아직 WAITING
        splitService.leave(s.id, joiner.id)
        assertEquals(0, userRepository.findById(joiner.id).get().lateCancelCount)
        assertEquals(SplitStatus.WAITING, splitRepository.findById(s.id).get().status)
        assertEquals(ParticipantOutcome.LATE_CANCELLED, participantRepository.findBySplitRequestId(s.id).first().outcome)
    }

    @Test
    fun `이탈 후 새 참여자로 채우면 정상 완료된다`() {
        val s = splitService.create(dto(), author.id)
        splitService.join(s.id, joiner.id)            // MATCHED
        splitService.leave(s.id, joiner.id)           // WAITING 재오픈, joiner row LATE_CANCELLED
        val userC = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "uc${System.nanoTime()}", nickname = "유저C"))
        splitService.join(s.id, userC.id)             // 다시 MATCHED
        assertEquals(SplitStatus.MATCHED, splitRepository.findById(s.id).get().status)
        splitService.confirmComplete(s.id, author.id)
        val resp = splitService.confirmComplete(s.id, userC.id)
        assertEquals(SplitStatus.COMPLETED, splitRepository.findById(s.id).get().status)
        assertEquals(2, resp.currentParticipants)     // author + userC (이탈한 joiner 제외)
        assertEquals(1, userRepository.findById(author.id).get().completedCount)
        assertEquals(1, userRepository.findById(userC.id).get().completedCount)
        assertEquals(0, userRepository.findById(joiner.id).get().completedCount)
    }
}
