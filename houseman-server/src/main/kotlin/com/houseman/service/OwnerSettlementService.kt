package com.houseman.service

import com.houseman.domain.settlement.dto.MoveInItem
import com.houseman.domain.settlement.dto.MoveOutItem
import com.houseman.domain.settlement.dto.RoomSettlementItem
import com.houseman.domain.settlement.dto.SettlementCalculateRequest
import com.houseman.domain.settlement.dto.SettlementCalculationResponse
import com.houseman.domain.settlement.dto.SettlementConfig
import com.houseman.domain.settlement.dto.SettlementExpenseResponse
import com.houseman.domain.settlement.dto.SettlementSummary
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.ContractRepository
import com.houseman.repository.PastContractRepository
import com.houseman.repository.SettlementExpenseRepository
import com.houseman.repository.SettlementMasterRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class OwnerSettlementService(
    private val settlementMasterRepository: SettlementMasterRepository,
    private val contractRepository: ContractRepository,
    private val pastContractRepository: PastContractRepository,
    private val settlementExpenseRepository: SettlementExpenseRepository,
    private val billingCalculationService: BillingCalculationService,
) {

    fun calculate(request: SettlementCalculateRequest): SettlementCalculationResponse {
        val buildingId = request.buildingId
        val year = request.year
        val month = request.month
        val monthStr = "%d-%02d".format(year, month)

        // 1. 정산 마스터 설정 로드
        val master = settlementMasterRepository.findByBuildingId(buildingId)
            ?: throw BusinessException(ErrorCode.SETTLEMENT_MASTER_NOT_FOUND)
        val buildingName = master.buildingName

        // 2. 정산 기간
        val period = billingCalculationService.getSettlementPeriod(buildingName, year, month)

        // 3. 호실별 정산 (활성 계약)
        val contracts = contractRepository.findByBuildingIdWithJoins(buildingId)
        val roomSettlements = contracts.map { c ->
            val fee = billingCalculationService.calcFee(c.rent, buildingName)
            val settlementAmt = c.rent - fee
            val mgmtSettlement = if (master.includeMgmt == true) c.mgmt else 0L
            RoomSettlementItem(
                roomNumber = c.room.roomNumber,
                tenantName = c.name,
                rent = c.rent,
                mgmt = c.mgmt,
                fee = fee,
                settlementAmount = settlementAmt,
                mgmtSettlement = mgmtSettlement,
            )
        }

        // 4. 입주 정산 (이번 달 입주)
        val moveInSettlements = contracts
            .filter { it.moveIn.year == year && it.moveIn.monthValue == month }
            .map { c ->
                MoveInItem(
                    roomNumber = c.room.roomNumber,
                    tenantName = c.name,
                    deposit = c.deposit,
                    rent = c.rent,
                    brokerageFee = c.room.commFee,
                )
            }

        // 5. 퇴실 정산 (이번 달 퇴실)
        val allPastContracts = pastContractRepository.findAllWithBuildingAndRoom()
        val moveOutPastContracts = allPastContracts
            .filter { it.building.id == buildingId && it.moveOut.year == year && it.moveOut.monthValue == month }

        val moveOutSettlements = moveOutPastContracts.map { pc ->
            MoveOutItem(
                roomNumber = pc.room.roomNumber,
                tenantName = pc.name,
                deposit = pc.deposit,
                daysInMonth = pc.daysInMonth ?: 30,
                usedDays = pc.usedDays ?: 0,
                rentProRata = pc.rentProRata ?: 0,
                mgmtProRata = pc.mgmtProRata ?: 0,
                cleanFee = pc.cleanFee ?: 0,
                damageFee = pc.damageFee ?: 0,
                penalty7 = pc.penalty7 ?: 0,
                totalDeduct = pc.totalDeduct ?: 0,
                depositReturn = pc.depositReturn ?: 0,
                finalRefund = pc.finalRefund ?: 0,
                brokerageFee = pc.brokerageFee ?: 0,
            )
        }

        // 6. 공제내역 (settlement_expenses)
        val deductionEntities = settlementExpenseRepository.findByBuildingIdAndMonth(buildingId, monthStr)
        val deductions = deductionEntities.map { SettlementExpenseResponse.from(it) }

        // 7. 요약 계산
        val totalRent = roomSettlements.sumOf { it.rent }
        val totalFee = roomSettlements.sumOf { it.fee }
        val totalRentSettlement = roomSettlements.sumOf { it.settlementAmount }
        val totalMgmt = roomSettlements.sumOf { it.mgmt }
        val totalMgmtSettlement = roomSettlements.sumOf { it.mgmtSettlement }
        val totalMoveOutRent = moveOutSettlements.sumOf { it.rentProRata }
        val totalPenalty = moveOutSettlements.sumOf { it.penalty7 }
        val totalBrokerage = moveInSettlements.sumOf { it.brokerageFee } + moveOutSettlements.sumOf { it.brokerageFee }
        val totalDepositReturn = moveOutSettlements.sumOf { it.depositReturn }
        val totalDeduction = deductions.sumOf { it.amount }

        // 최종 금액 (feeType별 분기)
        val finalAmount = when (master.feeType) {
            "salary" -> {
                // 월급형: 총 임대료 - 정액 수수료 - 공제
                val salary = master.feeAmount ?: 0
                totalRent + totalMgmtSettlement - salary - totalDeduction
            }
            "collection" -> {
                // 관리비수금형: 총 임대료 + 총 관리비 - 수수료 - 공제
                totalRent + totalMgmt - totalFee - totalDeduction
            }
            else -> {
                // pct형 (기본): 총 정산액 + 관리비정산 - 공제
                totalRentSettlement + totalMgmtSettlement - totalDeduction
            }
        }

        return SettlementCalculationResponse(
            buildingId = buildingId,
            buildingName = buildingName,
            period = period,
            config = SettlementConfig(
                type = master.type,
                feeType = master.feeType,
                feeRate = master.feeRate.toPlainString(),
                direction = master.direction,
                periodType = master.periodType,
                vat = master.vat,
                includeMgmt = master.includeMgmt ?: false,
            ),
            roomSettlements = roomSettlements,
            moveInSettlements = moveInSettlements,
            moveOutSettlements = moveOutSettlements,
            deductions = deductions,
            summary = SettlementSummary(
                totalRent = totalRent,
                totalFee = totalFee,
                totalRentSettlement = totalRentSettlement,
                totalMgmt = totalMgmt,
                totalMgmtSettlement = totalMgmtSettlement,
                totalMoveOutRent = totalMoveOutRent,
                totalPenalty = totalPenalty,
                totalBrokerage = totalBrokerage,
                totalDepositReturn = totalDepositReturn,
                totalDeduction = totalDeduction,
                finalAmount = finalAmount,
            ),
        )
    }
}
