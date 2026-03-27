package com.houseman.domain.cashbook

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.OffsetDateTime

@Entity
@Table(name = "cashbook_entries")
class CashbookEntry(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    var date: LocalDate,

    var type: String = "manual",

    var direction: String = "출금",

    var description: String = "",

    var amount: Long = 0,

    var account: String = "",

    @Column(name = "account_holder")
    var accountHolder: String = "",

    var status: String = "대기",

    @Column(name = "sent_at")
    var sentAt: OffsetDateTime? = null,

    @Column(name = "source_id")
    var sourceId: String? = null,

    var room: String = "",

    var round: Int = 0,
) : BaseEntity()
