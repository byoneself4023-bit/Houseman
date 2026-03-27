package com.houseman.controller

import com.houseman.domain.auth.dto.LoginRequest
import com.houseman.domain.auth.dto.LoginResponse
import com.houseman.domain.auth.dto.TokenRefreshRequest
import com.houseman.domain.auth.dto.TokenRefreshResponse
import com.houseman.domain.staff.dto.StaffResponse
import com.houseman.global.dto.ApiResponse
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.security.JwtProvider
import com.houseman.security.UserPrincipal
import com.houseman.service.StaffService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val staffService: StaffService,
    private val jwtProvider: JwtProvider,
    private val passwordEncoder: PasswordEncoder,
) {

    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
    ): ResponseEntity<ApiResponse<LoginResponse>> {
        val staff = staffService.findByPhone(request.phone)
            ?: throw BusinessException(ErrorCode.INVALID_CREDENTIALS)

        if (!passwordEncoder.matches(request.password, staff.password)) {
            throw BusinessException(ErrorCode.INVALID_CREDENTIALS)
        }

        val roles = staff.roles.toList()
        val accessToken = jwtProvider.createAccessToken(staff.id, roles)
        val refreshToken = jwtProvider.createRefreshToken(staff.id)

        return ResponseEntity.ok(
            ApiResponse.success(
                LoginResponse(
                    accessToken = accessToken,
                    refreshToken = refreshToken,
                    staff = StaffResponse.from(staff),
                )
            )
        )
    }

    @PostMapping("/refresh")
    fun refresh(
        @Valid @RequestBody request: TokenRefreshRequest,
    ): ResponseEntity<ApiResponse<TokenRefreshResponse>> {
        if (!jwtProvider.validateToken(request.refreshToken)) {
            throw BusinessException(ErrorCode.TOKEN_EXPIRED)
        }

        val staffId = jwtProvider.getStaffIdFromToken(request.refreshToken)
        val staff = staffService.findEntityById(staffId)
        val roles = staff.roles.toList()

        val accessToken = jwtProvider.createAccessToken(staff.id, roles)
        val refreshToken = jwtProvider.createRefreshToken(staff.id)

        return ResponseEntity.ok(
            ApiResponse.success(
                TokenRefreshResponse(
                    accessToken = accessToken,
                    refreshToken = refreshToken,
                )
            )
        )
    }

    @GetMapping("/me")
    fun me(): ResponseEntity<ApiResponse<StaffResponse>> {
        val principal = SecurityContextHolder.getContext().authentication.principal as UserPrincipal
        val staff = staffService.findById(principal.staffId)
        return ResponseEntity.ok(ApiResponse.success(staff))
    }
}
