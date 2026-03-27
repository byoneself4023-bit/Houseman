package com.houseman.service

import com.houseman.domain.contract.Contract
import com.houseman.domain.contract.PastContract
import com.houseman.domain.contract.dto.ContractResponse
import com.houseman.domain.contract.dto.CreateContractRequest
import com.houseman.domain.contract.dto.MoveOutRequest
import com.houseman.domain.contract.dto.PastContractGroupResponse
import com.houseman.domain.contract.dto.PastContractResponse
import com.houseman.domain.contract.dto.UpdateContractRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.BuildingRepository
import com.houseman.repository.ContractRepository
import com.houseman.repository.PastContractRepository
import com.houseman.repository.RoomRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class ContractService(
    private val contractRepository: ContractRepository,
    private val pastContractRepository: PastContractRepository,
    private val buildingRepository: BuildingRepository,
    private val roomRepository: RoomRepository,
    private val sseEmitterManager: SseEmitterManager,
) {

    fun findAll(buildingId: Long?): List<ContractResponse> {
        val contracts = if (buildingId != null) {
            contractRepository.findByBuildingIdWithJoins(buildingId)
        } else {
            contractRepository.findAllWithBuildingAndRoom()
        }
        return contracts.map { ContractResponse.from(it) }
    }

    fun findById(id: Long): ContractResponse {
        val contract = contractRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CONTRACT_NOT_FOUND) }
        return ContractResponse.from(contract)
    }

    fun findExpiring(): List<ContractResponse> {
        val now = LocalDate.now()
        val threshold = now.plusDays(30)
        return contractRepository.findAllWithBuildingAndRoom()
            .filter { it.expiry in now..threshold }
            .map { ContractResponse.from(it) }
    }

    @Transactional
    fun create(request: CreateContractRequest): ContractResponse {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        val room = roomRepository.findById(request.roomId)
            .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }

        val contract = Contract(
            building = building,
            room = room,
            name = request.name,
            phone = request.phone,
            rent = request.rent,
            mgmt = request.mgmt,
            deposit = request.deposit,
            type = request.type,
            due = request.due,
            moveIn = request.moveIn,
            expiry = request.expiry,
            carNumber = request.carNumber,
            carType = request.carType,
        )
        val saved = ContractResponse.from(contractRepository.save(contract))

        try {
            sseEmitterManager.broadcast(
                SseEventType.MOVE_IN_SCHEDULED,
                SseEventData(
                    type = SseEventType.MOVE_IN_SCHEDULED,
                    message = "${building.name} ${room.roomNumber} 입주 예정: ${request.name}",
                    buildingName = building.name,
                    roomNumber = room.roomNumber,
                    data = mapOf("contractId" to saved.id),
                ),
            )
        } catch (_: Exception) { }

        return saved
    }

    @Transactional
    fun update(id: Long, request: UpdateContractRequest): ContractResponse {
        val contract = contractRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CONTRACT_NOT_FOUND) }

        request.name?.let { contract.name = it }
        request.phone?.let { contract.phone = it }
        request.rent?.let { contract.rent = it }
        request.mgmt?.let { contract.mgmt = it }
        request.deposit?.let { contract.deposit = it }
        request.type?.let { contract.type = it }
        request.due?.let { contract.due = it }
        request.status?.let { contract.status = it }
        request.overdue?.let { contract.overdue = it }
        request.moveIn?.let { contract.moveIn = it }
        request.expiry?.let { contract.expiry = it }
        request.prevUnpaid?.let { contract.prevUnpaid = it }
        request.currentUnpaid?.let { contract.currentUnpaid = it }
        request.overdueDays?.let { contract.overdueDays = it }
        request.carNumber?.let { contract.carNumber = it }
        request.carType?.let { contract.carType = it }

        return ContractResponse.from(contractRepository.save(contract))
    }

    @Transactional
    fun moveOut(id: Long, request: MoveOutRequest): PastContractResponse {
        val contract = contractRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CONTRACT_NOT_FOUND) }

        val buildingName = contract.building.name
        val roomNumber = contract.room.roomNumber
        val tenantName = contract.name

        val pastContract = PastContract(
            building = contract.building,
            room = contract.room,
            name = contract.name,
            phone = contract.phone,
            moveIn = contract.moveIn,
            moveOut = request.moveOutDate,
            expiry = contract.expiry,
            deposit = contract.deposit,
            rent = contract.rent,
            mgmt = contract.mgmt,
            roomType = contract.type,
            due = contract.due,
            reason = request.reason,
            settlement = if (request.penalty7 != null && request.penalty7 > 0) "위약금 발생" else "정산완료",
            settlementDate = request.moveOutDate,
            cleanFee = request.cleanFee,
            elecReading = request.elecReading,
            gasReading = request.gasReading,
            waterReading = request.waterReading,
            damageFee = request.damageFee,
            damageDesc = request.damageDesc,
            penalty7 = request.penalty7,
            penaltyReason = request.penaltyReason,
            brokerageFee = request.brokerageFee,
        )

        val saved = pastContractRepository.save(pastContract)
        contractRepository.delete(contract)

        try {
            sseEmitterManager.broadcast(
                SseEventType.MOVE_OUT_SCHEDULED,
                SseEventData(
                    type = SseEventType.MOVE_OUT_SCHEDULED,
                    message = "$buildingName $roomNumber 퇴실: $tenantName",
                    buildingName = buildingName,
                    roomNumber = roomNumber,
                    data = mapOf("pastContractId" to saved.id),
                ),
            )
        } catch (_: Exception) { }

        return PastContractResponse.from(saved)
    }

    fun findAllPastContracts(): List<PastContractGroupResponse> {
        return pastContractRepository.findAllWithBuildingAndRoom()
            .groupBy { "${it.building.name}_${it.room.roomNumber}" }
            .map { (key, records) ->
                val first = records.first()
                PastContractGroupResponse(
                    buildingName = first.building.name,
                    roomNumber = first.room.roomNumber,
                    records = records.map { PastContractResponse.from(it) },
                )
            }
    }

    fun findPastContractById(id: Long): PastContractResponse {
        val pastContract = pastContractRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.PAST_CONTRACT_NOT_FOUND) }
        return PastContractResponse.from(pastContract)
    }
}
