package com.houseman.domain.contract.dto

import com.houseman.domain.contract.Contract
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDate

data class ContractResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomId: Long,
    val roomNumber: String,
    val name: String,
    val phone: String,
    val rent: Long,
    val mgmt: Long,
    val deposit: Long,
    val type: String,
    val due: String,
    val status: String,
    val overdue: Long,
    val moveIn: LocalDate,
    val expiry: LocalDate,
    val prevUnpaid: Long,
    val currentUnpaid: Long,
    val overdueDays: Int,
    val carNumber: String?,
    val carType: String?,
) {
    companion object {
        fun from(contract: Contract): ContractResponse = ContractResponse(
            id = contract.id,
            buildingId = contract.building.id,
            buildingName = contract.building.name,
            roomId = contract.room.id,
            roomNumber = contract.room.roomNumber,
            name = contract.name,
            phone = contract.phone,
            rent = contract.rent,
            mgmt = contract.mgmt,
            deposit = contract.deposit,
            type = contract.type,
            due = contract.due,
            status = contract.status,
            overdue = contract.overdue,
            moveIn = contract.moveIn,
            expiry = contract.expiry,
            prevUnpaid = contract.prevUnpaid,
            currentUnpaid = contract.currentUnpaid,
            overdueDays = contract.overdueDays,
            carNumber = contract.carNumber,
            carType = contract.carType,
        )
    }
}

data class CreateContractRequest(
    @field:NotNull val buildingId: Long,
    @field:NotNull val roomId: Long,
    @field:NotBlank val name: String,
    val phone: String = "",
    val rent: Long = 0,
    val mgmt: Long = 0,
    val deposit: Long = 0,
    val type: String = "단기",
    val due: String = "",
    @field:NotNull val moveIn: LocalDate,
    @field:NotNull val expiry: LocalDate,
    val carNumber: String? = null,
    val carType: String? = null,
)

data class UpdateContractRequest(
    val name: String? = null,
    val phone: String? = null,
    val rent: Long? = null,
    val mgmt: Long? = null,
    val deposit: Long? = null,
    val type: String? = null,
    val due: String? = null,
    val status: String? = null,
    val overdue: Long? = null,
    val moveIn: LocalDate? = null,
    val expiry: LocalDate? = null,
    val prevUnpaid: Long? = null,
    val currentUnpaid: Long? = null,
    val overdueDays: Int? = null,
    val carNumber: String? = null,
    val carType: String? = null,
)

data class MoveOutRequest(
    @field:NotNull val moveOutDate: LocalDate,
    val reason: String = "만기퇴실",
    val cleanFee: Long? = null,
    val elecReading: Long? = null,
    val gasReading: Long? = null,
    val waterReading: Long? = null,
    val damageFee: Long? = null,
    val damageDesc: String? = null,
    val penalty7: Long? = null,
    val penaltyReason: String? = null,
    val brokerageFee: Long? = null,
)
