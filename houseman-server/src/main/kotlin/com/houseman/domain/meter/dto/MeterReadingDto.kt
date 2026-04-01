package com.houseman.domain.meter.dto

import com.houseman.domain.meter.MeterReading
import java.math.BigDecimal
import java.time.LocalDate

data class MeterReadingResponse(
    val id: Long,
    val buildingId: Long,
    val roomId: Long?,
    val roomNumber: String?,
    val type: String,
    val readingDate: LocalDate?,
    val readingValue: BigDecimal?,
    val usage: BigDecimal,
    val amount: Int,
    val periodStart: LocalDate?,
    val periodEnd: LocalDate?,
    val billingMonth: String?,
    val customerNumber: String?,
    val isMeterReplaced: Boolean,
    val source: String,
) {
    companion object {
        fun from(entity: MeterReading): MeterReadingResponse = MeterReadingResponse(
            id = entity.id,
            buildingId = entity.building.id,
            roomId = entity.room?.id,
            roomNumber = entity.room?.roomNumber,
            type = entity.type,
            readingDate = entity.readingDate,
            readingValue = entity.readingValue,
            usage = entity.usage,
            amount = entity.amount,
            periodStart = entity.periodStart,
            periodEnd = entity.periodEnd,
            billingMonth = entity.billingMonth,
            customerNumber = entity.customerNumber,
            isMeterReplaced = entity.isMeterReplaced,
            source = entity.source,
        )
    }
}

data class CreateMeterReadingRequest(
    val buildingId: Long,
    val roomId: Long? = null,
    val type: String,
    val readingDate: LocalDate? = null,
    val readingValue: BigDecimal? = null,
    val usage: BigDecimal = BigDecimal.ZERO,
    val amount: Int = 0,
    val periodStart: LocalDate? = null,
    val periodEnd: LocalDate? = null,
    val billingMonth: String? = null,
    val customerNumber: String? = null,
    val isMeterReplaced: Boolean = false,
    val source: String = "upload",
)

data class BulkCreateMeterReadingRequest(
    val readings: List<CreateMeterReadingRequest>,
)
