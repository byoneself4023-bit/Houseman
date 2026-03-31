package com.houseman.controller

import com.houseman.domain.vacancy.dto.CreateVacancyRequest
import com.houseman.domain.vacancy.dto.UpdateVacancyRequest
import com.houseman.domain.vacancy.dto.VacancyResponse
import com.houseman.global.dto.ApiResponse
import com.houseman.service.VacancyService
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
class VacancyController(
    private val vacancyService: VacancyService,
) {

    @GetMapping("/api/vacancies")
    fun getAll(
        @RequestParam("buildingId", required = false) buildingId: Long?,
    ): ResponseEntity<ApiResponse<List<VacancyResponse>>> =
        ResponseEntity.ok(ApiResponse.success(vacancyService.findAll(buildingId)))

    @GetMapping("/api/vacancies/{id}")
    fun getById(@PathVariable id: Long): ResponseEntity<ApiResponse<VacancyResponse>> =
        ResponseEntity.ok(ApiResponse.success(vacancyService.findById(id)))

    @PostMapping("/api/vacancies")
    fun create(
        @RequestBody request: CreateVacancyRequest,
    ): ResponseEntity<ApiResponse<VacancyResponse>> =
        ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(vacancyService.create(request)))

    @PutMapping("/api/vacancies/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: UpdateVacancyRequest,
    ): ResponseEntity<ApiResponse<VacancyResponse>> =
        ResponseEntity.ok(ApiResponse.success(vacancyService.update(id, request)))

    @DeleteMapping("/api/vacancies/{id}")
    fun delete(@PathVariable id: Long): ResponseEntity<ApiResponse<Any?>> {
        vacancyService.delete(id)
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
