package com.houseman.repository

import com.houseman.domain.cashbook.CashbookEntry
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.Optional

interface CashbookEntryRepository : JpaRepository<CashbookEntry, Long> {

    @Query("SELECT c FROM CashbookEntry c JOIN FETCH c.building")
    fun findAllWithBuilding(): List<CashbookEntry>

    @Query("SELECT c FROM CashbookEntry c JOIN FETCH c.building WHERE c.building.id = :buildingId")
    fun findByBuildingIdWithJoins(buildingId: Long): List<CashbookEntry>

    fun findBySourceId(sourceId: String): Optional<CashbookEntry>
}
