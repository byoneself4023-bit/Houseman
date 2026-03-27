package com.houseman.domain.cashbook.dto

import com.houseman.domain.cashbook.CashbookEntry
import java.time.LocalDate
import java.time.OffsetDateTime

data class CashbookEntryResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val date: LocalDate,
    val type: String,
    val direction: String,
    val description: String,
    val amount: Long,
    val account: String,
    val accountHolder: String,
    val status: String,
    val sentAt: OffsetDateTime?,
    val sourceId: String?,
    val room: String,
    val round: Int,
) {
    companion object {
        fun from(entity: CashbookEntry): CashbookEntryResponse = CashbookEntryResponse(
            id = entity.id,
            buildingId = entity.building.id,
            buildingName = entity.building.name,
            date = entity.date,
            type = entity.type,
            direction = entity.direction,
            description = entity.description,
            amount = entity.amount,
            account = entity.account,
            accountHolder = entity.accountHolder,
            status = entity.status,
            sentAt = entity.sentAt,
            sourceId = entity.sourceId,
            room = entity.room,
            round = entity.round,
        )
    }
}

data class CreateCashbookEntryRequest(
    val buildingId: Long,
    val date: LocalDate,
    val type: String = "manual",
    val direction: String = "출금",
    val description: String = "",
    val amount: Long = 0,
    val account: String = "",
    val accountHolder: String = "",
    val status: String = "대기",
    val sourceId: String? = null,
    val room: String = "",
    val round: Int = 0,
)

data class UpdateCashbookEntryRequest(
    val date: LocalDate? = null,
    val type: String? = null,
    val direction: String? = null,
    val description: String? = null,
    val amount: Long? = null,
    val account: String? = null,
    val accountHolder: String? = null,
    val status: String? = null,
    val sentAt: OffsetDateTime? = null,
    val sourceId: String? = null,
    val room: String? = null,
    val round: Int? = null,
)
