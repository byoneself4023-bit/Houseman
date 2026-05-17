package com.houseman.service

import com.houseman.domain.billing.BillingRecord
import com.houseman.domain.billing.BillingStatus
import com.houseman.domain.room.Room
import com.houseman.domain.transaction.Transaction
import com.houseman.repository.BillingRecordRepository
import com.houseman.repository.BuildingRepository
import com.houseman.repository.RoomRepository
import com.houseman.repository.TransactionRepository
import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.LocalDate

/**
 * C1-b: BillingService.retroFitPayments 단위 + 통합 테스트.
 *
 * 매칭 룰: room.id + date 범위(periodYear/Month) + type='입금'.
 * 멱등성: residual <= 0 또는 IllegalStateException → skippedAlreadyPaid.
 * dryRun=true → markPaid 미호출 (DB 무변경, 분류만).
 */
class BillingRetroFitTest : IntegrationTestSupport() {

    @Autowired
    lateinit var billingService: BillingService

    @Autowired
    lateinit var billingRecordRepository: BillingRecordRepository

    @Autowired
    lateinit var transactionRepository: TransactionRepository

    @Autowired
    lateinit var buildingRepository: BuildingRepository

    @Autowired
    lateinit var roomRepository: RoomRepository

    private fun firstRoom(buildingId: Long = 1): Room =
        roomRepository.findAll().first { it.building.id == buildingId }

    private fun seedRecord(
        room: Room,
        total: Long,
        periodYear: Int = 2025,
        periodMonth: Int = 6,
        status: BillingStatus = BillingStatus.SENT,
        paidAmount: Long = 0,
    ): BillingRecord {
        val record = BillingRecord(
            building = room.building,
            room = room,
            contract = null,
            periodYear = periodYear,
            periodMonth = periodMonth,
            tenantName = "C1-b 백필 테스트",
            rent = total,
            mgmt = 0,
            water = 0,
            electricity = 0,
            gas = 0,
            internet = 0,
            lateFee = 0,
            total = total,
            status = status,
            paidAmount = paidAmount,
        )
        return billingRecordRepository.save(record)
    }

    private fun seedDeposit(
        room: Room,
        amount: Long,
        date: LocalDate,
        type: String = "입금",
    ): Transaction {
        val txn = Transaction(
            date = date,
            building = room.building,
            room = room,
            type = type,
            category = "월세",
            amount = amount,
            description = "C1-b 백필 테스트 입금",
        )
        return transactionRepository.save(txn)
    }

    @Test
    @DisplayName("retroFitPayments: dryRun=true → 리포트만 생성, DB status SENT 그대로")
    fun dryRun_doesNotMutateDb() {
        val room = firstRoom()
        val record = seedRecord(room, total = 500_000, periodYear = 2025, periodMonth = 6)
        seedDeposit(room, amount = 500_000, date = LocalDate.of(2025, 6, 15))

        val report = billingService.retroFitPayments(buildingId = null, dryRun = true)

        assertTrue(report.dryRun)
        assertTrue(report.paidApplied.contains(record.id), "paidApplied 분류 확인")

        // DB 무변경 검증 — 새 트랜잭션으로 다시 조회
        val reloaded = billingRecordRepository.findById(record.id).orElseThrow()
        assertEquals(BillingStatus.SENT, reloaded.status)
        assertEquals(0L, reloaded.paidAmount)
    }

    @Test
    @DisplayName("retroFitPayments: dryRun=false + 전액 매칭 입금 → status=PAID + paidAmount=total")
    fun runMode_transitionsToPaid() {
        val room = firstRoom()
        val record = seedRecord(room, total = 500_000, periodYear = 2025, periodMonth = 7)
        seedDeposit(room, amount = 500_000, date = LocalDate.of(2025, 7, 10))

        val report = billingService.retroFitPayments(buildingId = null, dryRun = false)

        assertFalse(report.dryRun)
        assertTrue(report.paidApplied.contains(record.id), "paidApplied 분류 확인")

        val reloaded = billingRecordRepository.findById(record.id).orElseThrow()
        assertEquals(BillingStatus.PAID, reloaded.status)
        assertEquals(500_000L, reloaded.paidAmount)
        assertNotNull(reloaded.paidAt)
    }

    @Test
    @DisplayName("retroFitPayments: 이미 PAID 인 레코드 → status 필터로 자연 제외 (totalScanned 미포함)")
    fun alreadyPaidRecord_naturallyExcluded() {
        val room = firstRoom()
        val paidRecord = seedRecord(
            room,
            total = 100_000,
            periodYear = 2025,
            periodMonth = 8,
            status = BillingStatus.PAID,
            paidAmount = 100_000,
        )

        val report = billingService.retroFitPayments(buildingId = null, dryRun = false)

        // status IN (SENT, PARTIAL) 필터 — PAID 는 처음부터 조회 대상 X
        assertFalse(report.paidApplied.contains(paidRecord.id))
        assertFalse(report.partialApplied.contains(paidRecord.id))
        assertFalse(report.skippedAlreadyPaid.contains(paidRecord.id))
        assertFalse(report.unmatchedNoTransaction.contains(paidRecord.id))

        // DB 무변경 확인 (paid_amount 그대로)
        val reloaded = billingRecordRepository.findById(paidRecord.id).orElseThrow()
        assertEquals(BillingStatus.PAID, reloaded.status)
        assertEquals(100_000L, reloaded.paidAmount)
    }

