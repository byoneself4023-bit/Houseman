package com.houseman.domain.vacancy

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import com.houseman.domain.room.Room
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal

@Entity
@Table(name = "vacancies")
class Vacancy(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room,

    var type: String = "",

    var commBroker: BigDecimal = BigDecimal.ZERO,

    var commEvent: String = "",

    var pw: String = "",

    var deposit: Long = 0,

    var rent: Long = 0,

    var nego: Long = 0,

    var mgmt: Long = 0,

    var water: String = "",

    var cable: String = "",

    var exitFee: Long = 0,

    var days: Int = 0,

    var status: String = "점검/청소중",
) : BaseEntity()
