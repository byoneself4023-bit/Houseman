package com.houseman.domain.building.dto

import com.houseman.domain.building.Building
import java.math.BigDecimal
import java.time.LocalDate

data class BuildingListResponse(
    val id: Long,
    val name: String,
    val roomCount: Int,
    val occupiedCount: Int,
    val buildingType: String,
    val feeType: String,
    val fee: BigDecimal,
    val fixedFee: Long,
    val parkingTotal: Int,
    val address: String?,
) {
    companion object {
        fun from(building: Building): BuildingListResponse = BuildingListResponse(
            id = building.id,
            name = building.name,
            roomCount = building.roomCount,
            occupiedCount = building.occupiedCount,
            buildingType = building.buildingType,
            feeType = building.feeType,
            fee = building.fee,
            fixedFee = building.fixedFee,
            parkingTotal = building.parkingTotal,
            address = building.address,
        )
    }
}

data class BuildingDetailResponse(
    val id: Long,
    val name: String,
    val roomCount: Int,
    val occupiedCount: Int,
    val buildingType: String,
    val feeType: String,
    val fee: BigDecimal,
    val fixedFee: Long,
    val special: String?,
    val parkingTotal: Int,
    val ownerName: String?,
    val ownerPhone: String?,
    val ownerFee: BigDecimal?,
    val ownerAccount: String?,
    val mgmtStart: LocalDate?,
    val address: String?,
    val floors: Map<String, List<String>>?,
) {
    companion object {
        fun from(building: Building): BuildingDetailResponse = BuildingDetailResponse(
            id = building.id,
            name = building.name,
            roomCount = building.roomCount,
            occupiedCount = building.occupiedCount,
            buildingType = building.buildingType,
            feeType = building.feeType,
            fee = building.fee,
            fixedFee = building.fixedFee,
            special = building.special,
            parkingTotal = building.parkingTotal,
            ownerName = building.ownerName,
            ownerPhone = building.ownerPhone,
            ownerFee = building.ownerFee,
            ownerAccount = building.ownerAccount,
            mgmtStart = building.mgmtStart,
            address = building.address,
            floors = building.floors,
        )
    }
}

data class UpdateBuildingRequest(
    val name: String? = null,
    val feeType: String? = null,
    val fee: BigDecimal? = null,
    val fixedFee: Long? = null,
    val special: String? = null,
    val parkingTotal: Int? = null,
    val ownerName: String? = null,
    val ownerPhone: String? = null,
    val ownerFee: BigDecimal? = null,
    val ownerAccount: String? = null,
    val mgmtStart: LocalDate? = null,
    val address: String? = null,
    val floors: Map<String, List<String>>? = null,
)
