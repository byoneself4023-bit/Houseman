package com.houseman.controller

import com.houseman.domain.calendar.dto.CalendarEventResponse
import com.houseman.domain.calendar.dto.CreateCalendarEventRequest
import com.houseman.domain.calendar.dto.UpdateCalendarEventRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.CalendarService
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
class CalendarController(
    private val calendarService: CalendarService,
) {

    @GetMapping("/api/calendar")
    fun getAll(
        @RequestParam("year", required = false) year: Int?,
        @RequestParam("month", required = false) month: Int?,
    ): ResponseEntity<ApiResponse<List<CalendarEventResponse>>> =
        ResponseEntity.ok(ApiResponse.success(calendarService.findAll(year, month)))

    @GetMapping("/api/calendar/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ApiResponse<CalendarEventResponse>> =
        ResponseEntity.ok(ApiResponse.success(calendarService.findById(id)))

    @PostMapping("/api/calendar")
    fun create(
        @RequestBody request: CreateCalendarEventRequest,
    ): ResponseEntity<ApiResponse<CalendarEventResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(calendarService.create(request)))

    @PutMapping("/api/calendar/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateCalendarEventRequest,
    ): ResponseEntity<ApiResponse<CalendarEventResponse>> =
        ResponseEntity.ok(ApiResponse.success(calendarService.update(id, request)))

    @DeleteMapping("/api/calendar/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<ApiResponse<Any?>> {
        calendarService.delete(id)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
