package com.houseman.repository

import com.houseman.domain.building.Building
import org.springframework.data.jpa.repository.JpaRepository

interface BuildingRepository : JpaRepository<Building, Long> {
    fun findByName(name: String): Building?
    fun findByNameIn(names: List<String>): List<Building>
}
