package com.houseman.domain.parking.dto

import com.houseman.domain.parking.ParkingInfo

data class ParkingInfoResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val contractId: Long?,
    val tenantName: String,
    val roomNumber: String,
    val carNumber: String,
    val carType: String,
) {
    companion object {
        fun from(entity: ParkingInfo): ParkingInfoResponse = ParkingInfoResponse(
            id = entity.id,
            buildingId = entity.building.id,
            buildingName = entity.building.name,
            contractId = entity.contract?.id,
            tenantName = entity.tenantName,
            roomNumber = entity.roomNumber,
            carNumber = entity.carNumber,
            carType = entity.carType,
        )
    }
}

data class CreateParkingInfoRequest(
    val buildingId: Long,
    val contractId: Long? = null,
    val tenantName: String = "",
    val roomNumber: String = "",
    val carNumber: String = "",
    val carType: String = "",
)

data class UpdateParkingInfoRequest(
    val contractId: Long? = null,
    val tenantName: String? = null,
    val roomNumber: String? = null,
    val carNumber: String? = null,
    val carType: String? = null,
)
