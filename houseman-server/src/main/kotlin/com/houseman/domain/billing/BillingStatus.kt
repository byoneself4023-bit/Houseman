package com.houseman.domain.billing

/**
 * billing_records.status enum.
 * V12 마이그레이션 CHECK 제약과 1:1 대응.
 *
 * 전이:
 *   DRAFT → CONFIRMED → SENT → PARTIAL → PAID
 *   (SENT → PAID 도 가능 — 전액 1회 결제)
 *
 * C1-a (pays_for 관계): markPaid 호출 시 PARTIAL/PAID 전이.
 */
enum class BillingStatus {
    DRAFT,
    CONFIRMED,
    SENT,
    PAID,
    PARTIAL,
}
