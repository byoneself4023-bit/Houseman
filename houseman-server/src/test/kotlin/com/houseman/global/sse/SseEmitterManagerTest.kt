package com.houseman.global.sse

import com.fasterxml.jackson.databind.PropertyNamingStrategies
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test

class SseEmitterManagerTest {

    private lateinit var manager: SseEmitterManager

    @BeforeEach
    fun setUp() {
        val objectMapper = jacksonObjectMapper().apply {
            propertyNamingStrategy = PropertyNamingStrategies.SNAKE_CASE
        }
        manager = SseEmitterManager(objectMapper)
    }

    @Test
    @DisplayName("connect: SseEmitter 반환 + connectionCount 증가")
    fun connectReturnsEmitter() {
        val emitter = manager.connect(1L)
        assertNotNull(emitter)
        assertEquals(1, manager.connectionCount)
    }

    @Test
    @DisplayName("같은 staffId로 재연결 시 기존 emitter 교체")
    fun reconnectReplacesExisting() {
        manager.connect(1L)
        manager.connect(1L)
        assertEquals(1, manager.connectionCount)
    }

    @Test
    @DisplayName("disconnect: emitter 제거")
    fun disconnectRemovesEmitter() {
        manager.connect(1L)
        manager.disconnect(1L)
        assertEquals(0, manager.connectionCount)
    }

    @Test
    @DisplayName("broadcast: 연결된 emitter 없으면 예외 없이 통과")
    fun broadcastWithNoClients() {
        assertDoesNotThrow {
            manager.broadcast(
                SseEventType.OVERDUE_ALERT,
                SseEventData(type = SseEventType.OVERDUE_ALERT, message = "테스트"),
            )
        }
    }
}
