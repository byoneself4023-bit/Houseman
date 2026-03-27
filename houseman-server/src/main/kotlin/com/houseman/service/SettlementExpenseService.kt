package com.houseman.service

import com.houseman.domain.settlement.SettlementExpense
import com.houseman.domain.settlement.dto.CreateSettlementExpenseRequest
import com.houseman.domain.settlement.dto.SettlementExpenseResponse
import com.houseman.domain.settlement.dto.UpdateSettlementExpenseRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.RoomRepository
import com.houseman.repository.SettlementExpenseRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class SettlementExpenseService(
    private val settlementExpenseRepository: SettlementExpenseRepository,
    private val buildingRepository: BuildingRepository,
    private val roomRepository: RoomRepository,
) {

    fun findAll(buildingId: Long?, month: String?): List<SettlementExpenseResponse> {
        val expenses = when {
            buildingId != null && month != null ->
                settlementExpenseRepository.findByBuildingIdAndMonth(buildingId, month)
            buildingId != null ->
                settlementExpenseRepository.findByBuildingIdWithJoins(buildingId)
            month != null ->
                settlementExpenseRepository.findByMonth(month)
            else ->
                settlementExpenseRepository.findAllWithJoins()
        }
        return expenses.map { SettlementExpenseResponse.from(it) }
    }

    @Transactional
    fun create(request: CreateSettlementExpenseRequest): SettlementExpenseResponse {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        val room = request.roomId?.let {
            roomRepository.findById(it)
                .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }
        }

        val expense = SettlementExpense(
            building = building,
            room = room,
            month = request.month,
            category = request.category,
            description = request.description,
            amount = request.amount,
            date = request.date,
        )
        return SettlementExpenseResponse.from(settlementExpenseRepository.save(expense))
    }

    @Transactional
    fun update(id: Long, request: UpdateSettlementExpenseRequest): SettlementExpenseResponse {
        val expense = settlementExpenseRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND) }

        request.month?.let { expense.month = it }
        request.category?.let { expense.category = it }
        request.description?.let { expense.description = it }
        request.amount?.let { expense.amount = it }
        request.date?.let { expense.date = it }

        if (request.roomId != null) {
            expense.room = roomRepository.findById(request.roomId)
                .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }
        }

        return SettlementExpenseResponse.from(settlementExpenseRepository.save(expense))
    }

    @Transactional
    fun delete(id: Long) {
        val expense = settlementExpenseRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND) }
        settlementExpenseRepository.delete(expense)
    }
}
