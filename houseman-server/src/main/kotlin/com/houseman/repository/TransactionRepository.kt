package com.houseman.repository

import com.houseman.domain.transaction.Transaction
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface TransactionRepository : JpaRepository<Transaction, Long> {
    fun findByBuildingId(buildingId: Long): List<Transaction>

    @Query("SELECT t FROM Transaction t JOIN FETCH t.building LEFT JOIN FETCH t.room ORDER BY t.date DESC")
    fun findAllWithBuildingAndRoom(): List<Transaction>

    @Query("SELECT t FROM Transaction t JOIN FETCH t.building LEFT JOIN FETCH t.room WHERE t.building.id = :buildingId ORDER BY t.date DESC")
    fun findByBuildingIdWithJoins(buildingId: Long): List<Transaction>

    /**
     * C1-b: room_id + 기간(date BETWEEN [from, to)) + type 매칭.
     * DB 함수 (YEAR/MONTH/EXTRACT) 의존 회피 — LocalDate 범위로 portable.
     * fromInclusive = 해당 월 1일, toExclusive = 다음 월 1일.
     */
    @Query(
        "SELECT t FROM Transaction t WHERE t.room.id = :roomId " +
            "AND t.date >= :fromInclusive AND t.date < :toExclusive " +
            "AND t.type = :type",
    )
    fun findByRoomIdAndDateRangeAndType(
        @Param("roomId") roomId: Long,
        @Param("fromInclusive") fromInclusive: LocalDate,
        @Param("toExclusive") toExclusive: LocalDate,
        @Param("type") type: String,
    ): List<Transaction>
}
