package com.houseman.repository

import com.houseman.domain.latefee.LateFeeOverride
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface LateFeeOverrideRepository : JpaRepository<LateFeeOverride, Long> {

    @Query("SELECT o FROM LateFeeOverride o JOIN FETCH o.building")
    fun findAllWithBuilding(): List<LateFeeOverride>

    @Query("SELECT o FROM LateFeeOverride o JOIN FETCH o.building WHERE o.building.id = :buildingId")
    fun findByBuildingId(buildingId: Long): List<LateFeeOverride>

    fun findByBuildingIdAndRoomNumber(buildingId: Long, roomNumber: String): LateFeeOverride?
}
