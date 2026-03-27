package com.houseman.domain.calendar

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import com.houseman.domain.room.Room
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate

@Entity
@Table(name = "calendar_events")
class CalendarEvent(
    var date: LocalDate,

    var type: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room? = null,

    var name: String,

    var color: String = "#3B82F6",
) : BaseEntity()
