package com.houseman.domain.billing.dto

import com.houseman.domain.billing.BillingRecord
import jakarta.validation.constraints.NotNull
import java.time.OffsetDateTime

data class BillingRecordResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomId: Long,
    val roomNumber: String,
    val contractId: Long?,
    val periodYear: Int,
    val periodMonth: Int,
    val tenantName: String,
    val rent: Long,
    val mgmt: Long,
    val water: Long,
    val electricity: Long,
    val gas: Long,
    val internet: Long,
    val lateFee: Long,
    val total: Long,
    val status: String,
    val confirmedAt: OffsetDateTime?,
    val sentAt: OffsetDateTime?,
    val notes: String?,
) {
    companion object {
        fun from(record: BillingRecord): BillingRecordResponse = BillingRecordResponse(
            id = record.id,
            buildingId = record.building.id,
            buildingName = record.building.name,
            roomId = record.room.id,
            roomNumber = record.room.roomNumber,
            contractId = record.contract?.id,
            periodYear = record.periodYear,
            periodMonth = record.periodMonth,
            tenantName = record.tenantName,
            rent = record.rent,
            mgmt = record.mgmt,
            water = record.water,
            electricity = record.electricity,
            gas = record.gas,
            internet = record.internet,
            lateFee = record.lateFee,
            total = record.total,
            status = record.status,
            confirmedAt = record.confirmedAt,
            sentAt = record.sentAt,
            notes = record.notes,
        )
    }
}

data class GenerateBillingRequest(
    @field:NotNull val buildingId: Long,
    @field:NotNull val periodYear: Int,
    @field:NotNull val periodMonth: Int,
)

data class BillingStatusResponse(
    val total: Int,
    val draft: Int,
    val confirmed: Int,
    val sent: Int,
)
