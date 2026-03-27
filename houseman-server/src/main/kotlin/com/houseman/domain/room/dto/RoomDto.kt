package com.houseman.domain.room.dto

import com.houseman.domain.room.Room
import java.math.BigDecimal

data class RoomResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomNumber: String,
    val floorLabel: String?,
    val roomType: String?,
    val area: BigDecimal?,
    val baseDeposit: Long,
    val baseRent: Long,
    val baseMgmt: Long,
    val waterFee: String,
    val internetFee: String,
    val cleanFee: Long,
    val commFee: Long,
    val elecNo: String?,
    val gasNo: String?,
) {
    companion object {
        fun from(room: Room): RoomResponse = RoomResponse(
            id = room.id,
            buildingId = room.building.id,
            buildingName = room.building.name,
            roomNumber = room.roomNumber,
            floorLabel = room.floorLabel,
            roomType = room.roomType,
            area = room.area,
            baseDeposit = room.baseDeposit,
            baseRent = room.baseRent,
            baseMgmt = room.baseMgmt,
            waterFee = room.waterFee,
            internetFee = room.internetFee,
            cleanFee = room.cleanFee,
            commFee = room.commFee,
            elecNo = room.elecNo,
            gasNo = room.gasNo,
        )
    }
}

data class UpdateRoomRequest(
    val roomType: String? = null,
    val area: BigDecimal? = null,
    val baseDeposit: Long? = null,
    val baseRent: Long? = null,
    val baseMgmt: Long? = null,
    val waterFee: String? = null,
    val internetFee: String? = null,
    val cleanFee: Long? = null,
    val commFee: Long? = null,
    val elecNo: String? = null,
    val gasNo: String? = null,
)
