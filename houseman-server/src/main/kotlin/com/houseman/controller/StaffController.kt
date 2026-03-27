package com.houseman.controller

import com.houseman.domain.staff.dto.CreateStaffRequest
import com.houseman.domain.staff.dto.StaffResponse
import com.houseman.domain.staff.dto.UpdateStaffRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.StaffService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/staff")
class StaffController(
    private val staffService: StaffService,
) {

    @GetMapping
    fun getAll(): ResponseEntity<ApiResponse<List<StaffResponse>>> =
        ResponseEntity.ok(ApiResponse.success(staffService.findAll()))

    @PostMapping
    fun create(
        @Valid @RequestBody request: CreateStaffRequest,
    ): ResponseEntity<ApiResponse<StaffResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(staffService.create(request)))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateStaffRequest,
    ): ResponseEntity<ApiResponse<StaffResponse>> =
        ResponseEntity.ok(ApiResponse.success(staffService.update(id, request)))
}
