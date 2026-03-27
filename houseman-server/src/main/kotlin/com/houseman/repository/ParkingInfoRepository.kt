package com.houseman.repository

import com.houseman.domain.parking.ParkingInfo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ParkingInfoRepository : JpaRepository<ParkingInfo, Long> {

    @Query("SELECT p FROM ParkingInfo p JOIN FETCH p.building LEFT JOIN FETCH p.contract")
    fun findAllWithBuilding(): List<ParkingInfo>

    @Query("SELECT p FROM ParkingInfo p JOIN FETCH p.building LEFT JOIN FETCH p.contract WHERE p.building.id = :buildingId")
    fun findByBuildingIdWithJoins(buildingId: Long): List<ParkingInfo>
}
