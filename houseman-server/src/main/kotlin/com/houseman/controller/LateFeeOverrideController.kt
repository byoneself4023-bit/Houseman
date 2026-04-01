package com.houseman.controller

import com.houseman.domain.latefee.dto.CreateLateFeeOverrideRequest
import com.houseman.domain.latefee.dto.LateFeeOverrideResponse
import com.houseman.domain.latefee.dto.UpdateLateFeeOverrideRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.LateFeeOverrideService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class LateFeeOverrideController(
    private val service: LateFeeOverrideService,
) {

    @GetMapping("/api/late-fee-overrides")
    fun getAll(
        @RequestParam("buildingId", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<LateFeeOverrideResponse>>> =
        ResponseEntity.ok(ApiResponse.success(service.findAll(buildingId)))

    @PostMapping("/api/late-fee-overrides")
    fun create(
        @RequestBody request: CreateLateFeeOverrideRequest,
    ): ResponseEntity<ApiResponse<LateFeeOverrideResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(service.create(request)))

    @PutMapping("/api/late-fee-overrides/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateLateFeeOverrideRequest,
    ): ResponseEntity<ApiResponse<LateFeeOverrideResponse>> =
        ResponseEntity.ok(ApiResponse.success(service.update(id, request)))

    @DeleteMapping("/api/late-fee-overrides/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<ApiResponse<Any?>> {
        service.delete(id)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
