package com.houseman.service

import com.houseman.domain.settlement.dto.SettlementCalculateRequest
import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class OwnerSettlementServiceTest : IntegrationTestSupport() {

    @Autowired
    lateinit var ownerSettlementService: OwnerSettlementService

    @Autowired
    lateinit var billingCalculationService: BillingCalculationService

    @Test
    @DisplayName("스타빌(pct 5%): 수수료 계산 검증")
    fun starbilFee() {
        // 스타빌은 feeRate=0.05 (5%)
        val fee = billingCalculationService.calcFee(700_000, "스타빌")
        assertEquals(35_000L, fee)
    }

    @Test
    @DisplayName("제이앤제이(pct 0%): 수수료 = 0")
    fun jnjFee() {
        val fee = billingCalculationService.calcFee(1_150_000, "제이앤제이")
        assertEquals(0L, fee)
    }

    @Test
    @DisplayName("스타빌 2026-03 정산 계산: period, roomSettlements, deductions 검증")
    fun calculateStarbil() {
        val result = ownerSettlementService.calculate(
            SettlementCalculateRequest(buildingId = 2, year = 2026, month = 3)
        )

        assertEquals("스타빌", result.buildingName)
        assertEquals("2026-03-01", result.period.start)
        assertEquals("2026-03-31", result.period.end)
        assertEquals("pct", result.config.feeType)

        // 호실별 정산 확인 (스타빌의 활성 계약 수)
        assertTrue(result.roomSettlements.isNotEmpty())

        // 공제내역 4건 (스타빌 3월)
        assertEquals(4, result.deductions.size)

        // 총 공제 = 142000 + 220000 + 85000 + 55000 = 502000
        assertEquals(502_000L, result.summary.totalDeduction)

        // finalAmount = totalRentSettlement + totalMgmtSettlement - totalDeduction
        val expected = result.summary.totalRentSettlement + result.summary.totalMgmtSettlement - result.summary.totalDeduction
        assertEquals(expected, result.summary.finalAmount)
    }

    @Test
    @DisplayName("제이앤제이(pct 0%) 정산 계산: fee = 0이므로 rent = settlement")
    fun calculateJnj() {
        val result = ownerSettlementService.calculate(
            SettlementCalculateRequest(buildingId = 1, year = 2026, month = 3)
        )

        assertEquals("제이앤제이", result.buildingName)
        assertEquals("mid", result.config.periodType)

        // fee_rate = 0 → totalFee = 0, totalRent = totalRentSettlement
        assertEquals(0L, result.summary.totalFee)
        assertEquals(result.summary.totalRent, result.summary.totalRentSettlement)
    }
}
