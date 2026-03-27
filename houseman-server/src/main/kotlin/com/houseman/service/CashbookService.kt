package com.houseman.service

import com.houseman.domain.cashbook.CashbookEntry
import com.houseman.domain.cashbook.dto.CashbookEntryResponse
import com.houseman.domain.cashbook.dto.CreateCashbookEntryRequest
import com.houseman.domain.cashbook.dto.UpdateCashbookEntryRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.CashbookEntryRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class CashbookService(
    private val cashbookEntryRepository: CashbookEntryRepository,
    private val buildingRepository: BuildingRepository,
) {

    fun findAll(buildingId: Long?): List<CashbookEntryResponse> {
        val entries = if (buildingId != null) {
            cashbookEntryRepository.findByBuildingIdWithJoins(buildingId)
        } else {
            cashbookEntryRepository.findAllWithBuilding()
        }
        return entries.map { CashbookEntryResponse.from(it) }
    }

    @Transactional
    fun create(request: CreateCashbookEntryRequest): CashbookEntryResponse {
        // sourceId 중복 방지
        if (request.sourceId != null) {
            val existing = cashbookEntryRepository.findBySourceId(request.sourceId)
            if (existing.isPresent) {
                return CashbookEntryResponse.from(existing.get())
            }
        }

        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }

        val entry = CashbookEntry(
            building = building,
            date = request.date,
            type = request.type,
            direction = request.direction,
            description = request.description,
            amount = request.amount,
            account = request.account,
            accountHolder = request.accountHolder,
            status = request.status,
            sourceId = request.sourceId,
            room = request.room,
            round = request.round,
        )
        return CashbookEntryResponse.from(cashbookEntryRepository.save(entry))
    }

    @Transactional
    fun update(id: Long, request: UpdateCashbookEntryRequest): CashbookEntryResponse {
        val entry = cashbookEntryRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CASHBOOK_ENTRY_NOT_FOUND) }

        request.date?.let { entry.date = it }
        request.type?.let { entry.type = it }
        request.direction?.let { entry.direction = it }
        request.description?.let { entry.description = it }
        request.amount?.let { entry.amount = it }
        request.account?.let { entry.account = it }
        request.accountHolder?.let { entry.accountHolder = it }
        request.status?.let { entry.status = it }
        request.sentAt?.let { entry.sentAt = it }
        request.sourceId?.let { entry.sourceId = it }
        request.room?.let { entry.room = it }
        request.round?.let { entry.round = it }

        return CashbookEntryResponse.from(cashbookEntryRepository.save(entry))
    }

    @Transactional
    fun delete(id: Long) {
        val entry = cashbookEntryRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CASHBOOK_ENTRY_NOT_FOUND) }
        cashbookEntryRepository.delete(entry)
    }
}
