package com.houseman.repository

import com.houseman.domain.transaction.Transaction
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface TransactionRepository : JpaRepository<Transaction, Long> {
    fun findByBuildingId(buildingId: Long): List<Transaction>

    @Query("SELECT t FROM Transaction t JOIN FETCH t.building LEFT JOIN FETCH t.room ORDER BY t.date DESC")
    fun findAllWithBuildingAndRoom(): List<Transaction>

    @Query("SELECT t FROM Transaction t JOIN FETCH t.building LEFT JOIN FETCH t.room WHERE t.building.id = :buildingId ORDER BY t.date DESC")
    fun findByBuildingIdWithJoins(buildingId: Long): List<Transaction>
}
