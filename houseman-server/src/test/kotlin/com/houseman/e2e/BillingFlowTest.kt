package com.houseman.e2e

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@DisplayName("E2E: 청구서 생성 → 확정 → 발송 플로우")
class BillingFlowTest : IntegrationTestSupport() {

    @Test
    @DisplayName("청구서 생성 → DRAFT 확인 → 확정 → 발송 → 현황 요약")
    fun billingLifecycle() {
        val token = createToken()

        // Step 1: 청구서 생성 (제이앤제이 2026-06)
        val genResult = mockMvc.perform(
            post("/api/billing/generate")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 1, "periodYear": 2026, "periodMonth": 6}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data").isArray)
            .andExpect(jsonPath("$.data.length()").value(4))
            .andReturn()

        val records = objectMapper.readTree(genResult.response.contentAsString)["data"]
        val firstRecordId = records[0]["id"].asLong()
        val secondRecordId = records[1]["id"].asLong()

        // Step 2: 목록 조회 — DRAFT 상태 확인
        mockMvc.perform(
            get("/api/billing")
                .param("buildingId", "1")
                .param("year", "2026")
                .param("month", "6")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(4))
            .andExpect(jsonPath("$.data[0].status").value("DRAFT"))

        // Step 3: 첫 번째 레코드 확정
        mockMvc.perform(
            put("/api/billing/$firstRecordId/confirm")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.data.confirmedAt").isNotEmpty)

        // Step 4: 확정된 레코드 발송
        mockMvc.perform(
            put("/api/billing/$firstRecordId/send")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("SENT"))
            .andExpect(jsonPath("$.data.sentAt").isNotEmpty)

        // Step 5: 두 번째 레코드도 확정
        mockMvc.perform(
            put("/api/billing/$secondRecordId/confirm")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("CONFIRMED"))

        // Step 6: 현황 요약 — draft 2, confirmed 1, sent 1
        mockMvc.perform(
            get("/api/billing/status")
                .param("buildingId", "1")
                .param("year", "2026")
                .param("month", "6")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.total").value(4))
            .andExpect(jsonPath("$.data.draft").value(2))
            .andExpect(jsonPath("$.data.confirmed").value(1))
            .andExpect(jsonPath("$.data.sent").value(1))
    }
}
