package com.houseman.repository

import com.houseman.domain.settlement.SettlementExpense
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface SettlementExpenseRepository : JpaRepository<SettlementExpense, Long> {

    @Query("SELECT e FROM SettlementExpense e JOIN FETCH e.building LEFT JOIN FETCH e.room")
    fun findAllWithJoins(): List<SettlementExpense>

    @Query("SELECT e FROM SettlementExpense e JOIN FETCH e.building LEFT JOIN FETCH e.room WHERE e.building.id = :buildingId AND e.month = :month")
    fun findByBuildingIdAndMonth(buildingId: Long, month: String): List<SettlementExpense>

    @Query("SELECT e FROM SettlementExpense e JOIN FETCH e.building LEFT JOIN FETCH e.room WHERE e.month = :month")
    fun findByMonth(month: String): List<SettlementExpense>

    @Query("SELECT e FROM SettlementExpense e JOIN FETCH e.building LEFT JOIN FETCH e.room WHERE e.building.id = :buildingId")
    fun findByBuildingIdWithJoins(buildingId: Long): List<SettlementExpense>
}
