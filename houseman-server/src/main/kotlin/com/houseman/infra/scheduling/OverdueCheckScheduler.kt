package com.houseman.infra.scheduling

import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.ContractRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
@Profile("!test")
class OverdueCheckScheduler(
    private val contractRepository: ContractRepository,
    private val sseEmitterManager: SseEmitterManager,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(cron = "0 0 9 * * *")
    fun checkOverdueContracts() {
        try {
            val overdueContracts = contractRepository.findAllWithBuildingAndRoom()
                .filter { it.overdue > 0 || it.overdueDays > 0 }

            if (overdueContracts.isEmpty()) {
                log.info("[SCHEDULER] No overdue contracts found")
                return
            }

            log.info("[SCHEDULER] Found {} overdue contracts", overdueContracts.size)

            overdueContracts.forEach { contract ->
                sseEmitterManager.broadcast(
                    SseEventType.OVERDUE_ALERT,
                    SseEventData(
                        type = SseEventType.OVERDUE_ALERT,
                        message = "${contract.building.name} ${contract.room.roomNumber} ${contract.name} 연체",
                        buildingName = contract.building.name,
                        roomNumber = contract.room.roomNumber,
                        data = mapOf(
                            "contractId" to contract.id,
                            "tenantName" to contract.name,
                            "overdue" to contract.overdue,
                            "overdueDays" to contract.overdueDays,
                        ),
                    ),
                )
            }
        } catch (e: Exception) {
            log.error("[SCHEDULER] Overdue check failed: {}", e.message, e)
        }
    }
}
