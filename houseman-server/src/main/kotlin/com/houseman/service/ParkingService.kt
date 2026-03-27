package com.houseman.service

import com.houseman.domain.parking.ParkingInfo
import com.houseman.domain.parking.dto.CreateParkingInfoRequest
import com.houseman.domain.parking.dto.ParkingInfoResponse
import com.houseman.domain.parking.dto.UpdateParkingInfoRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.ContractRepository
import com.houseman.repository.ParkingInfoRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ParkingService(
    private val parkingInfoRepository: ParkingInfoRepository,
    private val buildingRepository: BuildingRepository,
    private val contractRepository: ContractRepository,
) {

    fun findAll(buildingId: Long?): List<ParkingInfoResponse> {
        val infos = if (buildingId != null) {
            parkingInfoRepository.findByBuildingIdWithJoins(buildingId)
        } else {
            parkingInfoRepository.findAllWithBuilding()
        }
        return infos.map { ParkingInfoResponse.from(it) }
    }

    @Transactional
    fun create(request: CreateParkingInfoRequest): ParkingInfoResponse {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }

        val contract = request.contractId?.let {
            contractRepository.findById(it)
                .orElseThrow { BusinessException(ErrorCode.CONTRACT_NOT_FOUND) }
        }

        val info = ParkingInfo(
            building = building,
            contract = contract,
            tenantName = request.tenantName,
            roomNumber = request.roomNumber,
            carNumber = request.carNumber,
            carType = request.carType,
        )
        return ParkingInfoResponse.from(parkingInfoRepository.save(info))
    }

    @Transactional
    fun update(id: Long, request: UpdateParkingInfoRequest): ParkingInfoResponse {
        val info = parkingInfoRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.PARKING_NOT_FOUND) }

        request.tenantName?.let { info.tenantName = it }
        request.roomNumber?.let { info.roomNumber = it }
        request.carNumber?.let { info.carNumber = it }
        request.carType?.let { info.carType = it }
        request.contractId?.let { contractId ->
            info.contract = contractRepository.findById(contractId)
                .orElseThrow { BusinessException(ErrorCode.CONTRACT_NOT_FOUND) }
        }

        return ParkingInfoResponse.from(parkingInfoRepository.save(info))
    }

    @Transactional
    fun delete(id: Long) {
        val info = parkingInfoRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.PARKING_NOT_FOUND) }
        parkingInfoRepository.delete(info)
    }
}
