package com.houseman.repository

import com.houseman.domain.billing.BillingRecord
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface BillingRecordRepository : JpaRepository<BillingRecord, Long> {
    fun findByBuildingIdAndPeriodYearAndPeriodMonth(
        buildingId: Long,
        periodYear: Int,
        periodMonth: Int,
    ): List<BillingRecord>

    fun findByStatus(status: String): List<BillingRecord>

    @Query("SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room ORDER BY br.periodYear DESC, br.periodMonth DESC")
    fun findAllWithBuildingAndRoom(): List<BillingRecord>

    @Query("SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room WHERE br.building.id = :buildingId ORDER BY br.periodYear DESC, br.periodMonth DESC")
    fun findByBuildingIdWithJoins(buildingId: Long): List<BillingRecord>

    @Query("SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room WHERE br.building.id = :buildingId AND br.periodYear = :year AND br.periodMonth = :month")
    fun findByBuildingIdAndPeriodWithJoins(buildingId: Long, year: Int, month: Int): List<BillingRecord>
}
