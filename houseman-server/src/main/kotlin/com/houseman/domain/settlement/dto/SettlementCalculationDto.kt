package com.houseman.domain.settlement.dto

import com.houseman.service.SettlementPeriod

data class SettlementCalculateRequest(
    val buildingId: Long,
    val year: Int,
    val month: Int,
)

data class RoomSettlementItem(
    val roomNumber: String,
    val tenantName: String,
    val rent: Long,
    val mgmt: Long,
    val fee: Long,
    val settlementAmount: Long,
    val mgmtSettlement: Long,
)

data class MoveInItem(
    val roomNumber: String,
    val tenantName: String,
    val deposit: Long,
    val rent: Long,
    val brokerageFee: Long,
)

data class MoveOutItem(
    val roomNumber: String,
    val tenantName: String,
    val deposit: Long,
    val daysInMonth: Int,
    val usedDays: Int,
    val rentProRata: Long,
    val mgmtProRata: Long,
    val cleanFee: Long,
    val damageFee: Long,
    val penalty7: Long,
    val totalDeduct: Long,
    val depositReturn: Long,
    val finalRefund: Long,
    val brokerageFee: Long,
)

data class SettlementSummary(
    val totalRent: Long,
    val totalFee: Long,
    val totalRentSettlement: Long,
    val totalMgmt: Long,
    val totalMgmtSettlement: Long,
    val totalMoveOutRent: Long,
    val totalPenalty: Long,
    val totalBrokerage: Long,
    val totalDepositReturn: Long,
    val totalDeduction: Long,
    val finalAmount: Long,
)

data class SettlementCalculationResponse(
    val buildingId: Long,
    val buildingName: String,
    val period: SettlementPeriod,
    val config: SettlementConfig,
    val roomSettlements: List<RoomSettlementItem>,
    val moveInSettlements: List<MoveInItem>,
    val moveOutSettlements: List<MoveOutItem>,
    val deductions: List<SettlementExpenseResponse>,
    val summary: SettlementSummary,
)

data class SettlementConfig(
    val type: String,
    val feeType: String,
    val feeRate: String,
    val direction: String,
    val periodType: String,
    val vat: Boolean,
    val includeMgmt: Boolean,
)
