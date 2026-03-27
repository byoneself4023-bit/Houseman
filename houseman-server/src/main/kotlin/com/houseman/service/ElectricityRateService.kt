package com.houseman.service

import org.springframework.stereotype.Service
import kotlin.math.roundToLong

data class ElectricityFeeResult(
    val usage: Int,
    val baseFee: Long,
    val energyFee: Long,
    val subtotal: Long,
    val vat: Long,
    val fund: Long,
    val total: Long,
)

@Service
class ElectricityRateService {

    /**
     * 한전 누진 3구간 전기요금 계산
     * Tier 1: 0~200 kWh → 기본 910원, 93.3원/kWh
     * Tier 2: 201~400 kWh → 기본 1,600원, 187.9원/kWh
     * Tier 3: 401+ kWh → 기본 7,300원, 280.6원/kWh
     */
    fun calculate(usage: Int): ElectricityFeeResult {
        val (baseFee, energyFee) = when {
            usage <= 200 -> 910L to (usage * 93.3).roundToLong()
            usage <= 400 -> 1600L to (200 * 93.3 + (usage - 200) * 187.9).roundToLong()
            else -> 7300L to (200 * 93.3 + 200 * 187.9 + (usage - 400) * 280.6).roundToLong()
        }
        val subtotal = baseFee + energyFee
        val vat = (subtotal * 0.10).roundToLong()
        val fund = (subtotal * 0.037).roundToLong()
        return ElectricityFeeResult(
            usage = usage,
            baseFee = baseFee,
            energyFee = energyFee,
            subtotal = subtotal,
            vat = vat,
            fund = fund,
            total = subtotal + vat + fund,
        )
    }
}
