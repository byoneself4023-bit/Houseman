package com.houseman.repository

import com.houseman.domain.contract.Contract
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ContractRepository : JpaRepository<Contract, Long> {
    fun findByBuildingId(buildingId: Long): List<Contract>
    fun findByRoomId(roomId: Long): List<Contract>
    fun findByStatus(status: String): List<Contract>

    @Query("SELECT c FROM Contract c JOIN FETCH c.building JOIN FETCH c.room")
    fun findAllWithBuildingAndRoom(): List<Contract>

    @Query("SELECT c FROM Contract c JOIN FETCH c.building JOIN FETCH c.room WHERE c.building.id = :buildingId")
    fun findByBuildingIdWithJoins(buildingId: Long): List<Contract>
}
