package com.houseman.e2e

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@DisplayName("E2E: 퇴실 처리 플로우")
class MoveOutFlowTest : IntegrationTestSupport() {

    @Test
    @DisplayName("계약 등록 → 퇴실 → PastContract 이동 → 공실 등록")
    fun moveOutAndVacancy() {
        val token = createToken()

        // Step 1: 새 계약 등록 (퇴실 테스트 전용)
        val createResult = mockMvc.perform(
            post("/api/contracts")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "building_id": 2,
                        "room_id": 3,
                        "name": "퇴실테스트 임차인",
                        "phone": "010-7777-6666",
                        "rent": 400000,
                        "mgmt": 40000,
                        "deposit": 4000000,
                        "type": "단기",
                        "due": "1/1",
                        "move_in": "2026-01-01",
                        "expiry": "2026-06-30"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(createResult.response.contentAsString)
        val contractId = data["data"]["id"].asLong()

        // Step 2: 퇴실 처리
        mockMvc.perform(
            post("/api/contracts/$contractId/move-out")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "move_out_date": "2026-03-27",
                        "reason": "만기퇴실",
                        "clean_fee": 100000
                    }"""
                )
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.name").value("퇴실테스트 임차인"))
            .andExpect(jsonPath("$.data.reason").value("만기퇴실"))
            .andExpect(jsonPath("$.data.settlement").value("정산완료"))

        // Step 3: 원본 계약 삭제 확인
        mockMvc.perform(
            get("/api/contracts/$contractId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isNotFound)

        // Step 4: PastContract에 포함 확인
        mockMvc.perform(
            get("/api/contracts/past")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        // Step 5: 공실 등록
        mockMvc.perform(
            post("/api/vacancies")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 2, "room_id": 3, "type": "단기", "status": "점검/청소중"}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.status").value("점검/청소중"))

        // Step 6: 공실 목록에 포함 확인 (기존 1건 + 신규 1건 = 2건)
        mockMvc.perform(
            get("/api/vacancies")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(2))
    }
}
