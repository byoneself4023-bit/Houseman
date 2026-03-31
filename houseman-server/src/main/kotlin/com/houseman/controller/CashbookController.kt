package com.houseman.controller

import com.houseman.domain.cashbook.dto.CashbookEntryResponse
import com.houseman.domain.cashbook.dto.CreateCashbookEntryRequest
import com.houseman.domain.cashbook.dto.UpdateCashbookEntryRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.CashbookService
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
class CashbookController(
    private val cashbookService: CashbookService,
) {

    @GetMapping("/api/cashbook")
    fun getAll(
        @RequestParam("buildingId", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<CashbookEntryResponse>>> =
        ResponseEntity.ok(ApiResponse.success(cashbookService.findAll(buildingId)))

    @PostMapping("/api/cashbook")
    fun create(
        @RequestBody request: CreateCashbookEntryRequest,
    ): ResponseEntity<ApiResponse<CashbookEntryResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(cashbookService.create(request)))

    @PutMapping("/api/cashbook/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateCashbookEntryRequest,
    ): ResponseEntity<ApiResponse<CashbookEntryResponse>> =
        ResponseEntity.ok(ApiResponse.success(cashbookService.update(id, request)))

    @DeleteMapping("/api/cashbook/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<ApiResponse<Any?>> {
        cashbookService.delete(id)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
