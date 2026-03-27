package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class RoomControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/buildings/2/rooms → 스타빌 16개 호실")
    fun getRoomsByBuilding() {
        val token = createToken()

        mockMvc.perform(
            get("/api/buildings/2/rooms")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(16))
    }

    @Test
    @DisplayName("GET /api/rooms/{id} → 호실 상세")
    fun getRoomDetail() {
        val token = createToken()

        // rooms 테이블의 첫 번째 호실 (id=1, 제이앤제이 101호)
        mockMvc.perform(
            get("/api/rooms/1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.room_number").isNotEmpty)
            .andExpect(jsonPath("$.data.building_name").isNotEmpty)
    }

    @Test
    @DisplayName("PUT /api/rooms/{id} → 호실 수정")
    fun updateRoom() {
        val token = createToken()

        mockMvc.perform(
            put("/api/rooms/1")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"base_rent":500000}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.base_rent").value(500000))
    }
}
