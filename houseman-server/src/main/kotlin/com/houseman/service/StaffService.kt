package com.houseman.service

import com.houseman.domain.staff.Staff
import com.houseman.domain.staff.dto.CreateStaffRequest
import com.houseman.domain.staff.dto.StaffResponse
import com.houseman.domain.staff.dto.UpdateStaffRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.StaffRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class StaffService(
    private val staffRepository: StaffRepository,
    private val passwordEncoder: PasswordEncoder,
) {

    fun findAll(): List<StaffResponse> =
        staffRepository.findAll().map { StaffResponse.from(it) }

    fun findById(id: Long): StaffResponse {
        val staff = staffRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.STAFF_NOT_FOUND) }
        return StaffResponse.from(staff)
    }

    fun findEntityById(id: Long): Staff =
        staffRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.STAFF_NOT_FOUND) }

    fun findByPhone(phone: String): Staff? =
        staffRepository.findByPhone(phone)

    @Transactional
    fun create(request: CreateStaffRequest): StaffResponse {
        val staff = Staff(
            name = request.name,
            phone = request.phone,
            password = passwordEncoder.encode(request.password),
            roles = request.roles.toTypedArray(),
            assignedBuildings = request.assignedBuildings.toTypedArray(),
        )
        return StaffResponse.from(staffRepository.save(staff))
    }

    @Transactional
    fun update(id: Long, request: UpdateStaffRequest): StaffResponse {
        val staff = staffRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.STAFF_NOT_FOUND) }

        request.name?.let { staff.name = it }
        request.phone?.let { staff.phone = it }
        request.password?.let { staff.password = passwordEncoder.encode(it) }
        request.roles?.let { staff.roles = it.toTypedArray() }
        request.assignedBuildings?.let { staff.assignedBuildings = it.toTypedArray() }

        return StaffResponse.from(staffRepository.save(staff))
    }
}
