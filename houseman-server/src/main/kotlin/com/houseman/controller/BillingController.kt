package com.houseman.controller

import com.houseman.domain.billing.dto.BillingConfigResponse
import com.houseman.domain.billing.dto.BillingRecordResponse
import com.houseman.domain.billing.dto.BillingStatusResponse
import com.houseman.domain.billing.dto.GenerateBillingRequest
import com.houseman.domain.billing.dto.MarkPaidRequest
import com.houseman.domain.billing.dto.SettlementMasterResponse
import com.houseman.global.dto.ApiResponse
import com.houseman.service.BillingService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class BillingController(
    private val billingService: BillingService,
) {

    @GetMapping("/api/billing")
    fun getAll(
        @RequestParam("buildingId", required = false) buildingId: Long?,
        @RequestParam("year", required = false) year: Int?,
        @RequestParam("month", required = false) month: Int?,
    ): ResponseEntity<ApiResponse<List<BillingRecordResponse>>> =
        ResponseEntity.ok(ApiResponse.success(billingService.findAllRecords(buildingId, year, month)))

    @PostMapping("/api/billing/generate")
    fun generate(
        @Valid @RequestBody request: GenerateBillingRequest,
    ): ResponseEntity<ApiResponse<List<BillingRecordResponse>>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(billingService.generate(request)))

    @PutMapping("/api/billing/{id}/confirm")
    fun confirm(@PathVariable id: Long): ResponseEntity<ApiResponse<BillingRecordResponse>> =
        ResponseEntity.ok(ApiResponse.success(billingService.confirm(id)))

    @PutMapping("/api/billing/{id}/send")
    fun send(@PathVariable id: Long): ResponseEntity<ApiResponse<BillingRecordResponse>> =
        ResponseEntity.ok(ApiResponse.success(billingService.send(id)))

    // C1-a: pays_for 관계 — 단독 결제 처리 (transaction 없이 수동 paid).
    @PatchMapping("/api/billing/{id}/paid")
    fun markPaid(
        @PathVariable id: Long,
        @Valid @RequestBody request: MarkPaidRequest,
    ): ResponseEntity<ApiResponse<BillingRecordResponse>> =
        ResponseEntity.ok(ApiResponse.success(billingService.markPaid(id, request.paidAmount)))

    @GetMapping("/api/billing/status")
    fun getStatus(
        @RequestParam("buildingId", required = false) buildingId: Long?,
        @RequestParam("year", required = false) year: Int?,
        @RequestParam("month", required = false) month: Int?,
    ): ResponseEntity<ApiResponse<BillingStatusResponse>> =
        ResponseEntity.ok(ApiResponse.success(billingService.getStatus(buildingId, year, month)))

    @GetMapping("/api/billing/configs")
    fun getConfigs(
        @RequestParam("buildingId", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<BillingConfigResponse>>> =
        ResponseEntity.ok(ApiResponse.success(billingService.findAllConfigs(buildingId)))

    @GetMapping("/api/billing/configs/{id}")
    fun getConfigById(@PathVariable id: Long): ResponseEntity<ApiResponse<BillingConfigResponse>> =
        ResponseEntity.ok(ApiResponse.success(billingService.findConfigById(id)))

    @GetMapping("/api/settlement-master")
    fun getSettlementMasters(): ResponseEntity<ApiResponse<List<SettlementMasterResponse>>> =
        ResponseEntity.ok(ApiResponse.success(billingService.findAllSettlementMasters()))

    @GetMapping("/api/settlement-master/{buildingId}")
    fun getSettlementMasterByBuildingId(
        @PathVariable buildingId: Long,
    ): ResponseEntity<ApiResponse<SettlementMasterResponse>> =
        ResponseEntity.ok(ApiResponse.success(billingService.findSettlementMasterByBuildingId(buildingId)))
}
