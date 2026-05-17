package com.houseman.domain.billing.dto

/**
 * C1-b: SENT billing_records ↔ 입금 transactions 백필 결과 리포트.
 *
 * 6 카테고리 분류 (총 = paidApplied + partialApplied + skippedAlreadyPaid +
 * unmatchedNoTransaction + 잔여; overmatchedMultiple 은 별도 가시성 플래그).
 *
 *  - paidApplied: status=PAID 전이된 billingId
 *  - partialApplied: status=PARTIAL 전이된 billingId (txnSum < total)
 *  - skippedAlreadyPaid: residual <= 0 (이미 paid_amount 충족) 또는 markPaid 호출 시 IllegalStateException
 *  - unmatchedNoTransaction: 매칭 입금 transaction 0건
 *  - overmatchedMultiple: 매칭 transactions > 1건 + 합산 > total (운영자 추적 가시성, cap 미적용)
 *  - dryRun: true 시 markPaid 미호출 (분류만 수행, DB 무변경)
 */
data class RetroFitReport(
    val totalScanned: Int,
    val paidApplied: List<Long>,
    val partialApplied: List<Long>,
    val skippedAlreadyPaid: List<Long>,
    val unmatchedNoTransaction: List<Long>,
    val overmatchedMultiple: List<Long>,
    val dryRun: Boolean,
)
