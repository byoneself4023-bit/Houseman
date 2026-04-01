package com.houseman.domain.latefee.dto

import com.houseman.domain.latefee.LateFeeOverride
import java.time.LocalDate

data class LateFeeOverrideResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomNumber: String,
    val overrideType: String,
    val amount: Int,
    val overrideDate: LocalDate?,
) {
    companion object {
        fun from(entity: LateFeeOverride): LateFeeOverrideResponse = LateFeeOverrideResponse(
            id = entity.id,
            buildingId = entity.building.id,
            buildingName = entity.building.name,
            roomNumber = entity.roomNumber,
            overrideType = entity.overrideType,
            amount = entity.amount,
            overrideDate = entity.overrideDate,
        )
    }
}

data class CreateLateFeeOverrideRequest(
    val buildingId: Long,
    val roomNumber: String,
    val overrideType: String = "exclude",
    val amount: Int = 0,
    val overrideDate: LocalDate? = null,
)

data class UpdateLateFeeOverrideRequest(
    val overrideType: String? = null,
    val amount: Int? = null,
    val overrideDate: LocalDate? = null,
)
