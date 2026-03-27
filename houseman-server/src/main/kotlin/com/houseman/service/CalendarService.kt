package com.houseman.service

import com.houseman.domain.calendar.CalendarEvent
import com.houseman.domain.calendar.dto.CalendarEventResponse
import com.houseman.domain.calendar.dto.CreateCalendarEventRequest
import com.houseman.domain.calendar.dto.UpdateCalendarEventRequest
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.repository.BuildingRepository
import com.houseman.repository.CalendarEventRepository
import com.houseman.repository.RoomRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.YearMonth

@Service
@Transactional(readOnly = true)
class CalendarService(
    private val calendarEventRepository: CalendarEventRepository,
    private val buildingRepository: BuildingRepository,
    private val roomRepository: RoomRepository,
) {

    fun findAll(year: Int?, month: Int?): List<CalendarEventResponse> {
        val events = if (year != null && month != null) {
            val ym = YearMonth.of(year, month)
            calendarEventRepository.findByDateBetween(ym.atDay(1), ym.atEndOfMonth())
        } else {
            calendarEventRepository.findAllWithJoins()
        }
        return events.map { CalendarEventResponse.from(it) }
    }

    fun findById(id: Long): CalendarEventResponse {
        val event = calendarEventRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CALENDAR_EVENT_NOT_FOUND) }
        return CalendarEventResponse.from(event)
    }

    @Transactional
    fun create(request: CreateCalendarEventRequest): CalendarEventResponse {
        val building = request.buildingId?.let {
            buildingRepository.findById(it)
                .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        }
        val room = request.roomId?.let {
            roomRepository.findById(it)
                .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }
        }

        val event = CalendarEvent(
            date = request.date,
            type = request.type,
            building = building,
            room = room,
            name = request.name,
            color = request.color ?: "#3B82F6",
        )
        return CalendarEventResponse.from(calendarEventRepository.save(event))
    }

    @Transactional
    fun update(id: Long, request: UpdateCalendarEventRequest): CalendarEventResponse {
        val event = calendarEventRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CALENDAR_EVENT_NOT_FOUND) }

        request.date?.let { event.date = it }
        request.type?.let { event.type = it }
        request.name?.let { event.name = it }
        request.color?.let { event.color = it }

        if (request.buildingId != null) {
            event.building = buildingRepository.findById(request.buildingId)
                .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        }
        if (request.roomId != null) {
            event.room = roomRepository.findById(request.roomId)
                .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }
        }

        return CalendarEventResponse.from(calendarEventRepository.save(event))
    }

    @Transactional
    fun delete(id: Long) {
        val event = calendarEventRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.CALENDAR_EVENT_NOT_FOUND) }
        calendarEventRepository.delete(event)
    }
}
