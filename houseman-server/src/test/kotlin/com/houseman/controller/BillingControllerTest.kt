package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class BillingControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/settlement-master → 40개 정산 마스터")
    fun getAllSettlementMasters() {
        val token = createToken()

        mockMvc.perform(
            get("/api/settlement-master")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(40))
    }

    @Test
    @DisplayName("GET /api/settlement-master/{buildingId} → 건물별 정산 마스터")
    fun getSettlementMasterByBuilding() {
        val token = createToken()

        // building_id=1 (제이앤제이)
        mockMvc.perform(
            get("/api/settlement-master/1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.building_name").value("제이앤제이"))
            .andExpect(jsonPath("$.data.type").value("A"))
            .andExpect(jsonPath("$.data.fee_type").value("pct"))
    }

    @Test
    @DisplayName("GET /api/billing/configs → 256개 청구 설정")
    fun getAllBillingConfigs() {
        val token = createToken()

        mockMvc.perform(
            get("/api/billing/configs")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(256))
    }

    @Test
    @DisplayName("GET /api/billing/configs?building_id=1 → 제이앤제이 4개 설정")
    fun getBillingConfigsByBuilding() {
        val token = createToken()

        mockMvc.perform(
            get("/api/billing/configs")
                .param("building_id", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(4))
    }

    @Test
    @DisplayName("POST /api/billing/generate → 청구서 생성")
    fun generateBilling() {
        val token = createToken()

        mockMvc.perform(
            post("/api/billing/generate")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                        "building_id": 1,
                        "period_year": 2026,
                        "period_month": 3
                    }
                    """.trimIndent()
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray)
            .andExpect(jsonPath("$.data.length()").value(4))
    }

    @Test
    @DisplayName("PUT /api/billing/{id}/confirm → CONFIRMED 상태 변경")
    fun confirmBilling() {
        val token = createToken()

        // 먼저 청구서 생성
        val result = mockMvc.perform(
            post("/api/billing/generate")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "period_year": 2026, "period_month": 4}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val recordId = data["data"][0]["id"].asLong()

        // 확정
        mockMvc.perform(
            put("/api/billing/$recordId/confirm")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.confirmed_at").isNotEmpty)
    }

    @Test
    @DisplayName("PUT /api/billing/{id}/send → SENT 상태 변경")
    fun sendBilling() {
        val token = createToken()

        // 청구서 생성 → 확정 → 발송
        val genResult = mockMvc.perform(
            post("/api/billing/generate")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "period_year": 2026, "period_month": 5}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(genResult.response.contentAsString)
        val recordId = data["data"][0]["id"].asLong()

        mockMvc.perform(
            put("/api/billing/$recordId/confirm")
                .header("Authorization", "Bearer $token")
        ).andExpect(status().isOk)

        mockMvc.perform(
            put("/api/billing/$recordId/send")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("SENT"))
            .andExpect(jsonPath("$.data.sent_at").isNotEmpty)
    }

    @Test
    @DisplayName("GET /api/billing/status → 현황 요약")
    fun getBillingStatus() {
        val token = createToken()

        mockMvc.perform(
            get("/api/billing/status")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.total").isNumber)
            .andExpect(jsonPath("$.data.draft").isNumber)
            .andExpect(jsonPath("$.data.confirmed").isNumber)
            .andExpect(jsonPath("$.data.sent").isNumber)
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/billing"))
            .andExpect(status().isUnauthorized)
        mockMvc.perform(get("/api/settlement-master"))
            .andExpect(status().isUnauthorized)
        mockMvc.perform(get("/api/billing/configs"))
            .andExpect(status().isUnauthorized)
    }
}
