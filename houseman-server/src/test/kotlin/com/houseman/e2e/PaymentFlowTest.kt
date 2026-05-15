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

    /**
     * C1-a: pays_for 관계 정식화 — Transaction(billingId 동반) 생성 → BillingRecord 자동 PAID 전이.
     */
    @Test
    @DisplayName("입금 transaction에 billingId 동반 → BillingRecord 자동 PAID 처리")
    fun transactionWithBillingIdAutoMarksPaid() {
        val token = createToken()

        // Step 1: 청구서 생성 (제이앤제이 2026-11)
        val genResult = mockMvc.perform(
            post("/api/billing/generate")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 1, "periodYear": 2026, "periodMonth": 11}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val records = objectMapper.readTree(genResult.response.contentAsString)["data"]
        val billingId = records[0]["id"].asLong()
        val total = records[0]["total"].asLong()

        // Step 2: 입금 transaction 생성 (billingId 동반, 전액 결제)
        mockMvc.perform(
            post("/api/transactions")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "date": "2026-11-15",
                        "buildingId": 1,
                        "type": "입금",
                        "category": "월세",
                        "amount": $total,
                        "billingId": $billingId,
                        "description": "C1-a 자동 markPaid 통합 테스트"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.type").value("입금"))

        // Step 3: 해당 BillingRecord 조회 → status=PAID + paidAmount=total
        val billingListResult = mockMvc.perform(
            get("/api/billing")
                .param("buildingId", "1")
                .param("year", "2026")
                .param("month", "11")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andReturn()

        val billingRecords = objectMapper.readTree(billingListResult.response.contentAsString)["data"]
        val target = billingRecords.find { it["id"].asLong() == billingId }
            ?: throw AssertionError("billingId=$billingId not found in list")
        assert(target["status"].asText() == "PAID") {
            "expected status PAID, got ${target["status"].asText()}"
        }
        assert(target["paidAmount"].asLong() == total) {
            "expected paidAmount=$total, got ${target["paidAmount"].asLong()}"
        }
    }
}
