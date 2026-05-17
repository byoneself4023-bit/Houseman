package com.houseman.service

import com.houseman.domain.billing.BillingRecord
import com.houseman.domain.billing.BillingStatus
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BillingRecordRepository
import com.houseman.repository.BuildingRepository
import com.houseman.repository.RoomRepository
import com.houseman.support.IntegrationTestSupport
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

/**
 * C1-a: BillingService.markPaid 단위 테스트.
 *
 * pays_for 관계 정식화 — Transaction → BillingRecord 결제 처리.
 *   - 전액 결제: SENT → PAID
 *   - 부분 결제: SENT → PARTIAL
 *   - 중복 호출: IllegalStateException 차단
 *   - 0/음수 금액: BusinessException INVALID_INPUT
 *   - 비존재 ID: BusinessException BILLING_RECORD_NOT_FOUND
 */
class BillingServiceTest : IntegrationTestSupport() {

    @Autowired
    lateinit var billingService: BillingService

    @Autowired
    lateinit var billingRecordRepository: BillingRecordRepository

    @Autowired
    lateinit var buildingRepository: BuildingRepository

    @Autowired
    lateinit var roomRepository: RoomRepository

    private fun seedRecord(total: Long, status: BillingStatus = BillingStatus.SENT): BillingRecord {
        val building = buildingRepository.findById(1).orElseThrow()
        val room = roomRepository.findAll().first { it.building.id == 1L }
        val record = BillingRecord(
            building = building,
            room = room,
            contract = null,
            periodYear = 2026,
            periodMonth = 12,
            tenantName = "C1-a 테스트",
            rent = total,
            mgmt = 0,
            water = 0,
            electricity = 0,
            gas = 0,
            internet = 0,
            lateFee = 0,
            total = total,
            status = status,
        )
        return billingRecordRepository.save(record)
    }

    @Test
    @DisplayName("markPaid: 전액 결제 → status=PAID + paidAmount=total + paidAt 설정")
    fun fullPay_setsStatusPaid() {
        val record = seedRecord(total = 500_000)

        val result = billingService.markPaid(record.id, 500_000)

        assertEquals("PAID", result.status)
        assertEquals(500_000L, result.paidAmount)
        assertNotNull(result.paidAt)
    }

    @Test
    @DisplayName("markPaid: 부분 결제 → status=PARTIAL + paidAmount 누적")
    fun partialPay_setsStatusPartial() {
        val record = seedRecord(total = 500_000)

        val first = billingService.markPaid(record.id, 200_000)
        assertEquals("PARTIAL", first.status)
        assertEquals(200_000L, first.paidAmount)

        val second = billingService.markPaid(record.id, 100_000)
        assertEquals("PARTIAL", second.status)
        assertEquals(300_000L, second.paidAmount)

        // 잔액 전체 결제 → PAID
        val third = billingService.markPaid(record.id, 200_000)
        assertEquals("PAID", third.status)
        assertEquals(500_000L, third.paidAmount)
    }

    @Test
    @DisplayName("markPaid: 이미 PAID 인 record 중복 호출 → IllegalStateException")
    fun duplicateMarkPaid_throwsIllegalState() {
        val record = seedRecord(total = 100_000)
        billingService.markPaid(record.id, 100_000)

        val ex = assertThrows(IllegalStateException::class.java) {
            billingService.markPaid(record.id, 50_000)
        }
        assertEquals(true, ex.message?.contains("Already paid"))
    }

    @Test
    @DisplayName("markPaid: 0 또는 음수 paymentAmount → BusinessException INVALID_INPUT")
    fun invalidAmount_throwsBusinessException() {
        val record = seedRecord(total = 100_000)

        val zero = assertThrows(BusinessException::class.java) {
            billingService.markPaid(record.id, 0)
        }
        assertEquals(ErrorCode.INVALID_INPUT, zero.errorCode)

        val negative = assertThrows(BusinessException::class.java) {
            billingService.markPaid(record.id, -1000)
        }
        assertEquals(ErrorCode.INVALID_INPUT, negative.errorCode)
    }

    @Test
    @DisplayName("markPaid: 존재하지 않는 billingId → BusinessException BILLING_RECORD_NOT_FOUND")
    fun nonExistentBillingId_throwsBillingRecordNotFound() {
        val ex = assertThrows(BusinessException::class.java) {
            billingService.markPaid(99_999_999, 10_000)
        }
        assertEquals(ErrorCode.BILLING_RECORD_NOT_FOUND, ex.errorCode)
    }
}
