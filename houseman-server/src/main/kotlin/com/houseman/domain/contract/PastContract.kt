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
@Table(name = "past_contracts")
class PastContract(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room,

    var name: String,
    var phone: String = "",
    var moveIn: LocalDate,
    var moveOut: LocalDate,
    var expiry: LocalDate? = null,
    var deposit: Long = 0,
    var rent: Long = 0,
    var mgmt: Long? = null,
    var roomType: String? = null,
    var due: String? = null,
    var rentDay: Int? = null,
    var reason: String,
    var settlement: String,
    var settlementDate: LocalDate? = null,
    var cleanFee: Long? = null,
    var elecReading: Long? = null,
    var gasReading: Long? = null,
    var waterReading: Long? = null,
    var damageFee: Long? = null,
    var damageDesc: String? = null,
    var penalty7: Long? = null,
    var penaltyReason: String? = null,
    var daysInMonth: Int? = null,
    var usedDays: Int? = null,
    var startDay: Int? = null,
    var rentProRata: Long? = null,
    var mgmtProRata: Long? = null,
    var depositReturn: Long? = null,
    var totalDeduct: Long? = null,
    var finalRefund: Long? = null,
    var brokerageFee: Long? = null,
) : BaseEntity()
