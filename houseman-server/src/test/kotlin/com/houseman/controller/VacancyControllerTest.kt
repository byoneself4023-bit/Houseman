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

class VacancyControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/vacancies → 1개 공실")
    fun getAllVacancies() {
        val token = createToken()

        mockMvc.perform(
            get("/api/vacancies")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].status").value("점검/청소중"))
            .andExpect(jsonPath("$.data[0].buildingName").value("제이앤제이"))
    }

    @Test
    @DisplayName("POST /api/vacancies → 공실 등록")
    fun createVacancy() {
        val token = createToken()

        // building_id=2 (스타빌), room_id는 스타빌의 호실 중 하나
        mockMvc.perform(
            post("/api/vacancies")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 2, "roomId": 2, "type": "단기", "deposit": 500, "rent": 80, "status": "홍보중"}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.type").value("단기"))
            .andExpect(jsonPath("$.data.status").value("홍보중"))
    }

    @Test
    @DisplayName("PUT /api/vacancies/{id} → 상태 변경")
    fun updateVacancy() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/vacancies")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 2, "roomId": 3, "status": "점검/청소중"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val vacancyId = data["data"]["id"].asLong()

        mockMvc.perform(
            put("/api/vacancies/$vacancyId")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"status": "홍보중"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.status").value("홍보중"))
    }

    @Test
    @DisplayName("DELETE /api/vacancies/{id} → 공실 삭제")
    fun deleteVacancy() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/vacancies")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 2, "roomId": 4, "status": "점검/청소중"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val vacancyId = data["data"]["id"].asLong()

        mockMvc.perform(
            delete("/api/vacancies/$vacancyId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/vacancies"))
            .andExpect(status().isUnauthorized)
    }
}
