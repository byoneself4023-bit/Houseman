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

class ContractControllerTest : IntegrationTestSupport() {

    @Test
    @DisplayName("GET /api/contracts → 488개 계약 목록")
    fun getAllContracts() {
        val token = createToken()

        mockMvc.perform(
            get("/api/contracts")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(488))
    }

    @Test
    @DisplayName("GET /api/contracts?building_id=1 → 제이앤제이 계약")
    fun getContractsByBuilding() {
        val token = createToken()

        mockMvc.perform(
            get("/api/contracts")
                .param("building_id", "1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(4))
            .andExpect(jsonPath("$.data[0].building_name").value("제이앤제이"))
    }

    @Test
    @DisplayName("GET /api/contracts/{id} → 계약 상세 (buildingName, roomNumber 포함)")
    fun getContractDetail() {
        val token = createToken()

        mockMvc.perform(
            get("/api/contracts/1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.id").value(1))
            .andExpect(jsonPath("$.data.building_name").isNotEmpty)
            .andExpect(jsonPath("$.data.room_number").isNotEmpty)
            .andExpect(jsonPath("$.data.name").isNotEmpty)
    }

    @Test
    @DisplayName("GET /api/contracts/expiring → 만료 임박 계약")
    fun getExpiringContracts() {
        val token = createToken()

        mockMvc.perform(
            get("/api/contracts/expiring")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray)
    }

    @Test
    @DisplayName("POST /api/contracts → 계약 등록")
    fun createContract() {
        val token = createToken()

        mockMvc.perform(
            post("/api/contracts")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                        "building_id": 1,
                        "room_id": 1,
                        "name": "테스트 임차인",
                        "phone": "010-1234-5678",
                        "rent": 500000,
                        "mgmt": 50000,
                        "deposit": 5000000,
                        "type": "단기",
                        "due": "3/1",
                        "move_in": "2026-04-01",
                        "expiry": "2026-10-01"
                    }
                    """.trimIndent()
                )
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("테스트 임차인"))
            .andExpect(jsonPath("$.data.rent").value(500000))
    }

    @Test
    @DisplayName("PUT /api/contracts/{id} → 계약 수정")
    fun updateContract() {
        val token = createToken()

        mockMvc.perform(
            put("/api/contracts/1")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"rent": 800000, "status": "연체"}""")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.rent").value(800000))
            .andExpect(jsonPath("$.data.status").value("연체"))
    }

    @Test
    @DisplayName("POST /api/contracts/{id}/move-out → 퇴실 처리 → past_contracts 이동")
    fun moveOutContract() {
        val token = createToken()

        mockMvc.perform(
            post("/api/contracts/1/move-out")
                .header("Authorization", "Bearer $token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                        "move_out_date": "2026-03-26",
                        "reason": "만기퇴실",
                        "clean_fee": 100000
                    }
                    """.trimIndent()
                )
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").isNotEmpty)
            .andExpect(jsonPath("$.data.reason").value("만기퇴실"))
            .andExpect(jsonPath("$.data.settlement").value("정산완료"))

        // 퇴실 후 해당 계약이 삭제되었는지 확인
        mockMvc.perform(
            get("/api/contracts/1")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isNotFound)
    }

    @Test
    @DisplayName("GET /api/contracts/past → 퇴실 기록 그룹 목록")
    fun getAllPastContracts() {
        val token = createToken()

        mockMvc.perform(
            get("/api/contracts/past")
                .header("Authorization", "Bearer $token")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(11))
    }

    @Test
    @DisplayName("토큰 없이 접근 → 401")
    fun unauthorizedAccess() {
        mockMvc.perform(get("/api/contracts"))
            .andExpect(status().isUnauthorized)
    }
}
