package com.houseman.controller

import com.houseman.domain.meter.dto.BulkCreateMeterReadingRequest
import com.houseman.domain.meter.dto.MeterReadingResponse
import com.houseman.global.dto.ApiResponse
import com.houseman.service.MeterReadingService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class MeterReadingController(
    private val service: MeterReadingService,
) {

    @GetMapping("/api/meter-readings")
    fun getByBillingMonth(
        @RequestParam("billingMonth") billingMonth: String,
    ): ResponseEntity<ApiResponse<List<MeterReadingResponse>>> =
        ResponseEntity.ok(ApiResponse.success(service.findByBillingMonth(billingMonth)))

    @PostMapping("/api/meter-readings")
    fun createBulk(
        @RequestBody request: BulkCreateMeterReadingRequest,
    ): ResponseEntity<ApiResponse<List<MeterReadingResponse>>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(service.createBulk(request.readings)))
}
