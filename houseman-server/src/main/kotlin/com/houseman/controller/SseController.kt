package com.houseman.controller

import com.houseman.global.sse.SseEmitterManager
import com.houseman.security.UserPrincipal
import org.springframework.http.MediaType
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter

@RestController
class SseController(
    private val sseEmitterManager: SseEmitterManager,
) {

    @GetMapping("/api/sse/connect", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun connect(
        @AuthenticationPrincipal principal: UserPrincipal,
    ): SseEmitter {
        return sseEmitterManager.connect(principal.staffId)
    }
}
