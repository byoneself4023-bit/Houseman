package com.houseman.e2e

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@DisplayName("E2E: 입금/지출 등록 플로우")
class PaymentFlowTest : IntegrationTestSupport() {

    @Test
    @DisplayName("입금 등록 → 지출 등록 → 건물별 거래 목록 확인")
    fun paymentAndExpense() {
        val token = createToken()

        // 기존 건물1(제이앤제이) 거래 수 확인
        val beforeResult = mockMvc.perform(
            get("/api/transactions")
                .param("buildingId", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andReturn()

        val beforeCount = objectMapper.readTree(beforeResult.response.contentAsString)["data"].size()

        // Step 1: 입금 등록
        mockMvc.perform(
            post("/api/transactions")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "date": "2026-03-27",
                        "buildingId": 1,
                        "type": "입금",
                        "category": "월세",
                        "amount": 500000,
                        "description": "E2E 월세 입금"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.type").value("입금"))
            .andExpect(jsonPath("$.data.amount").value(500000))

        // Step 2: 지출 등록
        mockMvc.perform(
            post("/api/transactions")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "date": "2026-03-27",
                        "buildingId": 1,
                        "type": "지출",
                        "category": "수리비",
                        "amount": 200000,
                        "description": "E2E 수리비 지출"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.type").value("지출"))
            .andExpect(jsonPath("$.data.amount").value(200000))

        // Step 3: 건물별 거래 목록 — 2건 추가됨
        mockMvc.perform(
            get("/api/transactions")
                .param("buildingId", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(beforeCount + 2))
    }
}
