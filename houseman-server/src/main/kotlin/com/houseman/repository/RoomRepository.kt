package com.houseman.repository

import com.houseman.domain.room.Room
import org.springframework.data.jpa.repository.JpaRepository

interface RoomRepository : JpaRepository<Room, Long> {
    fun findByBuildingId(buildingId: Long): List<Room>
    fun findByBuildingIdOrderByRoomNumber(buildingId: Long): List<Room>
    fun findByBuildingIdAndRoomNumber(buildingId: Long, roomNumber: String): Room?
}
