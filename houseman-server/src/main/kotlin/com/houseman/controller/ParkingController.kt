package com.houseman.controller

import com.houseman.domain.parking.dto.CreateParkingInfoRequest
import com.houseman.domain.parking.dto.ParkingInfoResponse
import com.houseman.domain.parking.dto.UpdateParkingInfoRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.ParkingService
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
class ParkingController(
    private val parkingService: ParkingService,
) {

    @GetMapping("/api/parking")
    fun getAll(
        @RequestParam("buildingId", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<ParkingInfoResponse>>> =
        ResponseEntity.ok(ApiResponse.success(parkingService.findAll(buildingId)))

    @PostMapping("/api/parking")
    fun create(
        @RequestBody request: CreateParkingInfoRequest,
    ): ResponseEntity<ApiResponse<ParkingInfoResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(parkingService.create(request)))

    @PutMapping("/api/parking/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateParkingInfoRequest,
    ): ResponseEntity<ApiResponse<ParkingInfoResponse>> =
        ResponseEntity.ok(ApiResponse.success(parkingService.update(id, request)))

    @DeleteMapping("/api/parking/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<ApiResponse<Any?>> {
        parkingService.delete(id)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
