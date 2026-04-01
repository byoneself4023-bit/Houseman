package com.houseman.service

import com.houseman.domain.meter.MeterReading
import com.houseman.domain.meter.dto.CreateMeterReadingRequest
import com.houseman.domain.meter.dto.MeterReadingResponse
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.MeterReadingRepository
import com.houseman.repository.RoomRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class MeterReadingService(
    private val repository: MeterReadingRepository,
    private val buildingRepository: BuildingRepository,
    private val roomRepository: RoomRepository,
) {

    fun findByBillingMonth(billingMonth: String): List<MeterReadingResponse> =
        repository.findByBillingMonth(billingMonth).map { MeterReadingResponse.from(it) }

    @Transactional
    fun createBulk(requests: List<CreateMeterReadingRequest>): List<MeterReadingResponse> {
        return requests.map { req ->
            val building = buildingRepository.findById(req.buildingId)
                .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
            val room = req.roomId?.let { roomRepository.findById(it).orElse(null) }

            val entity = MeterReading(
                building = building,
                room = room,
                type = req.type,
                readingDate = req.readingDate,
                readingValue = req.readingValue,
                usage = req.usage,
                amount = req.amount,
                periodStart = req.periodStart,
                periodEnd = req.periodEnd,
                billingMonth = req.billingMonth,
                customerNumber = req.customerNumber,
                isMeterReplaced = req.isMeterReplaced,
                source = req.source,
            )
            MeterReadingResponse.from(repository.save(entity))
        }
    }
}
