package com.houseman.infra.scheduling

import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.ContractRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Profile
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Component
@Profile("!test")
class ContractExpiryScheduler(
    private val contractRepository: ContractRepository,
    private val sseEmitterManager: SseEmitterManager,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(cron = "0 0 9 1 * *")
    fun checkExpiringContracts() {
        try {
            val now = LocalDate.now()
            val threshold = now.plusDays(30)

            val expiringContracts = contractRepository.findAllWithBuildingAndRoom()
                .filter { it.expiry in now..threshold }

            if (expiringContracts.isEmpty()) {
                log.info("[SCHEDULER] No expiring contracts found")
                return
            }

            log.info("[SCHEDULER] Found {} contracts expiring within 30 days", expiringContracts.size)

            sseEmitterManager.broadcast(
                SseEventType.CONTRACT_EXPIRING,
                SseEventData(
                    type = SseEventType.CONTRACT_EXPIRING,
                    message = "${expiringContracts.size}건의 계약이 30일 이내 만료 예정",
                    data = expiringContracts.map { c ->
                        mapOf(
                            "contractId" to c.id,
                            "buildingName" to c.building.name,
                            "roomNumber" to c.room.roomNumber,
                            "tenantName" to c.name,
                            "expiry" to c.expiry.toString(),
                            "daysRemaining" to ChronoUnit.DAYS.between(now, c.expiry),
                        )
                    },
                ),
            )
        } catch (e: Exception) {
            log.error("[SCHEDULER] Contract expiry check failed: {}", e.message, e)
        }
    }
}
