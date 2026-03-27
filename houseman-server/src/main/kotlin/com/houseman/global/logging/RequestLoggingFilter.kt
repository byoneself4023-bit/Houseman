package com.houseman.global.logging

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

const val REQUEST_ID_KEY = "requestId"
const val REQUEST_ID_HEADER = "X-Request-Id"

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class RequestLoggingFilter : OncePerRequestFilter() {

    private val log = LoggerFactory.getLogger(javaClass)

    private val excludedPrefixes = listOf("/health", "/actuator")

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val path = request.requestURI
        val requestId = request.getHeader(REQUEST_ID_HEADER)
            ?: UUID.randomUUID().toString().substring(0, 8)

        MDC.put(REQUEST_ID_KEY, requestId)
        response.addHeader(REQUEST_ID_HEADER, requestId)

        if (excludedPrefixes.any { path.startsWith(it) }) {
            try {
                filterChain.doFilter(request, response)
            } finally {
                MDC.remove(REQUEST_ID_KEY)
            }
            return
        }

        val startTime = System.currentTimeMillis()
        try {
            filterChain.doFilter(request, response)
        } finally {
            val elapsed = System.currentTimeMillis() - startTime
            val status = response.status
            log.info("[REQ] {} {} {}ms -> {}", request.method, path, elapsed, status)
            MDC.remove(REQUEST_ID_KEY)
        }
    }
}
