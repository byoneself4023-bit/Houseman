package com.houseman.service

import com.houseman.domain.room.dto.RoomResponse
import com.houseman.domain.room.dto.UpdateRoomRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.RoomRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class RoomService(
    private val roomRepository: RoomRepository,
) {

    fun findByBuildingId(buildingId: Long): List<RoomResponse> =
        roomRepository.findByBuildingIdOrderByRoomNumber(buildingId)
            .map { RoomResponse.from(it) }

    fun findById(id: Long): RoomResponse {
        val room = roomRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }
        return RoomResponse.from(room)
    }

    @Transactional
    fun update(id: Long, request: UpdateRoomRequest): RoomResponse {
        val room = roomRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }

        request.roomType?.let { room.roomType = it }
        request.area?.let { room.area = it }
        request.baseDeposit?.let { room.baseDeposit = it }
        request.baseRent?.let { room.baseRent = it }
        request.baseMgmt?.let { room.baseMgmt = it }
        request.waterFee?.let { room.waterFee = it }
        request.internetFee?.let { room.internetFee = it }
        request.cleanFee?.let { room.cleanFee = it }
        request.commFee?.let { room.commFee = it }
        request.elecNo?.let { room.elecNo = it }
        request.gasNo?.let { room.gasNo = it }

        return RoomResponse.from(roomRepository.save(room))
    }
}
