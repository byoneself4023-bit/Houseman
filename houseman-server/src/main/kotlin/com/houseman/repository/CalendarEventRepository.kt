package com.houseman.repository

import com.houseman.domain.calendar.CalendarEvent
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface CalendarEventRepository : JpaRepository<CalendarEvent, Long> {

    @Query("SELECT e FROM CalendarEvent e LEFT JOIN FETCH e.building LEFT JOIN FETCH e.room")
    fun findAllWithJoins(): List<CalendarEvent>

    @Query("SELECT e FROM CalendarEvent e LEFT JOIN FETCH e.building LEFT JOIN FETCH e.room WHERE e.date BETWEEN :from AND :to")
    fun findByDateBetween(from: LocalDate, to: LocalDate): List<CalendarEvent>

    @Query("SELECT e FROM CalendarEvent e LEFT JOIN FETCH e.building LEFT JOIN FETCH e.room WHERE e.building.id = :buildingId")
    fun findByBuildingIdWithJoins(buildingId: Long): List<CalendarEvent>
}
