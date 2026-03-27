package com.houseman.e2e

import com.houseman.domain.building.Building
import com.houseman.domain.contract.Contract
import com.houseman.domain.room.Room
import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.infra.scheduling.OverdueCheckScheduler
import com.houseman.repository.ContractRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import java.time.LocalDate

@DisplayName("E2E: 연체 감지 플로우")
class OverdueFlowTest {

    private val contractRepository: ContractRepository = mockk()
    private val sseEmitterManager: SseEmitterManager = mockk(relaxed = true)
    private val scheduler = OverdueCheckScheduler(contractRepository, sseEmitterManager)

    @Test
    @DisplayName("연체 계약 존재 → OVERDUE_ALERT 브로드캐스트 (계약별 1건씩)")
    fun overdueContractsDetected() {
        val building = Building(name = "스타빌")
        val room1 = Room(building = building, roomNumber = "201")
        val room2 = Room(building = building, roomNumber = "302")

        val contracts = listOf(
            Contract(
                building = building,
                room = room1,
                name = "홍길동",
                moveIn = LocalDate.of(2026, 1, 1),
                expiry = LocalDate.of(2026, 12, 31),
                overdue = 500000,
                overdueDays = 15,
            ),
            Contract(
                building = building,
                room = room2,
                name = "김영희",
                moveIn = LocalDate.of(2026, 2, 1),
                expiry = LocalDate.of(2026, 8, 31),
                overdue = 300000,
                overdueDays = 7,
            ),
        )

        every { contractRepository.findAllWithBuildingAndRoom() } returns contracts

        scheduler.checkOverdueContracts()

        // 연체 계약 2건 → broadcast 2회
        verify(exactly = 2) {
            sseEmitterManager.broadcast(SseEventType.OVERDUE_ALERT, any<SseEventData>())
        }
    }

    @Test
    @DisplayName("연체 없음 → 브로드캐스트 안 함")
    fun noOverdueContracts() {
        val building = Building(name = "제이앤제이")
        val room = Room(building = building, roomNumber = "101")

        every { contractRepository.findAllWithBuildingAndRoom() } returns listOf(
            Contract(
                building = building,
                room = room,
                name = "정상 임차인",
                moveIn = LocalDate.of(2026, 1, 1),
                expiry = LocalDate.of(2026, 12, 31),
                overdue = 0,
                overdueDays = 0,
            ),
        )

        scheduler.checkOverdueContracts()

        verify(exactly = 0) { sseEmitterManager.broadcast(any(), any<SseEventData>()) }
    }

    @Test
    @DisplayName("계약 목록 비어있음 → 브로드캐스트 안 함")
    fun emptyContractList() {
        every { contractRepository.findAllWithBuildingAndRoom() } returns emptyList()

        scheduler.checkOverdueContracts()

        verify(exactly = 0) { sseEmitterManager.broadcast(any(), any<SseEventData>()) }
    }
}
