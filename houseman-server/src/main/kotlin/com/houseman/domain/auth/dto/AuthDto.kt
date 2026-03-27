package com.houseman.domain.auth.dto

import com.houseman.domain.staff.dto.StaffResponse
import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:NotBlank val phone: String,
    @field:NotBlank val password: String,
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val staff: StaffResponse,
)

data class TokenRefreshRequest(
    @field:NotBlank val refreshToken: String,
)

data class TokenRefreshResponse(
    val accessToken: String,
    val refreshToken: String,
)
