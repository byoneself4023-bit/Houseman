package com.houseman.service

import com.houseman.domain.vacancy.Vacancy
import com.houseman.domain.vacancy.dto.CreateVacancyRequest
import com.houseman.domain.vacancy.dto.UpdateVacancyRequest
import com.houseman.domain.vacancy.dto.VacancyResponse
import com.houseman.global.exception.BusinessException
import com.houseman.global.exception.ErrorCode
import com.houseman.global.sse.SseEmitterManager
import com.houseman.global.sse.SseEventData
import com.houseman.global.sse.SseEventType
import com.houseman.repository.BuildingRepository
import com.houseman.repository.RoomRepository
import com.houseman.repository.VacancyRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class VacancyService(
    private val vacancyRepository: VacancyRepository,
    private val buildingRepository: BuildingRepository,
    private val roomRepository: RoomRepository,
    private val sseEmitterManager: SseEmitterManager,
) {

    fun findAll(buildingId: Long?): List<VacancyResponse> {
        val vacancies = if (buildingId != null) {
            vacancyRepository.findByBuildingIdWithJoins(buildingId)
        } else {
            vacancyRepository.findAllWithBuildingAndRoom()
        }
        return vacancies.map { VacancyResponse.from(it) }
    }

    fun findById(id: Long): VacancyResponse {
        val vacancy = vacancyRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.VACANCY_NOT_FOUND) }
        return VacancyResponse.from(vacancy)
    }

    @Transactional
    fun create(request: CreateVacancyRequest): VacancyResponse {
        val building = buildingRepository.findById(request.buildingId)
            .orElseThrow { BusinessException(ErrorCode.BUILDING_NOT_FOUND) }
        val room = roomRepository.findById(request.roomId)
            .orElseThrow { BusinessException(ErrorCode.ROOM_NOT_FOUND) }

        val vacancy = Vacancy(
            building = building,
            room = room,
            type = request.type,
            commBroker = request.commBroker,
            commEvent = request.commEvent,
            pw = request.pw,
            deposit = request.deposit,
            rent = request.rent,
            nego = request.nego,
            mgmt = request.mgmt,
            water = request.water,
            cable = request.cable,
            exitFee = request.exitFee,
            days = request.days,
            status = request.status,
        )
        val saved = VacancyResponse.from(vacancyRepository.save(vacancy))

        try {
            sseEmitterManager.broadcast(
                SseEventType.VACANCY_CREATED,
                SseEventData(
                    type = SseEventType.VACANCY_CREATED,
                    message = "${building.name} ${room.roomNumber} 공실 등록",
                    buildingName = building.name,
                    roomNumber = room.roomNumber,
                    data = mapOf("vacancyId" to saved.id),
                ),
            )
        } catch (_: Exception) { }

        return saved
    }

    @Transactional
    fun update(id: Long, request: UpdateVacancyRequest): VacancyResponse {
        val vacancy = vacancyRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.VACANCY_NOT_FOUND) }

        request.type?.let { vacancy.type = it }
        request.commBroker?.let { vacancy.commBroker = it }
        request.commEvent?.let { vacancy.commEvent = it }
        request.pw?.let { vacancy.pw = it }
        request.deposit?.let { vacancy.deposit = it }
        request.rent?.let { vacancy.rent = it }
        request.nego?.let { vacancy.nego = it }
        request.mgmt?.let { vacancy.mgmt = it }
        request.water?.let { vacancy.water = it }
        request.cable?.let { vacancy.cable = it }
        request.exitFee?.let { vacancy.exitFee = it }
        request.days?.let { vacancy.days = it }
        request.status?.let { vacancy.status = it }

        return VacancyResponse.from(vacancyRepository.save(vacancy))
    }

    @Transactional
    fun delete(id: Long) {
        val vacancy = vacancyRepository.findById(id)
            .orElseThrow { BusinessException(ErrorCode.VACANCY_NOT_FOUND) }
        vacancyRepository.delete(vacancy)
    }
}
