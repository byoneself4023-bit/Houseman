package com.houseman.global.sse

data class SseEventData(
    val type: SseEventType,
    val message: String,
    val buildingName: String? = null,
    val roomNumber: String? = null,
    val data: Any? = null,
)
