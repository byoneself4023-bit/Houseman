package com.houseman.service

import com.houseman.domain.building.dto.BuildingDetailResponse
import com.houseman.domain.building.dto.BuildingListResponse
import com.houseman.domain.building.dto.UpdateBuildingRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.StaffRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class BuildingService(
    private val buildingRepository: BuildingRepository,
    private val staffRepository: StaffRepository,
) {

    fun findAll(staffId: Long): List<BuildingListResponse> {
        val staff = staffRepository.findById(staffId)
            .orElseThrow { BusinessException(ErrorCode.STAFF_NOT_FOUND) }

        val buildings = if (staff.assignedBuildings.isEmpty()) {
            buildingRepository.findAll()
        } else {
            buildingRepository.findByNameIn(staff.assignedBuildings.toList())
        }

        return buildings.map { BuildingListResponse.from(it) }
    }

    fun findById(id: Long): BuildingDetailResponse {
        val building = buildingRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        return BuildingDetailResponse.from(building)
    }

    @Transactional
    fun update(id: Long, request: UpdateBuildingRequest): BuildingDetailResponse {
        val building = buildingRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }

        request.name?.let { building.name = it }
        request.feeType?.let { building.feeType = it }
        request.fee?.let { building.fee = it }
        request.fixedFee?.let { building.fixedFee = it }
        request.special?.let { building.special = it }
        request.parkingTotal?.let { building.parkingTotal = it }
        request.ownerName?.let { building.ownerName = it }
        request.ownerPhone?.let { building.ownerPhone = it }
        request.ownerFee?.let { building.ownerFee = it }
        request.ownerAccount?.let { building.ownerAccount = it }
        request.mgmtStart?.let { building.mgmtStart = it }
        request.address?.let { building.address = it }
        request.floors?.let { building.floors = it }

        return BuildingDetailResponse.from(buildingRepository.save(building))
    }
}
