package com.houseman.service

import com.houseman.domain.billing.BillingRecord
import com.houseman.domain.billing.BillingStatus
import com.houseman.domain.billing.dto.BillingConfigResponse
import com.houseman.domain.billing.dto.BillingRecordResponse
import com.houseman.domain.billing.dto.BillingStatusResponse
import com.houseman.domain.billing.dto.GenerateBillingRequest
import com.houseman.domain.billing.dto.RetroFitReport
import com.houseman.domain.billing.dto.SettlementMasterResponse
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.BillingConfigRepository
import com.houseman.repository.BillingRecordRepository
import com.houseman.repository.BuildingRepository
import com.houseman.repository.ContractRepository
import com.houseman.repository.SettlementMasterRepository
import com.houseman.repository.TransactionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.OffsetDateTime

@Service
@Transactional(readOnly = true)
class BillingService(
    private val billingRecordRepository: BillingRecordRepository,
    private val billingConfigRepository: BillingConfigRepository,
    private val contractRepository: ContractRepository,
    private val settlementMasterRepository: SettlementMasterRepository,
    private val buildingRepository: BuildingRepository,
    private val transactionRepository: TransactionRepository,
    private val sseEmitterManager: SseEmitterManager,
) {

    fun findAllRecords(buildingId: Long?, year: Int?, month: Int?): List<BillingRecordResponse> {
        val records = when {
            buildingId != null && year != null && month != null ->
                billingRecordRepository.findByBuildingIdAndPeriodWithJoins(buildingId, year, month)
            buildingId != null ->
                billingRecordRepository.findByBuildingIdWithJoins(buildingId)
            else ->
                billingRecordRepository.findAllWithBuildingAndRoom()
        }
        return records.map { BillingRecordResponse.from(it) }
    }

    @Transactional
    fun generate(request: GenerateBillingRequest): List<BillingRecordResponse> {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }

        // 이미 생성된 청구서가 있으면 삭제 후 재생성
        val existing = billingRecordRepository.findByBuildingIdAndPeriodYearAndPeriodMonth(
            request.buildingId, request.periodYear, request.periodMonth,
        )
        if (existing.isNotEmpty()) {
            billingRecordRepository.deleteAll(existing)
        }

        // 건물의 billing_configs 조회
        val configs = billingConfigRepository.findByBuildingIdWithRoom(request.buildingId)

        // 건물의 활성 계약 조회
        val contracts = contractRepository.findByBuildingIdWithJoins(request.buildingId)
            .filter { it.status == "active" || it.status == "정상" }

        val records = configs.map { config ->
            // 호실에 매칭되는 계약 찾기
            val contract = contracts.firstOrNull { it.room.id == config.room.id }

            val rent = contract?.rent ?: 0
            val mgmt = contract?.mgmt ?: 0
            val water = config.waterFee
            val internet = config.cableFee
            val electricity = 0L // 실제 검침 데이터 필요 — generate 시점에는 0
            val gas = 0L // 실제 검침 데이터 필요 — generate 시점에는 0
            val lateFee = 0L
            val total = rent + mgmt + water + internet + electricity + gas + lateFee

            BillingRecord(
                building = building,
                room = config.room,
                contract = contract,
                periodYear = request.periodYear,
                periodMonth = request.periodMonth,
                tenantName = contract?.name ?: "",
                rent = rent,
                mgmt = mgmt,
                water = water,
                electricity = electricity,
                gas = gas,
                internet = internet,
                lateFee = lateFee,
                total = total,
            )
        }

        return billingRecordRepository.saveAll(records).map { BillingRecordResponse.from(it) }
    }

    @Transactional
    fun confirm(id: Long): BillingRecordResponse {
        val record = billingRecordRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.BILLING_RECORD_NOT_FOUND) }
        record.status = BillingStatus.CONFIRMED
        record.confirmedAt = OffsetDateTime.now()
        val saved = BillingRecordResponse.from(billingRecordRepository.save(record))

        try {
            sseEmitterManager.broadcast(
                SseEventType.BILLING_CONFIRMED,
                SseEventData(
                    type = SseEventType.BILLING_CONFIRMED,
                    message = "${record.building.name} ${record.room.roomNumber} 청구 확정",
                    buildingName = record.building.name,
                    roomNumber = record.room.roomNumber,
                    data = mapOf("billingRecordId" to saved.id),
                ),
            )
        } catch (_: Exception) { }

        return saved
    }

    @Transactional
    fun send(id: Long): BillingRecordResponse {
        val record = billingRecordRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.BILLING_RECORD_NOT_FOUND) }
        record.status = BillingStatus.SENT
        record.sentAt = OffsetDateTime.now()
        return BillingRecordResponse.from(billingRecordRepository.save(record))
    }

    /**
     * C1-a: pays_for 관계 정식화 — BillingRecord 결제 처리.
     *
     * 결제 누적 후 newPaidAmount >= total 이면 PAID, 미만이면 PARTIAL.
     * 멱등성: 진입 시 status == PAID 면 IllegalStateException (중복 호출 차단).
     * Race condition: @Transactional + JPA dirty checking 으로 단일 트랜잭션 내 atomic.
     * 호출처: TransactionService.create (입금 INFLOW + billingId 동반) / BillingController PATCH 단독.
     */
    @Transactional
    fun markPaid(billingId: Long, paymentAmount: Long): BillingRecordResponse {
        if (paymentAmount <= 0) {
            throw BusinessException(ErrorCode.INVALID_INPUT)
        }
        val record = billingRecordRepository.findById(billingId)
            .orElseThrow { BusinessException(ErrorCode.BILLING_RECORD_NOT_FOUND) }
        if (record.status == BillingStatus.PAID) {
            throw IllegalStateException("Already paid: billingId=$billingId")
        }

        val newPaidAmount = record.paidAmount + paymentAmount
        record.paidAmount = newPaidAmount
        record.status = if (newPaidAmount >= record.total) BillingStatus.PAID else BillingStatus.PARTIAL
        record.paidAt = OffsetDateTime.now()
        val saved = BillingRecordResponse.from(billingRecordRepository.save(record))

        try {
            sseEmitterManager.broadcast(
                SseEventType.PAYMENT_RECEIVED,
                SseEventData(
                    type = SseEventType.PAYMENT_RECEIVED,
                    message = "${record.building.name} ${record.room.roomNumber} 결제 처리 (${record.status.name})",
                    buildingName = record.building.name,
                    roomNumber = record.room.roomNumber,
                    data = mapOf(
                        "billingRecordId" to saved.id,
                        "paidAmount" to newPaidAmount,
                        "status" to record.status.name,
                    ),
                ),
            )
        } catch (_: Exception) { }

        return saved
    }

    /**
     * C1-b: SENT/PARTIAL billing_records ↔ 입금 transactions 매칭 백필.
     *
     * 매칭 룰: room.id + date 범위(periodYear/Month [1일, +1월 1일)) + type='입금'.
     * Transaction 엔티티에 billingId FK 부재 → room + 기간 + type 으로 추정 매칭.
     *
     * 누적/멱등성: markPaid 재호출 (residual = txnSum - paidAmount).
     *   - residual <= 0: 이미 충분히 paid → skippedAlreadyPaid (멱등성 자연 보장)
     *   - residual > 0: markPaid 호출 (>= total ? PAID : PARTIAL)
     *   - markPaid 중 IllegalStateException (concurrent PAID 진입) → skippedAlreadyPaid
     *
     * overmatch: txnSum > total + txns.size > 1 — 리포트만 (cap 미적용, 운영자 가시성 우선).
     *
     * @param buildingId null = 전체 건물, 지정 시 해당 건물만
     * @param dryRun true = 분류만 (markPaid 미호출, DB 무변경)
     */
    @Transactional
    fun retroFitPayments(buildingId: Long? = null, dryRun: Boolean = true): RetroFitReport {
        val statuses = listOf(BillingStatus.SENT, BillingStatus.PARTIAL)
        val records = if (buildingId != null) {
            billingRecordRepository.findByStatusInAndBuildingId(statuses, buildingId)
        } else {
            billingRecordRepository.findByStatusIn(statuses)
        }

        val paidApplied = mutableListOf<Long>()
        val partialApplied = mutableListOf<Long>()
        val skippedAlreadyPaid = mutableListOf<Long>()
        val unmatchedNoTransaction = mutableListOf<Long>()
        val overmatchedMultiple = mutableListOf<Long>()

        for (record in records) {
            val recordId = record.id
            val roomId = record.room.id
            val fromInclusive = LocalDate.of(record.periodYear, record.periodMonth, 1)
            val toExclusive = fromInclusive.plusMonths(1)
            val txns = transactionRepository.findByRoomIdAndDateRangeAndType(
                roomId, fromInclusive, toExclusive, "입금",
            )
            if (txns.isEmpty()) {
                unmatchedNoTransaction += recordId
                continue
            }
            val txnSum = txns.sumOf { it.amount }
            val residual = txnSum - record.paidAmount
            if (residual <= 0) {
                // residual == 0: 이미 충분히 paid (멱등성)
                // residual < 0: txnSum < paidAmount (data inconsistency, 운영자 추적 필요)
                skippedAlreadyPaid += recordId
                continue
            }
            if (!dryRun) {
                try {
                    markPaid(recordId, residual)
                } catch (_: IllegalStateException) {
                    // concurrent PAID 전이 (markPaid 내부 Already paid hardstop)
                    skippedAlreadyPaid += recordId
                    continue
                }
            }
            val newPaid = record.paidAmount + residual
            if (newPaid >= record.total) paidApplied += recordId else partialApplied += recordId
            if (txns.size > 1 && txnSum > record.total) overmatchedMultiple += recordId
        }

        return RetroFitReport(
            totalScanned = records.size,
            paidApplied = paidApplied,
            partialApplied = partialApplied,
            skippedAlreadyPaid = skippedAlreadyPaid,
            unmatchedNoTransaction = unmatchedNoTransaction,
            overmatchedMultiple = overmatchedMultiple,
            dryRun = dryRun,
        )
    }

    fun getStatus(buildingId: Long?, year: Int?, month: Int?): BillingStatusResponse {
        val records = when {
            buildingId != null && year != null && month != null ->
                billingRecordRepository.findByBuildingIdAndPeriodYearAndPeriodMonth(buildingId, year, month)
            else ->
                billingRecordRepository.findAll()
        }
        return BillingStatusResponse(
            total = records.size,
            draft = records.count { it.status == BillingStatus.DRAFT },
            confirmed = records.count { it.status == BillingStatus.CONFIRMED },
            sent = records.count { it.status == BillingStatus.SENT },
        )
    }

    fun findAllConfigs(buildingId: Long?): List<BillingConfigResponse> {
        val configs = if (buildingId != null) {
            billingConfigRepository.findByBuildingIdWithRoom(buildingId)
        } else {
            billingConfigRepository.findAll()
        }
        return configs.map { BillingConfigResponse.from(it) }
    }

    fun findConfigById(id: Long): BillingConfigResponse {
        val config = billingConfigRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.BILLING_CONFIG_NOT_FOUND) }
        return BillingConfigResponse.from(config)
    }

    fun findAllSettlementMasters(): List<SettlementMasterResponse> {
        return settlementMasterRepository.findAllWithBuilding()
            .map { SettlementMasterResponse.from(it) }
    }

    fun findSettlementMasterByBuildingId(buildingId: Long): SettlementMasterResponse {
        val master = settlementMasterRepository.findByBuildingId(buildingId)
            ?: throw BusinessException(ErrorCode.SETTLEMENT_MASTER_NOT_FOUND)
        return SettlementMasterResponse.from(master)
    }
}
