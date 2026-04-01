package com.houseman.service

import com.houseman.domain.latefee.LateFeeOverride
import com.houseman.domain.latefee.dto.CreateLateFeeOverrideRequest
import com.houseman.domain.latefee.dto.LateFeeOverrideResponse
import com.houseman.domain.latefee.dto.UpdateLateFeeOverrideRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.LateFeeOverrideRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class LateFeeOverrideService(
    private val repository: LateFeeOverrideRepository,
    private val buildingRepository: BuildingRepository,
) {

    fun findAll(buildingId: Long?): List<LateFeeOverrideResponse> {
        val overrides = if (buildingId != null) {
            repository.findByBuildingId(buildingId)
        } else {
            repository.findAllWithBuilding()
        }
        return overrides.map { LateFeeOverrideResponse.from(it) }
    }

    @Transactional
    fun create(request: CreateLateFeeOverrideRequest): LateFeeOverrideResponse {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }

        // upsert: 기존 있으면 업데이트
        val existing = repository.findByBuildingIdAndRoomNumber(request.buildingId, request.roomNumber)
        if (existing != null) {
            existing.overrideType = request.overrideType
            existing.amount = request.amount
            existing.overrideDate = request.overrideDate
            return LateFeeOverrideResponse.from(repository.save(existing))
        }

        val override = LateFeeOverride(
            building = building,
            roomNumber = request.roomNumber,
            overrideType = request.overrideType,
            amount = request.amount,
            overrideDate = request.overrideDate,
        )
        return LateFeeOverrideResponse.from(repository.save(override))
    }

    @Transactional
    fun update(id: Long, request: UpdateLateFeeOverrideRequest): LateFeeOverrideResponse {
        val override = repository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.INVALID_INPUT) }

        request.overrideType?.let { override.overrideType = it }
        request.amount?.let { override.amount = it }
        request.overrideDate?.let { override.overrideDate = it }

        return LateFeeOverrideResponse.from(repository.save(override))
    }

    @Transactional
    fun delete(id: Long) {
        val override = repository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.INVALID_INPUT) }
        repository.delete(override)
    }
}