    @Test
    @DisplayName("retroFitPayments: PARTIAL + 매칭 입금 합산 <= paidAmount → skippedAlreadyPaid (멱등성)")
    fun residualNonPositive_skipsAlreadyPaid() {
        val room = firstRoom()
        // PARTIAL 시드 (paidAmount=300_000 이미 누적)
        val record = seedRecord(
            room,
            total = 500_000,
            periodYear = 2025,
            periodMonth = 11,
            status = BillingStatus.PARTIAL,
            paidAmount = 300_000,
        )
        // 매칭 입금 200_000 (residual = 200_000 - 300_000 = -100_000 → skip)
        seedDeposit(room, amount = 200_000, date = LocalDate.of(2025, 11, 15))

        val report = billingService.retroFitPayments(buildingId = null, dryRun = false)

        assertTrue(
            report.skippedAlreadyPaid.contains(record.id),
            "residual <= 0 → skippedAlreadyPaid (멱등성 분기)",
        )

        // DB 무변경 검증 (markPaid 미호출)
        val reloaded = billingRecordRepository.findById(record.id).orElseThrow()
        assertEquals(BillingStatus.PARTIAL, reloaded.status)
        assertEquals(300_000L, reloaded.paidAmount)
    }

    @Test
    @DisplayName("retroFitPayments: 매칭 입금 0건 → unmatchedNoTransaction 분류, status SENT 그대로")
    fun noMatchingDeposit_classifiesAsUnmatched() {
        val room = firstRoom()
        val record = seedRecord(room, total = 300_000, periodYear = 2025, periodMonth = 9)
        // 입금 시드 없음 — 단, 다른 월에 입금이 있어도 무관해야 함
        seedDeposit(room, amount = 300_000, date = LocalDate.of(2025, 10, 1))

        val report = billingService.retroFitPayments(buildingId = null, dryRun = false)

        assertTrue(
            report.unmatchedNoTransaction.contains(record.id),
            "다른 월 입금만 있으면 매칭 0 — unmatchedNoTransaction 분류",
        )
        assertFalse(report.paidApplied.contains(record.id))

        val reloaded = billingRecordRepository.findById(record.id).orElseThrow()
        assertEquals(BillingStatus.SENT, reloaded.status)
        assertEquals(0L, reloaded.paidAmount)
    }

    @Test
    @DisplayName("retroFitPayments MockMvc: POST /api/billing/retro-fit?dryRun=false → 200 + 다건 백필 + DB 적용")
    fun integration_endpointAppliesBackfill() {
        val token = createToken()
        val room = firstRoom()

        // 3건 시드 — 전액매칭 / 부분매칭 / 매칭X
        val fullRecord = seedRecord(room, total = 400_000, periodYear = 2024, periodMonth = 1)
        seedDeposit(room, amount = 400_000, date = LocalDate.of(2024, 1, 5))

        val partialRecord = seedRecord(room, total = 500_000, periodYear = 2024, periodMonth = 2)
        seedDeposit(room, amount = 200_000, date = LocalDate.of(2024, 2, 5))

        val unmatchedRecord = seedRecord(room, total = 600_000, periodYear = 2024, periodMonth = 3)
        // 2024-03 입금 시드 없음

        val mvcResult = mockMvc.perform(
            post("/api/billing/retro-fit")
                .header("Authorization", "Bearer $token")
                .param("dryRun", "false")
                .contentType(MediaType.APPLICATION_JSON),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.dryRun").value(false))
            .andReturn()

        val responseJson = objectMapper.readTree(mvcResult.response.contentAsString)
        val data = responseJson["data"]
        val paidApplied = data["paidApplied"].map { it.asLong() }
        val partialApplied = data["partialApplied"].map { it.asLong() }
        val unmatched = data["unmatchedNoTransaction"].map { it.asLong() }

        assertTrue(paidApplied.contains(fullRecord.id), "전액매칭 → paidApplied")
        assertTrue(partialApplied.contains(partialRecord.id), "부분매칭 → partialApplied")
        assertTrue(unmatched.contains(unmatchedRecord.id), "매칭X → unmatchedNoTransaction")

        // DB 적용 검증
        val fullReloaded = billingRecordRepository.findById(fullRecord.id).orElseThrow()
        assertEquals(BillingStatus.PAID, fullReloaded.status)
        assertEquals(400_000L, fullReloaded.paidAmount)

        val partialReloaded = billingRecordRepository.findById(partialRecord.id).orElseThrow()
        assertEquals(BillingStatus.PARTIAL, partialReloaded.status)
        assertEquals(200_000L, partialReloaded.paidAmount)

        val unmatchedReloaded = billingRecordRepository.findById(unmatchedRecord.id).orElseThrow()
        assertEquals(BillingStatus.SENT, unmatchedReloaded.status)
        assertEquals(0L, unmatchedReloaded.paidAmount)
    }
}
