package com.houseman.domain.billing.dto

import com.houseman.domain.billing.BillingConfig

data class BillingConfigResponse(
    val id: Long,
    val buildingId: Long,
    val buildingName: String,
    val roomId: Long,
    val roomNumber: String,
    val depositMonths: Int,
    val waterFee: Long,
    val cableFee: Long,
    val elecAmount: Long,
    val elecStart: String,
    val elecEnd: String,
    val elecPrice: Long,
    val elecSurcharge: Long,
    val elecTax: Long,
    val gasAmount: Long,
    val gasPeriod: String,
    val gasPrice: Long,
    val gasColdPrice: Long,
    val gasTax: Long,
) {
    companion object {
        fun from(config: BillingConfig): BillingConfigResponse = BillingConfigResponse(
            id = config.id,
            buildingId = config.building.id,
            buildingName = config.building.name,
            roomId = config.room.id,
            roomNumber = config.room.roomNumber,
            depositMonths = config.depositMonths,
            waterFee = config.waterFee,
            cableFee = config.cableFee,
            elecAmount = config.elecAmount,
            elecStart = config.elecStart,
            elecEnd = config.elecEnd,
            elecPrice = config.elecPrice,
            elecSurcharge = config.elecSurcharge,
            elecTax = config.elecTax,
            gasAmount = config.gasAmount,
            gasPeriod = config.gasPeriod,
            gasPrice = config.gasPrice,
            gasColdPrice = config.gasColdPrice,
            gasTax = config.gasTax,
        )
    }
}
