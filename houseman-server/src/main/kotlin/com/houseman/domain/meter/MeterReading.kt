package com.houseman.domain.meter

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import com.houseman.domain.room.Room
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "meter_readings")
class MeterReading(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room? = null,

    @Column(name = "type")
    var type: String,

    @Column(name = "reading_date")
    var readingDate: LocalDate? = null,

    @Column(name = "reading_value")
    var readingValue: BigDecimal? = null,

    @Column(name = "usage")
    var usage: BigDecimal = BigDecimal.ZERO,

    @Column(name = "amount")
    var amount: Int = 0,

    @Column(name = "period_start")
    var periodStart: LocalDate? = null,

    @Column(name = "period_end")
    var periodEnd: LocalDate? = null,

    @Column(name = "billing_month")
    var billingMonth: String? = null,

    @Column(name = "customer_number")
    var customerNumber: String? = null,

    @Column(name = "is_meter_replaced")
    var isMeterReplaced: Boolean = false,

    @Column(name = "source")
    var source: String = "upload",
) : BaseEntity()
