package com.houseman.repository

import com.houseman.domain.staff.Staff
import org.springframework.data.jpa.repository.JpaRepository

interface StaffRepository : JpaRepository<Staff, Long> {
    fun findByPhone(phone: String): Staff?
}
