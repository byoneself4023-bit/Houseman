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

class ParkingControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/parking → 빈 목록")
    fun getAllEmpty() {
        val token = createToken()

        mockMvc.perform(
            get("/api/parking")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(0))
    }

    @Test
    @DisplayName("POST /api/parking → 등록 성공")
    fun createParking() {
        val token = createToken()

        mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """{
                        "buildingId": 1,
                        "tenantName": "김철수",
                        "roomNumber": "101",
                        "carNumber": "12가 3456",
                        "carType": "현대 아반떼"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.tenantName").value("김철수"))
            .andExpect(jsonPath("$.data.carNumber").value("12가 3456"))
            .andExpect(jsonPath("$.data.carType").value("현대 아반떼"))
    }

    @Test
    @DisplayName("POST + GET → 등록 후 목록 조회")
    fun createThenGet() {
        val token = createToken()

        mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 1, "tenantName": "이영희", "roomNumber": "201", "carNumber": "34나 5678", "carType": "기아 K5"}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            get("/api/parking")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(1))
    }

    @Test
    @DisplayName("PUT /api/parking/{id} → 수정")
    fun updateParking() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 1, "tenantName": "박민수", "roomNumber": "301", "carNumber": "56다 7890", "carType": "쉐보레 말리부"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val parkingId = data["data"]["id"].asLong()

        mockMvc.perform(
            put("/api/parking/$parkingId")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"carNumber": "78라 1234", "carType": "테슬라 모델3"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.carNumber").value("78라 1234"))
            .andExpect(jsonPath("$.data.carType").value("테슬라 모델3"))
    }

    @Test
    @DisplayName("DELETE /api/parking/{id} → 삭제")
    fun deleteParking() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 1, "tenantName": "삭제대상", "roomNumber": "401", "carNumber": "00가 0000", "carType": "삭제"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val parkingId = data["data"]["id"].asLong()

        mockMvc.perform(
            delete("/api/parking/$parkingId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
    }

    @Test
    @DisplayName("GET /api/parking?building_id=1 → 건물별 필터")
    fun filterByBuilding() {
        val token = createToken()

        mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 1, "tenantName": "건물1", "roomNumber": "101", "carNumber": "11가 1111", "carType": "A"}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"buildingId": 2, "tenantName": "건물2", "roomNumber": "101", "carNumber": "22나 2222", "carType": "B"}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            get("/api/parking")
                .param("buildingId", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].tenantName").value("건물1"))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/parking"))
            .andExpect(status().isUnauthorized)
    }
}
