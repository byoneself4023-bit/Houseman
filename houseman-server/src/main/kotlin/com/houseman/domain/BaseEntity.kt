package com.houseman.domain

import jakarta.persistence.Column
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.PrePersist
import java.time.OffsetDateTime

/** id만 있는 기본 엔티티 (created_at 없는 테이블용) */
@MappedSuperclass
abstract class BaseIdEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}

/** id + created_at 이 있는 엔티티 */
@MappedSuperclass
abstract class BaseEntity : BaseIdEntity() {

    @Column(name = "created_at", updatable = false)
    var createdAt: OffsetDateTime? = null

    @PrePersist
    fun onPrePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now()
        }
    }
}
