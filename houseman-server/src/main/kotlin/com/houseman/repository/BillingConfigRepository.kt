package com.houseman.repository

import com.houseman.domain.billing.BillingConfig
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface BillingConfigRepository : JpaRepository<BillingConfig, Long> {
    @Query("SELECT bc FROM BillingConfig bc JOIN FETCH bc.room WHERE bc.building.id = :buildingId")
    fun findByBuildingIdWithRoom(buildingId: Long): List<BillingConfig>

    fun findByBuildingIdAndRoomId(buildingId: Long, roomId: Long): BillingConfig?
}
