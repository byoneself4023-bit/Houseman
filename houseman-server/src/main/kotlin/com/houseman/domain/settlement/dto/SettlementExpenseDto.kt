package com.houseman.domain.settlement.dto

import com.houseman.domain.settlement.SettlementExpense
import java.time.LocalDate

data class SettlementExpenseResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomId: Long?,
    val roomNumber: String?,
    val month: String,
    val category: String,
    val description: String,
    val amount: Long,
    val date: LocalDate,
) {
    companion object {
        fun from(entity: SettlementExpense): SettlementExpenseResponse = SettlementExpenseResponse(
            id = entity.id,
            buildingId = entity.building.id,
            buildingName = entity.building.name,
            roomId = entity.room?.id,
            roomNumber = entity.room?.roomNumber,
            month = entity.month,
            category = entity.category,
            description = entity.description,
            amount = entity.amount,
            date = entity.date,
        )
    }
}

data class CreateSettlementExpenseRequest(
    val buildingId: Long,
    val roomId: Long? = null,
    val month: String,
    val category: String,
    val description: String = "",
    val amount: Long = 0,
    val date: LocalDate,
)

data class UpdateSettlementExpenseRequest(
    val roomId: Long? = null,
    val month: String? = null,
    val category: String? = null,
    val description: String? = null,
    val amount: Long? = null,
    val date: LocalDate? = null,
)
