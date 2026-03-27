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

class OverdueCheckSchedulerTest {

    private val contractRepository: ContractRepository = mockk()
    private val sseEmitterManager: SseEmitterManager = mockk(relaxed = true)
    private val scheduler = OverdueCheckScheduler(contractRepository, sseEmitterManager)

    @Test
    @DisplayName("연체 계약 있으면 OVERDUE_ALERT 브로드캐스트")
    fun broadcastsOverdueAlert() {
        val building = Building(name = "테스트빌딩")
        val room = Room(building = building, roomNumber = "101")
        val contract = Contract(
            building = building,
            room = room,
            name = "홍길동",
            moveIn = LocalDate.of(2026, 1, 1),
            expiry = LocalDate.of(2026, 12, 31),
            overdue = 500000,
            overdueDays = 15,
        )

        every { contractRepository.findAllWithBuildingAndRoom() } returns listOf(contract)

        scheduler.checkOverdueContracts()

        verify(exactly = 1) {
            sseEmitterManager.broadcast(SseEventType.OVERDUE_ALERT, any<SseEventData>())
        }
    }

    @Test
    @DisplayName("연체 계약 없으면 브로드캐스트 안 함")
    fun noBroadcastWhenNoOverdue() {
        val building = Building(name = "테스트빌딩")
        val room = Room(building = building, roomNumber = "101")
        val contract = Contract(
            building = building,
            room = room,
            name = "정상인",
            moveIn = LocalDate.of(2026, 1, 1),
            expiry = LocalDate.of(2026, 12, 31),
            overdue = 0,
            overdueDays = 0,
        )

        every { contractRepository.findAllWithBuildingAndRoom() } returns listOf(contract)

        scheduler.checkOverdueContracts()

        verify(exactly = 0) { sseEmitterManager.broadcast(any(), any<SseEventData>()) }
    }
}
