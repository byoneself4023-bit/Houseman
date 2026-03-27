package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class CashbookControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/cashbook → 빈 목록")
    fun getAllEmpty() {
        val token = createToken()

        mockMvc.perform(
            get("/api/cashbook")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(0))
    }

    @Test
    @DisplayName("POST /api/cashbook → 등록 성공")
    fun createEntry() {
        val token = createToken()

        mockMvc.perform(
            post("/api/cashbook")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "building_id": 1,
                        "date": "2026-03-27",
                        "type": "manual",
                        "direction": "출금",
                        "description": "월급 송금",
                        "amount": 2000000,
                        "account": "신한은행 987-654-321",
                        "account_holder": "김철수"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.description").value("월급 송금"))
            .andExpect(jsonPath("$.data.amount").value(2000000))
            .andExpect(jsonPath("$.data.direction").value("출금"))
            .andExpect(jsonPath("$.data.status").value("대기"))
    }

    @Test
    @DisplayName("POST + GET → 등록 후 목록 조회")
    fun createThenGet() {
        val token = createToken()

        mockMvc.perform(
            post("/api/cashbook")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "date": "2026-03-27", "description": "테스트", "amount": 100000}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            get("/api/cashbook")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(1))
    }

    @Test
    @DisplayName("PUT /api/cashbook/{id} → 상태 변경 (대기→완료)")
    fun updateStatus() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/cashbook")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "date": "2026-03-27", "description": "정산", "amount": 500000}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val entryId = data["data"]["id"].asLong()

        mockMvc.perform(
            put("/api/cashbook/$entryId")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"status": "완료"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("완료"))
    }

    @Test
    @DisplayName("DELETE /api/cashbook/{id} → 삭제")
    fun deleteEntry() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/cashbook")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "date": "2026-03-27", "description": "삭제 테스트", "amount": 10000}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val entryId = data["data"]["id"].asLong()

        mockMvc.perform(
            delete("/api/cashbook/$entryId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
    }

    @Test
    @DisplayName("GET /api/cashbook?building_id=1 → 건물별 필터")
    fun filterByBuilding() {
        val token = createToken()

        mockMvc.perform(
            post("/api/cashbook")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "date": "2026-03-27", "description": "건물1", "amount": 100000}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            post("/api/cashbook")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 2, "date": "2026-03-27", "description": "건물2", "amount": 200000}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            get("/api/cashbook")
                .param("building_id", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].description").value("건물1"))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/cashbook"))
            .andExpect(status().isUnauthorized)
    }
}
