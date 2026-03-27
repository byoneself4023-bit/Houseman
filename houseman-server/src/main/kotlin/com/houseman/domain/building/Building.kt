package com.houseman.domain.building

import com.houseman.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(name = "buildings")
class Building(
    @Column(unique = true)
    var name: String,

    var roomCount: Int = 0,

    var occupiedCount: Int = 0,

    var buildingType: String = "단기",

    var feeType: String = "pct",

    var fee: BigDecimal = BigDecimal.ZERO,

    var fixedFee: Long = 0,

    var special: String? = null,

    var parkingTotal: Int = 0,

    var ownerName: String? = null,

    var ownerPhone: String? = null,

    var ownerFee: BigDecimal? = BigDecimal.ZERO,

    var ownerAccount: String? = null,

    var mgmtStart: LocalDate? = null,

    var address: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    var floors: Map<String, List<String>>? = null,
) : BaseEntity()
