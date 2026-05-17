package com.houseman.repository

import com.houseman.domain.billing.BillingRecord
import com.houseman.domain.billing.BillingStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface BillingRecordRepository : JpaRepository<BillingRecord, Long> {
    fun findByBuildingIdAndPeriodYearAndPeriodMonth(
        buildingId: Long,
        periodYear: Int,
        periodMonth: Int,
    ): List<BillingRecord>

    fun findByStatus(status: BillingStatus): List<BillingRecord>

    // C1-b: retro-fit 대상 (SENT/PARTIAL) 조회 — building.id 포함 FETCH JOIN.
    @Query(
        "SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room " +
            "WHERE br.status IN :statuses",
    )
    fun findByStatusIn(statuses: List<BillingStatus>): List<BillingRecord>

    @Query(
        "SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room " +
            "WHERE br.status IN :statuses AND br.building.id = :buildingId",
    )
    fun findByStatusInAndBuildingId(statuses: List<BillingStatus>, buildingId: Long): List<BillingRecord>

    @Query("SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room ORDER BY br.periodYear DESC, br.periodMonth DESC")
    fun findAllWithBuildingAndRoom(): List<BillingRecord>

    @Query("SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room WHERE br.building.id = :buildingId ORDER BY br.periodYear DESC, br.periodMonth DESC")
    fun findByBuildingIdWithJoins(buildingId: Long): List<BillingRecord>

    @Query("SELECT br FROM BillingRecord br JOIN FETCH br.building JOIN FETCH br.room WHERE br.building.id = :buildingId AND br.periodYear = :year AND br.periodMonth = :month")
    fun findByBuildingIdAndPeriodWithJoins(buildingId: Long, year: Int, month: Int): List<BillingRecord>
}
