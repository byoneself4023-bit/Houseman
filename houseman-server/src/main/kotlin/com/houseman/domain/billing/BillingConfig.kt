package com.houseman.domain.billing

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import com.houseman.domain.room.Room
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "billing_configs")
class BillingConfig(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room,

    var depositMonths: Int = 0,
    var waterFee: Long = 0,
    var cableFee: Long = 0,
    var elecAmount: Long = 0,
    var elecStart: String = "",
    var elecEnd: String = "",
    var elecPrice: Long = 0,
    var elecSurcharge: Long = 0,
    var elecTax: Long = 0,
    var gasAmount: Long = 0,
    var gasPeriod: String = "",
    var gasPrice: Long = 0,
    var gasColdPrice: Long = 0,
    var gasTax: Long = 0,
) : BaseEntity()
