package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class BuildingControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/buildings → 총괄(assignedBuildings 비어있음) = 46개 건물")
    fun getAllBuildings() {
        // staffId=1 (구경환)은 assignedBuildings가 비어있으므로 총괄 → 전체 건물
        // V2: 21개 + V3: 21개 + V6: 4개(대치칼텍,더힐하우스,이브릿지,제이드하우스) = 46개
        val token = createToken(1, listOf("general"))

        mockMvc.perform(
            get("/api/buildings")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(46))
    }

    @Test
    @DisplayName("GET /api/buildings/1 → 제이앤제이 상세")
    fun getBuildingDetail() {
        val token = createToken()

        mockMvc.perform(
            get("/api/buildings/1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("제이앤제이"))
            .andExpect(jsonPath("$.data.floors").isNotEmpty)
    }

    @Test
    @DisplayName("PUT /api/buildings/1 → 건물 수정")
    fun updateBuilding() {
        val token = createToken()

        mockMvc.perform(
            put("/api/buildings/1")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"parkingTotal":10}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.parkingTotal").value(10))
    }
}
