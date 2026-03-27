package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class SettlementControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/settlements/expenses → 13개 비용")
    fun getAllExpenses() {
        val token = createToken()

        mockMvc.perform(
            get("/api/settlements/expenses")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(13))
    }

    @Test
    @DisplayName("GET /api/settlements/expenses?building_id=2&month=2026-03 → 스타빌 3월 4건")
    fun getExpensesByBuildingAndMonth() {
        val token = createToken()

        mockMvc.perform(
            get("/api/settlements/expenses")
                .param("building_id", "2")
                .param("month", "2026-03")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(4))
    }

    @Test
    @DisplayName("POST /api/settlements/expenses → 비용 등록")
    fun createExpense() {
        val token = createToken()

        mockMvc.perform(
            post("/api/settlements/expenses")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 2, "month": "2026-04", "category": "repair", "description": "테스트 수선비", "amount": 100000, "date": "2026-04-01"}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.category").value("repair"))
            .andExpect(jsonPath("$.data.amount").value(100000))
    }

    @Test
    @DisplayName("DELETE /api/settlements/expenses/{id} → 비용 삭제")
    fun deleteExpense() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/settlements/expenses")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 2, "month": "2026-04", "category": "other", "description": "삭제대상", "amount": 50000, "date": "2026-04-15"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val expenseId = data["data"]["id"].asLong()

        mockMvc.perform(
            delete("/api/settlements/expenses/$expenseId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
    }

    @Test
    @DisplayName("POST /api/settlements/calculate → 스타빌 2026-03 정산 계산")
    fun calculateSettlement() {
        val token = createToken()

        mockMvc.perform(
            post("/api/settlements/calculate")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 2, "year": 2026, "month": 3}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.building_name").value("스타빌"))
            .andExpect(jsonPath("$.data.period.start").value("2026-03-01"))
            .andExpect(jsonPath("$.data.period.end").value("2026-03-31"))
            .andExpect(jsonPath("$.data.config.fee_type").value("pct"))
            .andExpect(jsonPath("$.data.room_settlements").isArray)
            .andExpect(jsonPath("$.data.deductions").isArray)
            .andExpect(jsonPath("$.data.deductions.length()").value(4))
            .andExpect(jsonPath("$.data.summary.total_rent").isNumber)
            .andExpect(jsonPath("$.data.summary.total_fee").isNumber)
            .andExpect(jsonPath("$.data.summary.final_amount").isNumber)
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/settlements/expenses"))
            .andExpect(status().isUnauthorized)
        mockMvc.perform(post("/api/settlements/calculate"))
            .andExpect(status().isUnauthorized)
    }
}
