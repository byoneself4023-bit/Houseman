package com.houseman.domain.vacancy.dto

import com.houseman.domain.vacancy.Vacancy
import java.math.BigDecimal

data class VacancyResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomId: Long,
    val roomNumber: String,
    val type: String,
    val commBroker: BigDecimal,
    val commEvent: String,
    val pw: String,
    val deposit: Long,
    val rent: Long,
    val nego: Long,
    val mgmt: Long,
    val water: String,
    val cable: String,
    val exitFee: Long,
    val days: Int,
    val status: String,
) {
    companion object {
        fun from(entity: Vacancy): VacancyResponse = VacancyResponse(
            id = entity.id,
            buildingId = entity.building.id,
            buildingName = entity.building.name,
            roomId = entity.room.id,
            roomNumber = entity.room.roomNumber,
            type = entity.type,
            commBroker = entity.commBroker,
            commEvent = entity.commEvent,
            pw = entity.pw,
            deposit = entity.deposit,
            rent = entity.rent,
            nego = entity.nego,
            mgmt = entity.mgmt,
            water = entity.water,
            cable = entity.cable,
            exitFee = entity.exitFee,
            days = entity.days,
            status = entity.status,
        )
    }
}

data class CreateVacancyRequest(
    val buildingId: Long,
    val roomId: Long,
    val type: String = "",
    val commBroker: BigDecimal = BigDecimal.ZERO,
    val commEvent: String = "",
    val pw: String = "",
    val deposit: Long = 0,
    val rent: Long = 0,
    val nego: Long = 0,
    val mgmt: Long = 0,
    val water: String = "",
    val cable: String = "",
    val exitFee: Long = 0,
    val days: Int = 0,
    val status: String = "점검/청소중",
)

data class UpdateVacancyRequest(
    val type: String? = null,
    val commBroker: BigDecimal? = null,
    val commEvent: String? = null,
    val pw: String? = null,
    val deposit: Long? = null,
    val rent: Long? = null,
    val nego: Long? = null,
    val mgmt: Long? = null,
    val water: String? = null,
    val cable: String? = null,
    val exitFee: Long? = null,
    val days: Int? = null,
    val status: String? = null,
)
