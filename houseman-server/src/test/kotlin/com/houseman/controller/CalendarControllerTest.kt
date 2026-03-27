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

class CalendarControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/calendar → 14개 이벤트")
    fun getAllEvents() {
        val token = createToken()

        mockMvc.perform(
            get("/api/calendar")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(14))
    }

    @Test
    @DisplayName("GET /api/calendar?year=2026&month=2 → 2월 이벤트")
    fun getEventsByMonth() {
        val token = createToken()

        mockMvc.perform(
            get("/api/calendar")
                .param("year", "2026")
                .param("month", "2")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(8))
    }

    @Test
    @DisplayName("POST /api/calendar → 건물/호실 있는 계약 이벤트 등록")
    fun createEventWithBuilding() {
        val token = createToken()

        mockMvc.perform(
            post("/api/calendar")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"date": "2026-04-01", "type": "계약", "building_id": 1, "room_id": 1, "name": "테스트", "color": "#3B82F6"}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.type").value("계약"))
            .andExpect(jsonPath("$.data.building_id").isNumber)
            .andExpect(jsonPath("$.data.name").value("테스트"))
    }

    @Test
    @DisplayName("POST /api/calendar → 휴무 이벤트 등록 (건물/호실 없음)")
    fun createHolidayEvent() {
        val token = createToken()

        mockMvc.perform(
            post("/api/calendar")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"date": "2026-04-05", "type": "휴무", "name": "김테스트", "color": "#8B5CF6"}""")
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.type").value("휴무"))
            .andExpect(jsonPath("$.data.building_id").doesNotExist())
            .andExpect(jsonPath("$.data.room_id").doesNotExist())
    }

    @Test
    @DisplayName("PUT /api/calendar/{id} → 이벤트 수정")
    fun updateEvent() {
        val token = createToken()

        // 먼저 이벤트 생성
        val result = mockMvc.perform(
            post("/api/calendar")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"date": "2026-04-10", "type": "휴무", "name": "수정전"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val eventId = data["data"]["id"].asLong()

        mockMvc.perform(
            put("/api/calendar/$eventId")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name": "수정후"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.name").value("수정후"))
    }

    @Test
    @DisplayName("DELETE /api/calendar/{id} → 이벤트 삭제")
    fun deleteEvent() {
        val token = createToken()

        val result = mockMvc.perform(
            post("/api/calendar")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"date": "2026-04-15", "type": "휴무", "name": "삭제대상"}""")
        )
            .andExpect(status().isCreated)
            .andReturn()

        val data = objectMapper.readTree(result.response.contentAsString)
        val eventId = data["data"]["id"].asLong()

        mockMvc.perform(
            delete("/api/calendar/$eventId")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/calendar"))
            .andExpect(status().isUnauthorized)
    }
}
