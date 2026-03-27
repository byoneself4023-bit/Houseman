package com.houseman.service

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import kotlin.math.roundToLong

class ElectricityRateServiceTest {

    private val service = ElectricityRateService()

    @Test
    @DisplayName("Tier 1: 100kWh → 기본 910 + 에너지 9,330")
    fun tier1() {
        val result = service.calculate(100)
        assertEquals(100, result.usage)
        assertEquals(910L, result.baseFee)
        assertEquals((100 * 93.3).roundToLong(), result.energyFee) // 9330
        val subtotal = result.baseFee + result.energyFee
        assertEquals(subtotal, result.subtotal)
        assertEquals((subtotal * 0.10).roundToLong(), result.vat)
        assertEquals((subtotal * 0.037).roundToLong(), result.fund)
        assertEquals(subtotal + result.vat + result.fund, result.total)
    }

    @Test
    @DisplayName("Tier 2: 300kWh → 기본 1,600 + 누진 2구간")
    fun tier2() {
        val result = service.calculate(300)
        assertEquals(300, result.usage)
        assertEquals(1600L, result.baseFee)
        val expectedEnergy = (200 * 93.3 + 100 * 187.9).roundToLong() // 18660 + 18790 = 37450
        assertEquals(expectedEnergy, result.energyFee)
    }

    @Test
    @DisplayName("Tier 3: 500kWh → 기본 7,300 + 누진 3구간")
    fun tier3() {
        val result = service.calculate(500)
        assertEquals(500, result.usage)
        assertEquals(7300L, result.baseFee)
        val expectedEnergy = (200 * 93.3 + 200 * 187.9 + 100 * 280.6).roundToLong()
        assertEquals(expectedEnergy, result.energyFee)
    }

    @Test
    @DisplayName("0kWh → 기본 910 + 에너지 0")
    fun zeroUsage() {
        val result = service.calculate(0)
        assertEquals(910L, result.baseFee)
        assertEquals(0L, result.energyFee)
    }

    @Test
    @DisplayName("VAT + Fund 계산 검증")
    fun vatAndFund() {
        val result = service.calculate(200)
        val subtotal = result.subtotal
        assertEquals((subtotal * 0.10).roundToLong(), result.vat)
        assertEquals((subtotal * 0.037).roundToLong(), result.fund)
        assertEquals(subtotal + result.vat + result.fund, result.total)
    }
}
