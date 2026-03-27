package com.houseman.controller

import com.houseman.domain.settlement.dto.CreateSettlementExpenseRequest
import com.houseman.domain.settlement.dto.SettlementCalculateRequest
import com.houseman.domain.settlement.dto.SettlementCalculationResponse
import com.houseman.domain.settlement.dto.SettlementExpenseResponse
import com.houseman.domain.settlement.dto.UpdateSettlementExpenseRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.OwnerSettlementService
import com.houseman.service.SettlementExpenseService
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
class SettlementController(
    private val ownerSettlementService: OwnerSettlementService,
    private val settlementExpenseService: SettlementExpenseService,
) {

    @PostMapping("/api/settlements/calculate")
    fun calculate(
        @RequestBody request: SettlementCalculateRequest,
    ): ResponseEntity<ApiResponse<SettlementCalculationResponse>> =
        ResponseEntity.ok(ApiResponse.success(ownerSettlementService.calculate(request)))

    @GetMapping("/api/settlements/expenses")
    fun getExpenses(
        @RequestParam("building_id", required = false) buildingId: Long?,
        @RequestParam("month", required = false) month: String?,
    ): ResponseEntity<ApiResponse<List<SettlementExpenseResponse>>> =
        ResponseEntity.ok(ApiResponse.success(settlementExpenseService.findAll(buildingId, month)))

    @PostMapping("/api/settlements/expenses")
    fun createExpense(
        @RequestBody request: CreateSettlementExpenseRequest,
    ): ResponseEntity<ApiResponse<SettlementExpenseResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(settlementExpenseService.create(request)))

    @PutMapping("/api/settlements/expenses/{id}")
    fun updateExpense(
        @PathVariable id: Long,
        @RequestBody request: UpdateSettlementExpenseRequest,
    ): ResponseEntity<ApiResponse<SettlementExpenseResponse>> =
        ResponseEntity.ok(ApiResponse.success(settlementExpenseService.update(id, request)))

    @DeleteMapping("/api/settlements/expenses/{id}")
    fun deleteExpense(@PathVariable id: Long): ResponseEntity<ApiResponse<Any?>> {
        settlementExpenseService.delete(id)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
