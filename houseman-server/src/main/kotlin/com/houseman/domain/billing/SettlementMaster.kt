package com.houseman.domain.billing

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.math.BigDecimal

@Entity
@Table(name = "settlement_master")
class SettlementMaster(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    var buildingName: String,
    var type: String,
    var feeType: String,
    var feeRate: BigDecimal = BigDecimal.ZERO,
    var feeAmount: Long? = null,
    var feeAmountIncludesVat: Boolean = false,
    var direction: String,
    var settlementDay: String,
    var periodType: String,
    var vat: Boolean = false,
    var vatMode: String? = null,
    var address: String = "",
    var ownerName: String? = null,

    @Column(columnDefinition = "text")
    var notes: String = "",

    var accountType: String? = null,
    var frequency: String? = null,
    var includeMgmt: Boolean? = null,
    var dualAccount: Boolean? = null,
    var moveoutOwnerBurden: Boolean? = null,
    var hasCommercial: Boolean? = null,
    var cashSplit: Boolean? = null,
    var feeVariable: Boolean? = null,
    var autoTransfer: Boolean? = null,
    var dualSection: Boolean? = null,
    var mgmtFeePerUnit: Long? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var dates: List<Any>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var customPeriod: Map<String, Any>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var subItems: List<Map<String, Any>>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var costItems: List<Map<String, Any>>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var hybridRules: List<Map<String, Any>>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var elecCustomerMap: Map<String, Any>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var gasCodeMap: Map<String, Any>? = null,

    var billingType: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var accounts: Map<String, Any>? = null,

    var abbr: String? = null,
) : BaseEntity()
