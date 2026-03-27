package com.houseman.domain.transaction.dto

import com.houseman.domain.transaction.Transaction
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class TransactionResponse(
    val id: Long,
    val date: LocalDate,
    val buildingId: Long,
    val buildingName: String,
    val roomId: Long?,
    val roomNumber: String?,
    val type: String,
    val category: String,
    val amount: Long,
    val description: String,
) {
    companion object {
        fun from(tx: Transaction): TransactionResponse = TransactionResponse(
            id = tx.id,
            date = tx.date,
            buildingId = tx.building.id,
            buildingName = tx.building.name,
            roomId = tx.room?.id,
            roomNumber = tx.room?.roomNumber,
            type = tx.type,
            category = tx.category,
            amount = tx.amount,
            description = tx.description,
        )
    }
}

data class CreateTransactionRequest(
    @field:NotNull val date: LocalDate,
    @field:NotNull val buildingId: Long,
    val roomId: Long? = null,
    @field:NotBlank val type: String,
    @field:NotBlank val category: String,
    @field:NotNull val amount: Long,
    val description: String = "",
)
