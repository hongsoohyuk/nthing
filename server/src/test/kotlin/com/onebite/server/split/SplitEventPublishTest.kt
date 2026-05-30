package com.onebite.server.split

import com.onebite.server.user.AuthProvider
import com.onebite.server.user.User
import com.onebite.server.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.event.ApplicationEvents
import org.springframework.test.context.event.RecordApplicationEvents

@SpringBootTest
@RecordApplicationEvents
class SplitEventPublishTest {
    @Autowired lateinit var splitService: SplitService
    @Autowired lateinit var userRepository: UserRepository
    @Autowired lateinit var events: ApplicationEvents

    private lateinit var author: User
    private lateinit var joiner: User

    @BeforeEach
    fun setup() {
        author = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "au${System.nanoTime()}", nickname = "작성자"))
        joiner = userRepository.save(User(provider = AuthProvider.KAKAO, providerId = "jo${System.nanoTime()}", nickname = "참여자"))
    }

    private fun dto() = CreateSplitDto("두쫀쿠", 20000, 4, 2, null, 37.5665, 126.9780, "서울")

    @Test
    fun `create 는 SplitCreatedEvent 발행`() {
        splitService.create(dto(), author.id)
        assertEquals(1, events.stream(SplitCreatedEvent::class.java).count())
    }

    @Test
    fun `splitCount 2 join 은 Joined + Matched 발행`() {
        val split = splitService.create(dto(), author.id)
        splitService.join(split.id, joiner.id)
        assertEquals(1, events.stream(SplitJoinedEvent::class.java).count())
        assertEquals(1, events.stream(SplitMatchedEvent::class.java).count())
    }

    @Test
    fun `cancel 은 SplitCancelledEvent 발행`() {
        val split = splitService.create(dto(), author.id)
        splitService.cancel(split.id, author.id)
        assertEquals(1, events.stream(SplitCancelledEvent::class.java).count())
    }
}
