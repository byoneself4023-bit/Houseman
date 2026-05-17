package com.houseman.domain.billing.dto

import com.houseman.domain.billing.BillingRecord
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
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
    val paidAmount: Long,
    val paidAt: OffsetDateTime?,
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
            status = record.status.name,
            paidAmount = record.paidAmount,
            paidAt = record.paidAt,
            confirmedAt = record.confirmedAt,
            sentAt = record.sentAt,
            notes = record.notes,
        )
    }
}

/**
 * C1-a: PATCH /api/billing/{id}/paid 요청 DTO.
 * paidAmount만 받음 (transactionId는 별도 카드 C1-b retro-fit 영역).
 */
data class MarkPaidRequest(
    @field:NotNull @field:Positive val paidAmount: Long,
)

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
