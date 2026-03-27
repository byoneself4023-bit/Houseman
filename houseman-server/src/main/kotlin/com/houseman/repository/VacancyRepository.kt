package com.houseman.repository

import com.houseman.domain.vacancy.Vacancy
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface VacancyRepository : JpaRepository<Vacancy, Long> {

    @Query("SELECT v FROM Vacancy v JOIN FETCH v.building JOIN FETCH v.room")
    fun findAllWithBuildingAndRoom(): List<Vacancy>

    @Query("SELECT v FROM Vacancy v JOIN FETCH v.building JOIN FETCH v.room WHERE v.building.id = :buildingId")
    fun findByBuildingIdWithJoins(buildingId: Long): List<Vacancy>
}
