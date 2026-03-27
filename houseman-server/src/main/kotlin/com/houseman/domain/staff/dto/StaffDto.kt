package com.houseman.domain.staff.dto

import com.houseman.domain.staff.Staff
import jakarta.validation.constraints.NotBlank

data class StaffResponse(
    val id: Long,
    val name: String,
    val phone: String,
    val roles: List<String>,
    val assignedBuildings: List<String>,
) {
    companion object {
        fun from(staff: Staff): StaffResponse = StaffResponse(
            id = staff.id,
            name = staff.name,
            phone = staff.phone,
            roles = staff.roles.toList(),
            assignedBuildings = staff.assignedBuildings.toList(),
        )
    }
}

data class CreateStaffRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val phone: String,
    @field:NotBlank val password: String,
    val roles: List<String> = emptyList(),
    val assignedBuildings: List<String> = emptyList(),
)

data class UpdateStaffRequest(
    val name: String? = null,
    val phone: String? = null,
    val password: String? = null,
    val roles: List<String>? = null,
    val assignedBuildings: List<String>? = null,
)
