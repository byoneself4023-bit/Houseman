package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class TransactionControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/transactions → 7개 거래 내역")
    fun getAllTransactions() {
        val token = createToken()

        mockMvc.perform(
            get("/api/transactions")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(7))
    }

    @Test
    @DisplayName("GET /api/transactions?building_id → 건물별 필터")
    fun getTransactionsByBuilding() {
        val token = createToken()

        // building_id=8 (스타빌) — recentTx에서 스타빌 거래 확인
        mockMvc.perform(
            get("/api/transactions")
                .param("buildingId", "8")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray)
    }

    @Test
    @DisplayName("POST /api/transactions → 거래 등록")
    fun createTransaction() {
        val token = createToken()

        mockMvc.perform(
            post("/api/transactions")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                        "date": "2026-03-26",
                        "buildingId": 1,
                        "type": "입금",
                        "category": "월세",
                        "amount": 500000,
                        "description": "3월 월세"
                    }
                    """.trimIndent()
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.type").value("입금"))
            .andExpect(jsonPath("$.data.category").value("월세"))
            .andExpect(jsonPath("$.data.amount").value(500000))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/transactions"))
            .andExpect(status().isUnauthorized)
    }
}
