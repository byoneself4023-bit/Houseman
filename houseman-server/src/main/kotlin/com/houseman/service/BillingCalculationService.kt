package com.houseman.service

import com.houseman.repository.SettlementMasterRepository
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.YearMonth
import kotlin.math.floor
import kotlin.math.roundToLong

data class SettlementPeriod(
    val start: String,
    val end: String,
)

data class VatResult(
    val supply: Long,
    val tax: Long,
    val total: Long,
)

@Service
class BillingCalculationService(
    private val settlementMasterRepository: SettlementMasterRepository,
) {

    /**
     * 10원 단위 절사
     * billingMaster.ts: Math.floor(amount / 10) * 10
     */
    fun truncate10(amount: Long): Long = floor(amount.toDouble() / 10).toLong() * 10

    /**
     * 연체수수료 계산 (납부기한 5일 초과 시 5%)
     * billingMaster.ts: calcLateFee
     */
    fun calcLateFee(amount: Long, dueDay: Int): Long {
        val today = LocalDate.now().dayOfMonth
        val overdueDays = today - dueDay
        return if (overdueDays > 5) truncate10((amount * 0.05).roundToLong()) else 0
    }

    /**
     * 수수료 계산 (퍼센트형만 — 월급형은 정액이므로 호실별 계산 불필요)
     * billingMaster.ts: calcFee
     */
    fun calcFee(rent: Long, buildingName: String): Long {
        val master = settlementMasterRepository.findAllWithBuilding()
            .firstOrNull { it.buildingName == buildingName } ?: return 0
        if (master.feeType in listOf("salary", "fixed", "collection", "none")) return 0
        return (rent * master.feeRate.toDouble()).roundToLong()
    }

    /**
     * 퇴실 일할 계산
     * billingMaster.ts: calcProRata
     */
    fun calcProRata(rent: Long, moveOutDay: Int, rentDay: Int, year: Int, month: Int): Long {
        val totalDays = YearMonth.of(year, month).lengthOfMonth()
        val effectiveRentDay = if (rentDay == 0) 1 else rentDay
        val residenceDays = moveOutDay - effectiveRentDay + 1
        if (residenceDays <= 0 || residenceDays >= totalDays) return rent
        return ((rent.toDouble() * residenceDays) / totalDays).roundToLong()
    }

    /**
     * 부가세 계산
     * billingMaster.ts: calcVat
     */
    fun calcVat(amount: Long, buildingName: String): VatResult {
        val master = settlementMasterRepository.findAllWithBuilding()
            .firstOrNull { it.buildingName == buildingName }
        if (master == null || !master.vat) return VatResult(supply = amount, tax = 0, total = amount)
        val supply = (amount.toDouble() / 1.1).roundToLong()
        val tax = amount - supply
        return VatResult(supply = supply, tax = tax, total = amount)
    }

    /**
     * 정산기간 계산 (month/mid/custom)
     * billingMaster.ts: getSettlementPeriod
     */
    fun getSettlementPeriod(buildingName: String, year: Int, month: Int): SettlementPeriod {
        val master = settlementMasterRepository.findAllWithBuilding()
            .firstOrNull { it.buildingName == buildingName }

        if (master == null) {
            val lastDay = YearMonth.of(year, month).lengthOfMonth()
            return SettlementPeriod(
                start = "%d-%02d-01".format(year, month),
                end = "%d-%02d-%d".format(year, month, lastDay),
            )
        }

        if (master.periodType == "mid") {
            val prevMonth = if (month == 1) 12 else month - 1
            val prevYear = if (month == 1) year - 1 else year
            val settlementDayInt = master.settlementDay.toIntOrNull() ?: 15
            return SettlementPeriod(
                start = "%d-%02d-%s".format(prevYear, prevMonth, master.settlementDay),
                end = "%d-%02d-%d".format(year, month, settlementDayInt - 1),
            )
        }

        if (master.periodType == "custom" && master.customPeriod != null) {
            val prevMonth = if (month == 1) 12 else month - 1
            val prevYear = if (month == 1) year - 1 else year
            val lastDay = YearMonth.of(prevYear, prevMonth).lengthOfMonth()
            val startDay = (master.customPeriod!!["startDay"] as? Number)?.toInt() ?: 20
            return SettlementPeriod(
                start = "%d-%02d-%d".format(prevYear, prevMonth, startDay),
                end = "%d-%02d-%d".format(prevYear, prevMonth, lastDay),
            )
        }

        // month: 해당 월 전체
        val lastDay = YearMonth.of(year, month).lengthOfMonth()
        return SettlementPeriod(
            start = "%d-%02d-01".format(year, month),
            end = "%d-%02d-%d".format(year, month, lastDay),
        )
    }
}
