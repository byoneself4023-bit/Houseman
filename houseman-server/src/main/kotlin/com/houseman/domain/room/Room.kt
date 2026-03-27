package com.houseman.domain.room

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal

@Entity
@Table(name = "rooms")
class Room(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    var roomNumber: String,

    var floorLabel: String? = null,

    var roomType: String? = null,

    var area: BigDecimal? = null,

    var baseDeposit: Long = 0,

    var baseRent: Long = 0,

    var baseMgmt: Long = 0,

    @Column(name = "water_fee")
    var waterFee: String = "0",

    @Column(name = "internet_fee")
    var internetFee: String = "0",

    var cleanFee: Long = 0,

    var commFee: Long = 0,

    var elecNo: String? = null,

    var gasNo: String? = null,
) : BaseEntity()
