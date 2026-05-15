package com.houseman.domain.billing

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import com.houseman.domain.contract.Contract
import com.houseman.domain.room.Room
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(name = "billing_records")
class BillingRecord(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    var room: Room,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    var contract: Contract? = null,

    var periodYear: Int,
    var periodMonth: Int,
    var tenantName: String = "",
    var rent: Long = 0,
    var mgmt: Long = 0,
    var water: Long = 0,
    var electricity: Long = 0,
    var gas: Long = 0,
    var internet: Long = 0,
    var lateFee: Long = 0,
    var total: Long = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: BillingStatus = BillingStatus.DRAFT,

    var paidAmount: Long = 0,
    var paidAt: OffsetDateTime? = null,

    var confirmedAt: OffsetDateTime? = null,
    var sentAt: OffsetDateTime? = null,

    @Column(columnDefinition = "text")
    var notes: String? = null,
) : BaseEntity()
