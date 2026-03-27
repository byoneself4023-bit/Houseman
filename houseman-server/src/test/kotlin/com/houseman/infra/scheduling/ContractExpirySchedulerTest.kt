package com.houseman.infra.scheduling

import com.houseman.domain.building.Building
import com.houseman.domain.contract.Contract
import com.houseman.domain.room.Room
import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.ContractRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.time.LocalDate

class ContractExpirySchedulerTest {

    private val contractRepository: ContractRepository = mockk()
    private val sseEmitterManager: SseEmitterManager = mockk(relaxed = true)
    private val scheduler = ContractExpiryScheduler(contractRepository, sseEmitterManager)

    @Test
    @DisplayName("30일 이내 만료 계약 → CONTRACT_EXPIRING 브로드캐스트")
    fun broadcastsExpiringContracts() {
        val building = Building(name = "테스트빌딩")
        val room = Room(building = building, roomNumber = "201")
        val contract = Contract(
            building = building,
            room = room,
            name = "만료임박",
            moveIn = LocalDate.of(2025, 1, 1),
            expiry = LocalDate.now().plusDays(10), // 10일 후 만료
        )

        every { contractRepository.findAllWithBuildingAndRoom() } returns listOf(contract)

        scheduler.checkExpiringContracts()

        verify(exactly = 1) {
            sseEmitterManager.broadcast(SseEventType.CONTRACT_EXPIRING, any<SseEventData>())
        }
    }

    @Test
    @DisplayName("30일 이후 만료 → 브로드캐스트 안 함")
    fun noBroadcastWhenNotExpiring() {
        val building = Building(name = "테스트빌딩")
        val room = Room(building = building, roomNumber = "301")
        val contract = Contract(
            building = building,
            room = room,
            name = "여유있음",
            moveIn = LocalDate.of(2025, 1, 1),
            expiry = LocalDate.now().plusDays(60), // 60일 후 만료
        )

        every { contractRepository.findAllWithBuildingAndRoom() } returns listOf(contract)

        scheduler.checkExpiringContracts()

        verify(exactly = 0) { sseEmitterManager.broadcast(any(), any<SseEventData>()) }
    }
}
