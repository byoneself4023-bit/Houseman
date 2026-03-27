package com.houseman.repository

import com.houseman.domain.billing.SettlementMaster
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface SettlementMasterRepository : JpaRepository<SettlementMaster, Long> {
    fun findByBuildingId(buildingId: Long): SettlementMaster?

    @Query("SELECT s FROM SettlementMaster s JOIN FETCH s.building")
    fun findAllWithBuilding(): List<SettlementMaster>
}
