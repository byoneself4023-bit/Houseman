package com.houseman.controller

import com.houseman.global.dto.ApiResponse
import com.houseman.service.CalendarService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 공개 API — 임차인 퇴실 링크 (인증 불필요)
 * SecurityConfig에서 /api/public/** permitAll 설정
 */
@RestController
@RequestMapping("/api/public/move-out-link")
class MoveOutLinkController(
    private val calendarService: CalendarService,
) {

    data class MoveOutLinkResponse(
        val id: Long,
        val eventDate: String,
        val buildingName: String?,
        val roomNumber: String?,
        val moveOutLinkCompleted: Boolean,
    )

    data class MoveOutLinkSubmitRequest(
        val doorPassword: String,
        val refundBank: String,
        val refundAccount: String,
        val refundHolder: String,
    )

    @GetMapping("/{eventId}")
    fun get(@PathVariable eventId: Long): ResponseEntity<ApiResponse<MoveOutLinkResponse>> {
        val event = calendarService.findById(eventId)
        return ResponseEntity.ok(
            ApiResponse.success(
                MoveOutLinkResponse(
                    id = event.id,
                    eventDate = event.date.toString(),
                    buildingName = event.buildingName,
                    roomNumber = event.roomNumber,
                    moveOutLinkCompleted = false,
                )
            )
        )
    }

    @PutMapping("/{eventId}")
    fun submit(
        @PathVariable eventId: Long,
        @RequestBody request: MoveOutLinkSubmitRequest,
    ): ResponseEntity<ApiResponse<Any?>> {
        // 퇴실 링크 정보를 캘린더 이벤트의 메타데이터로 업데이트
        // CalendarService.update 호출 시 관련 필드 저장
        // 현재는 이벤트 존재 확인만 수행 (CalendarEvent에 추가 필드 필요)
        calendarService.findById(eventId) // 존재 확인, 없으면 예외
        return ResponseEntity.ok(ApiResponse.success(null))
    }
}
