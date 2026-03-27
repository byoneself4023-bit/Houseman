package com.houseman.repository

import com.houseman.domain.contract.PastContract
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface PastContractRepository : JpaRepository<PastContract, Long> {
    fun findByBuildingIdAndRoomId(buildingId: Long, roomId: Long): List<PastContract>

    @Query("SELECT pc FROM PastContract pc JOIN FETCH pc.building JOIN FETCH pc.room")
    fun findAllWithBuildingAndRoom(): List<PastContract>
}
