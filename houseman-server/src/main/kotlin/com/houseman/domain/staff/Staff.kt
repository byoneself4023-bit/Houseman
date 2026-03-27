package com.houseman.domain.staff

import com.houseman.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(name = "staff")
class Staff(
    var name: String,

    @Column(unique = true)
    var phone: String,

    var password: String,

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "TEXT[]")
    var roles: Array<String> = emptyArray(),

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "assigned_buildings", columnDefinition = "TEXT[]")
    var assignedBuildings: Array<String> = emptyArray(),
) : BaseEntity()
