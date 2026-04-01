package com.houseman.repository

import com.houseman.domain.meter.MeterReading
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface MeterReadingRepository : JpaRepository<MeterReading, Long> {

    @Query("SELECT m FROM MeterReading m JOIN FETCH m.building LEFT JOIN FETCH m.room WHERE m.billingMonth = :billingMonth")
    fun findByBillingMonth(billingMonth: String): List<MeterReading>

    @Query("SELECT m FROM MeterReading m JOIN FETCH m.building LEFT JOIN FETCH m.room WHERE m.room.id = :roomId AND m.type = :type ORDER BY m.readingDate DESC")
    fun findByRoomIdAndType(roomId: Long, type: String): List<MeterReading>
}
