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
                        "building_id": 1,
                        "tenant_name": "김철수",
                        "room_number": "101",
                        "car_number": "12가 3456",
                        "car_type": "현대 아반떼"
                    }"""
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.tenant_name").value("김철수"))
            .andExpect(jsonPath("$.data.car_number").value("12가 3456"))
            .andExpect(jsonPath("$.data.car_type").value("현대 아반떼"))
    }

    @Test
    @DisplayName("POST + GET → 등록 후 목록 조회")
    fun createThenGet() {
        val token = createToken()

        mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "tenant_name": "이영희", "room_number": "201", "car_number": "34나 5678", "car_type": "기아 K5"}""")
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
                .content("""{"building_id": 1, "tenant_name": "박민수", "room_number": "301", "car_number": "56다 7890", "car_type": "쉐보레 말리부"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val parkingId = data["data"]["id"].asLong()

        mockMvc.perform(
            put("/api/parking/$parkingId")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"car_number": "78라 1234", "car_type": "테슬라 모델3"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.car_number").value("78라 1234"))
            .andExpect(jsonPath("$.data.car_type").value("테슬라 모델3"))
    }

    @Test
    @DisplayName("DELETE /api/parking/{id} → 삭제")
    fun deleteParking() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 1, "tenant_name": "삭제대상", "room_number": "401", "car_number": "00가 0000", "car_type": "삭제"}""")
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
                .content("""{"building_id": 1, "tenant_name": "건물1", "room_number": "101", "car_number": "11가 1111", "car_type": "A"}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            post("/api/parking")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"building_id": 2, "tenant_name": "건물2", "room_number": "101", "car_number": "22나 2222", "car_type": "B"}""")
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            get("/api/parking")
                .param("building_id", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].tenant_name").value("건물1"))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/parking"))
            .andExpect(status().isUnauthorized)
    }
}
