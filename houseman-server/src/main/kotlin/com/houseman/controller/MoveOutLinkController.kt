package com.houseman.controller

import com.houseman.global.dto.ApiResponse
import com.houseman.service.CalendarService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/public/move-out-link")
class MoveOutLinkController(
    private val calendarService: CalendarService,
) {

    data class MoveOutLinkResponse(
        val id: Long,
        val eventDate: String,
        val buildingName: String?,
        val roomNumber: String?,
        val moveOutLinkCompleted: Boolean,
    )

    data class MoveOutLinkSubmitRequest(
        val doorPassword: String,
        val refundBank: String,
        val refundAccount: String,
        val refundHolder: String,
    )

    @GetMapping("/{eventId}")
    fun get(@PathVariable eventId: Long): ResponseEntity<ApiResponse<MoveOutLinkResponse>> {
        val event = calendarService.findById(eventId)
        return ResponseEntity.ok(
            ApiResponse.success(
                MoveOutLinkResponse(
                    id = event.id,
                    eventDate = event.date.toString(),
                    buildingName = event.buildingName,
                    roomNumber = event.roomNumber,
                    moveOutLinkCompleted = false,
                )
            )
        )
    }

    @PutMapping("/{eventId}")
    fun submit(
        @PathVariable eventId: Long,
        @RequestBody request: MoveOutLinkSubmitRequest,
    ): ResponseEntity<ApiResponse<Any?>> {
        calendarService.findById(eventId)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
