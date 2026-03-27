package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class AuthControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("로그인 성공: 010-5560-8245 / 8245")
    fun loginSuccess() {
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"phone":"010-5560-8245","password":"8245"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.access_token").isNotEmpty)
            .andExpect(jsonPath("$.data.refresh_token").isNotEmpty)
            .andExpect(jsonPath("$.data.staff.name").value("박종호 대표"))
            .andExpect(jsonPath("$.data.staff.phone").value("010-5560-8245"))
    }

    @Test
    @DisplayName("로그인 실패: 잘못된 비밀번호")
    fun loginFail() {
        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"phone":"010-5560-8245","password":"wrong"}""")
        )
            .andExpect(status().isUnauthorized)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("A001"))
    }

    @Test
    @DisplayName("토큰 갱신 성공")
    fun refreshSuccess() {
        val refreshToken = createRefreshToken(1)

        mockMvc.perform(
            post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"refresh_token":"$refreshToken"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.access_token").isNotEmpty)
            .andExpect(jsonPath("$.data.refresh_token").isNotEmpty)
    }

    @Test
    @DisplayName("GET /api/auth/me - 인증된 사용자 정보")
    fun meSuccess() {
        val token = createToken(1, listOf("general"))

        mockMvc.perform(
            get("/api/auth/me")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.name").value("박종호 대표"))
    }

    @Test
    @DisplayName("토큰 없이 인증 필요 엔드포인트 접근 → 401")
    fun noTokenUnauthorized() {
        mockMvc.perform(get("/api/staff"))
            .andExpect(status().isUnauthorized)
    }
}
