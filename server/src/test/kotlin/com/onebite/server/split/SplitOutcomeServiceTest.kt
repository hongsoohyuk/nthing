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
}
