package com.houseman.domain.contract

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
@Table(name = "contracts")
class Contract(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room,

    var name: String,
    var phone: String = "",
    var rent: Long = 0,
    var mgmt: Long = 0,
    var deposit: Long = 0,
    var type: String = "단기",
    var due: String = "",
    var status: String = "정상",
    var overdue: Long = 0,
    var moveIn: LocalDate,
    var expiry: LocalDate,
    var prevUnpaid: Long = 0,
    var currentUnpaid: Long = 0,
    var overdueDays: Int = 0,
    var carNumber: String? = null,
    var carType: String? = null,
) : BaseEntity()
