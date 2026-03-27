package com.houseman.domain.calendar.dto

import com.houseman.domain.calendar.CalendarEvent
import java.time.LocalDate

data class CalendarEventResponse(
    val id: Long,
    val date: LocalDate,
    val type: String,
    val buildingId: Long?,
    val buildingName: String?,
    val roomId: Long?,
    val roomNumber: String?,
    val name: String,
    val color: String,
) {
    companion object {
        fun from(entity: CalendarEvent): CalendarEventResponse = CalendarEventResponse(
            id = entity.id,
            date = entity.date,
            type = entity.type,
            buildingId = entity.building?.id,
            buildingName = entity.building?.name,
            roomId = entity.room?.id,
            roomNumber = entity.room?.roomNumber,
            name = entity.name,
            color = entity.color,
        )
    }
}

data class CreateCalendarEventRequest(
    val date: LocalDate,
    val type: String,
    val buildingId: Long? = null,
    val roomId: Long? = null,
    val name: String,
    val color: String? = null,
)

data class UpdateCalendarEventRequest(
    val date: LocalDate? = null,
    val type: String? = null,
    val buildingId: Long? = null,
    val roomId: Long? = null,
    val name: String? = null,
    val color: String? = null,
)
