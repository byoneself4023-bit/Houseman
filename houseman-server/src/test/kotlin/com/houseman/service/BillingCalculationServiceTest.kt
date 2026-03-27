package com.houseman.service

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class BillingCalculationServiceTest : IntegrationTestSupport() {

    @Autowired
    lateinit var billingCalculationService: BillingCalculationService

    @Test
    @DisplayName("truncate10: 12345 → 12340, 10 → 10, 9 → 0")
    fun truncate10() {
        assertEquals(12340L, billingCalculationService.truncate10(12345))
        assertEquals(10L, billingCalculationService.truncate10(10))
        assertEquals(0L, billingCalculationService.truncate10(9))
        assertEquals(0L, billingCalculationService.truncate10(0))
        assertEquals(100L, billingCalculationService.truncate10(105))
    }

    @Test
    @DisplayName("calcFee: 퍼센트형 — 스타빌(5%) rent 1,000,000 → 50,000")
    fun calcFeePct() {
        val fee = billingCalculationService.calcFee(1_000_000, "스타빌")
        assertEquals(50_000L, fee)
    }

    @Test
    @DisplayName("calcFee: 월급형(salary) → 0")
    fun calcFeeSalary() {
        val fee = billingCalculationService.calcFee(1_000_000, "신림프리미어")
        assertEquals(0L, fee)
    }

    @Test
    @DisplayName("calcFee: 존재하지 않는 건물 → 0")
    fun calcFeeUnknown() {
        val fee = billingCalculationService.calcFee(1_000_000, "존재안함")
        assertEquals(0L, fee)
    }

    @Test
    @DisplayName("calcProRata: 30일 중 15일 거주 → 50%")
    fun calcProRata() {
        // 2026년 4월 (30일)
        val result = billingCalculationService.calcProRata(1_000_000, 15, 1, 2026, 4)
        assertEquals(500_000L, result)
    }

    @Test
    @DisplayName("calcProRata: 전체 거주 → rent 그대로")
    fun calcProRataFull() {
        // 31일 전체 거주
        val result = billingCalculationService.calcProRata(1_000_000, 31, 1, 2026, 3)
        assertEquals(1_000_000L, result)
    }

    @Test
    @DisplayName("calcVat: 아페이론(vat=true) 1,100,000 → supply 1,000,000 + tax 100,000")
    fun calcVatApeiron() {
        val result = billingCalculationService.calcVat(1_100_000, "아페이론")
        assertEquals(1_000_000L, result.supply)
        assertEquals(100_000L, result.tax)
        assertEquals(1_100_000L, result.total)
    }

    @Test
    @DisplayName("calcVat: 제이앤제이(vat=false) → supply = amount, tax = 0")
    fun calcVatNoVat() {
        val result = billingCalculationService.calcVat(1_000_000, "제이앤제이")
        assertEquals(1_000_000L, result.supply)
        assertEquals(0L, result.tax)
        assertEquals(1_000_000L, result.total)
    }

    @Test
    @DisplayName("getSettlementPeriod: month → 해당 월 전체")
    fun periodMonth() {
        // 스타빌: periodType=month, settlementDay=말일
        val period = billingCalculationService.getSettlementPeriod("스타빌", 2026, 3)
        assertEquals("2026-03-01", period.start)
        assertEquals("2026-03-31", period.end)
    }

    @Test
    @DisplayName("getSettlementPeriod: mid → 전월 15일~당월 14일")
    fun periodMid() {
        // 제이앤제이: periodType=mid, settlementDay=15
        val period = billingCalculationService.getSettlementPeriod("제이앤제이", 2026, 3)
        assertEquals("2026-02-15", period.start)
        assertEquals("2026-03-14", period.end)
    }

    @Test
    @DisplayName("getSettlementPeriod: custom → 전월 startDay~전월 말일")
    fun periodCustom() {
        // 모닝빌: periodType=custom, customPeriod.startDay=20
        val period = billingCalculationService.getSettlementPeriod("모닝빌", 2026, 3)
        assertEquals("2026-02-20", period.start)
        assertTrue(period.end.startsWith("2026-02-"))
    }

    @Test
    @DisplayName("getSettlementPeriod: 존재하지 않는 건물 → 해당 월 전체")
    fun periodUnknown() {
        val period = billingCalculationService.getSettlementPeriod("존재안함", 2026, 3)
        assertEquals("2026-03-01", period.start)
        assertEquals("2026-03-31", period.end)
    }
}
