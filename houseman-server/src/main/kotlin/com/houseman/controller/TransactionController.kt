package com.houseman.controller

import com.houseman.domain.transaction.dto.CreateTransactionRequest
import com.houseman.domain.transaction.dto.TransactionResponse
import com.houseman.global.dto.ApiResponse
import com.houseman.service.TransactionService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/transactions")
class TransactionController(
    private val transactionService: TransactionService,
) {

    @GetMapping
    fun getAll(
        @RequestParam("buildingId", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<TransactionResponse>>> =
        ResponseEntity.ok(ApiResponse.success(transactionService.findAll(buildingId)))

    @PostMapping
    fun create(
        @Valid @RequestBody request: CreateTransactionRequest,
    ): ResponseEntity<ApiResponse<TransactionResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(transactionService.create(request)))
}
