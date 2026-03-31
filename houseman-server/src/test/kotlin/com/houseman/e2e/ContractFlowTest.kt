package com.houseman.e2e

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@DisplayName("E2E: 계약 등록 플로우")
class ContractFlowTest : IntegrationTestSupport() {

    @Test
    @DisplayName("계약 등록 → 상세 조회 → 전체 목록에 포함")
    fun contractCreateAndRetrieve() {
        val token = createToken()

        // Step 1: 계약 등록
        val createResult = mockMvc.perform(
            post("/api/contracts")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "buildingId": 2,
                        "roomId": 2,
                        "name": "E2E 테스트 임차인",
                        "phone": "010-9999-8888",
                        "rent": 600000,
                        "mgmt": 60000,
                        "deposit": 6000000,
                        "type": "단기",
                        "due": "5/1",
                        "moveIn": "2026-05-01",
                        "expiry": "2026-11-01"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.name").value("E2E 테스트 임차인"))
            .andReturn()

        val data = objectMapper.readTree(createResult.response.contentAsString)
        val contractId = data["data"]["id"].asLong()

        // Step 2: 상세 조회 — 등록된 계약 확인
        mockMvc.perform(
            get("/api/contracts/$contractId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.name").value("E2E 테스트 임차인"))
            .andExpect(jsonPath("$.data.rent").value(600000))
            .andExpect(jsonPath("$.data.deposit").value(6000000))

        // Step 3: 전체 목록에 포함 확인 (488 + 1 = 489)
        mockMvc.perform(
            get("/api/contracts")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(489))
    }
}
