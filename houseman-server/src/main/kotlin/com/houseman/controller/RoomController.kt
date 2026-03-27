package com.houseman.controller

import com.houseman.domain.room.dto.RoomResponse
import com.houseman.domain.room.dto.UpdateRoomRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.RoomService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

@RestController
class RoomController(
    private val roomService: RoomService,
) {

    @GetMapping("/api/buildings/{buildingId}/rooms")
    fun getByBuildingId(
        @PathVariable buildingId: Long,
    ): ResponseEntity<ApiResponse<List<RoomResponse>>> =
        ResponseEntity.ok(ApiResponse.success(roomService.findByBuildingId(buildingId)))

    @GetMapping("/api/rooms/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ApiResponse<RoomResponse>> =
        ResponseEntity.ok(ApiResponse.success(roomService.findById(id)))

    @PutMapping("/api/rooms/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateRoomRequest,
    ): ResponseEntity<ApiResponse<RoomResponse>> =
        ResponseEntity.ok(ApiResponse.success(roomService.update(id, request)))
}
