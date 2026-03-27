package com.houseman.controller

import com.houseman.domain.contract.dto.ContractResponse
import com.houseman.domain.contract.dto.CreateContractRequest
import com.houseman.domain.contract.dto.MoveOutRequest
import com.houseman.domain.contract.dto.PastContractGroupResponse
import com.houseman.domain.contract.dto.PastContractResponse
import com.houseman.domain.contract.dto.UpdateContractRequest
import com.houseman.global.dto.ApiResponse
import com.houseman.service.ContractService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/contracts")
class ContractController(
    private val contractService: ContractService,
) {

    @GetMapping
    fun getAll(
        @RequestParam("building_id", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<ContractResponse>>> =
        ResponseEntity.ok(ApiResponse.success(contractService.findAll(buildingId)))

    @GetMapping("/expiring")
    fun getExpiring(): ResponseEntity<ApiResponse<List<ContractResponse>>> =
        ResponseEntity.ok(ApiResponse.success(contractService.findExpiring()))

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ApiResponse<ContractResponse>> =
        ResponseEntity.ok(ApiResponse.success(contractService.findById(id)))

    @PostMapping
    fun create(
        @Valid @RequestBody request: CreateContractRequest,
    ): ResponseEntity<ApiResponse<ContractResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(contractService.create(request)))

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateContractRequest,
    ): ResponseEntity<ApiResponse<ContractResponse>> =
        ResponseEntity.ok(ApiResponse.success(contractService.update(id, request)))

    @PostMapping("/{id}/move-out")
    fun moveOut(
        @PathVariable id: Long,
        @Valid @RequestBody request: MoveOutRequest,
    ): ResponseEntity<ApiResponse<PastContractResponse>> =
        ResponseEntity.ok(ApiResponse.success(contractService.moveOut(id, request)))

    @GetMapping("/past")
    fun getAllPastContracts(): ResponseEntity<ApiResponse<List<PastContractGroupResponse>>> =
        ResponseEntity.ok(ApiResponse.success(contractService.findAllPastContracts()))

    @GetMapping("/past/{id}")
    fun getPastContractById(
        @PathVariable id: Long,
    ): ResponseEntity<ApiResponse<PastContractResponse>> =
        ResponseEntity.ok(ApiResponse.success(contractService.findPastContractById(id)))
}
