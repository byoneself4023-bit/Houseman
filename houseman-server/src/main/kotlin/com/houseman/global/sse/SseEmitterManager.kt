package com.houseman.global.sse

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

@Component
class SseEmitterManager(
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val emitters = ConcurrentHashMap<Long, SseEmitter>()

    companion object {
        const val SSE_TIMEOUT = 30L * 60 * 1000 // 30 minutes
        const val HEARTBEAT_INTERVAL = 30L // 30 seconds
    }

    private val heartbeatExecutor = Executors.newSingleThreadScheduledExecutor { r ->
        Thread(r, "sse-heartbeat").apply { isDaemon = true }
    }

    init {
        heartbeatExecutor.scheduleAtFixedRate(
            { sendHeartbeat() },
            HEARTBEAT_INTERVAL,
            HEARTBEAT_INTERVAL,
            TimeUnit.SECONDS,
        )
    }

    fun connect(staffId: Long): SseEmitter {
        emitters[staffId]?.complete()

        val emitter = SseEmitter(SSE_TIMEOUT)

        emitter.onCompletion {
            log.debug("SSE completed: staffId={}", staffId)
            emitters.remove(staffId)
        }
        emitter.onTimeout {
            log.debug("SSE timeout: staffId={}", staffId)
            emitters.remove(staffId)
        }
        emitter.onError { e ->
            log.debug("SSE error: staffId={}, error={}", staffId, e.message)
            emitters.remove(staffId)
        }

        emitters[staffId] = emitter
        log.info("SSE connected: staffId={}, total={}", staffId, emitters.size)

        sendToEmitter(
            emitter,
            SseEventType.CONNECTED,
            SseEventData(type = SseEventType.CONNECTED, message = "SSE 연결됨"),
        )

        return emitter
    }

    fun disconnect(staffId: Long) {
        emitters.remove(staffId)?.complete()
    }

    fun broadcast(eventType: SseEventType, data: SseEventData) {
        if (emitters.isEmpty()) return
        log.debug("SSE broadcast: type={}, clients={}", eventType, emitters.size)

        val deadEmitters = mutableListOf<Long>()
        emitters.forEach { (staffId, emitter) ->
            if (!sendToEmitter(emitter, eventType, data)) {
                deadEmitters.add(staffId)
            }
        }
        deadEmitters.forEach { emitters.remove(it) }
    }

    fun sendEvent(staffId: Long, eventType: SseEventType, data: SseEventData) {
        val emitter = emitters[staffId] ?: return
        if (!sendToEmitter(emitter, eventType, data)) {
            emitters.remove(staffId)
        }
    }

    val connectionCount: Int get() = emitters.size

    @PreDestroy
    fun shutdown() {
        heartbeatExecutor.shutdownNow()
        emitters.values.forEach { it.complete() }
        emitters.clear()
    }

    private fun sendToEmitter(emitter: SseEmitter, eventType: SseEventType, data: SseEventData): Boolean {
        return try {
            val event = SseEmitter.event()
                .name(eventType.name)
                .data(objectMapper.writeValueAsString(data))
            emitter.send(event)
            true
        } catch (e: Exception) {
            log.debug("Failed to send SSE event: {}", e.message)
            false
        }
    }

    private fun sendHeartbeat() {
        if (emitters.isEmpty()) return
        val deadEmitters = mutableListOf<Long>()
        emitters.forEach { (staffId, emitter) ->
            try {
                emitter.send(SseEmitter.event().comment("heartbeat"))
            } catch (e: Exception) {
                deadEmitters.add(staffId)
            }
        }
        deadEmitters.forEach { emitters.remove(it) }
    }
}
