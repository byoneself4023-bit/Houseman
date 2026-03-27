package com.houseman.controller

import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class StaffControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/staff → 9명")
    fun getAllStaff() {
        val token = createToken()

        mockMvc.perform(
            get("/api/staff")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(9))
    }

    @Test
    @DisplayName("POST /api/staff → 새 직원 생성")
    fun createStaff() {
        val token = createToken()

        mockMvc.perform(
            post("/api/staff")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                        "name": "테스트직원",
                        "phone": "010-9999-9999",
                        "password": "1234",
                        "roles": ["general"]
                    }
                    """.trimIndent()
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("테스트직원"))
            .andExpect(jsonPath("$.data.phone").value("010-9999-9999"))
            .andExpect(jsonPath("$.data.roles[0]").value("general"))
    }

    @Test
    @DisplayName("PUT /api/staff/{id} → 직원 수정")
    fun updateStaff() {
        val token = createToken()

        mockMvc.perform(
            put("/api/staff/1")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":"구경환수정"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("구경환수정"))
    }
}
