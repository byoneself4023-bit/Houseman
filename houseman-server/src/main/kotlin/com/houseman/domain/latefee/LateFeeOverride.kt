package com.houseman.domain.latefee

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate

@Entity
@Table(name = "late_fee_overrides")
class LateFeeOverride(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @Column(name = "room_number")
    var roomNumber: String,

    @Column(name = "override_type")
    var overrideType: String = "exclude",

    @Column(name = "amount")
    var amount: Int = 0,

    @Column(name = "override_date")
    var overrideDate: LocalDate? = null,
) : BaseEntity()
