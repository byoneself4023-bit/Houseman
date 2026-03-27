package com.houseman.controller

import com.houseman.domain.building.dto.BuildingDetailResponse
import com.houseman.domain.building.dto.BuildingListResponse
import com.houseman.domain.building.dto.UpdateBuildingRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.security.UserPrincipal
import com.houseman.service.BuildingService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/buildings")
class BuildingController(
    private val buildingService: BuildingService,
) {

    @GetMapping
    fun getAll(): ResponseEntity<ApiResponse<List<BuildingListResponse>>> {
        val staffId = currentStaffId()
        return ResponseEntity.ok(ApiResponse.success(buildingService.findAll(staffId)))
    }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ApiResponse<BuildingDetailResponse>> =
        ResponseEntity.ok(ApiResponse.success(buildingService.findById(id)))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateBuildingRequest,
    ): ResponseEntity<ApiResponse<BuildingDetailResponse>> =
        ResponseEntity.ok(ApiResponse.success(buildingService.update(id, request)))

    private fun currentStaffId(): Long =
        (SecurityContextHolder.getContext().authentication.principal as UserPrincipal).staffId
}
