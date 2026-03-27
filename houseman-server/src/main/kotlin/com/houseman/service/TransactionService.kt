package com.houseman.service

import com.houseman.domain.transaction.Transaction
import com.houseman.domain.transaction.dto.CreateTransactionRequest
import com.houseman.domain.transaction.dto.TransactionResponse
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.BuildingRepository
import com.houseman.repository.RoomRepository
import com.houseman.repository.TransactionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TransactionService(
    private val transactionRepository: TransactionRepository,
    private val buildingRepository: BuildingRepository,
    private val roomRepository: RoomRepository,
    private val sseEmitterManager: SseEmitterManager,
) {

    fun findAll(buildingId: Long?): List<TransactionResponse> {
        val transactions = if (buildingId != null) {
            transactionRepository.findByBuildingIdWithJoins(buildingId)
        } else {
            transactionRepository.findAllWithBuildingAndRoom()
        }
        return transactions.map { TransactionResponse.from(it) }
    }

    @Transactional
    fun create(request: CreateTransactionRequest): TransactionResponse {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        val room = request.roomId?.let {
            roomRepository.findById(it)
                .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }
        }

        val transaction = Transaction(
            date = request.date,
            building = building,
            room = room,
            type = request.type,
            category = request.category,
            amount = request.amount,
            description = request.description,
        )
        val saved = TransactionResponse.from(transactionRepository.save(transaction))

        if (request.type == "입금") {
            try {
                sseEmitterManager.broadcast(
                    SseEventType.PAYMENT_RECEIVED,
                    SseEventData(
                        type = SseEventType.PAYMENT_RECEIVED,
                        message = "${building.name} 입금: ${request.amount}원",
                        buildingName = building.name,
                        roomNumber = room?.roomNumber,
                        data = mapOf("transactionId" to saved.id, "amount" to request.amount),
                    ),
                )
            } catch (_: Exception) { }
        }

        return saved
    }
}
