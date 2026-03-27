package com.houseman.domain.parking

import com.houseman.domain.BaseEntity
import com.houseman.domain.building.Building
import com.houseman.domain.contract.Contract
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "parking_infos")
class ParkingInfo(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    var building: Building,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    var contract: Contract? = null,

    @Column(name = "tenant_name")
    var tenantName: String = "",

    @Column(name = "room_number")
    var roomNumber: String = "",

    @Column(name = "car_number")
    var carNumber: String = "",

    @Column(name = "car_type")
    var carType: String = "",
) : BaseEntity()
