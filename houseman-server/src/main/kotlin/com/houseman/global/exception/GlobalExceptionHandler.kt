package com.houseman.global.exception

import com.houseman.global.dto.ApiResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.orm.ObjectOptimisticLockingFailureException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    private fun rid(): String = MDC.get("requestId") ?: "-"

    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(e: BusinessException): ResponseEntity<ApiResponse<Nothing>> {
        log.warn("[{}] BusinessException: {} - {}", rid(), e.errorCode.code, e.errorCode.message)
        return ResponseEntity
            .status(e.errorCode.status)
            .body(ApiResponse.error(e.errorCode.code, e.errorCode.message))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(e: MethodArgumentNotValidException): ResponseEntity<ApiResponse<Nothing>> {
        val details = e.bindingResult.fieldErrors.associate { it.field to (it.defaultMessage ?: "유효하지 않은 값") }
        log.warn("[{}] Validation error: {}", rid(), details)
        return ResponseEntity
            .badRequest()
            .body(ApiResponse.error("G001", "잘못된 입력입니다", details))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleInputException(e: HttpMessageNotReadableException): ResponseEntity<ApiResponse<Nothing>> {
        log.warn("[{}] Input error: {}", rid(), e.message)
        return ResponseEntity
            .badRequest()
            .body(ApiResponse.error("G001", "잘못된 입력입니다"))
    }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatusException(e: ResponseStatusException): ResponseEntity<ApiResponse<Nothing>> {
        log.warn("[{}] ResponseStatus: {} {}", rid(), e.statusCode.value(), e.reason)
        val code = if (e.statusCode.value() == 404) "G404" else "G${e.statusCode.value()}"
        val message = e.reason ?: "요청을 처리할 수 없습니다"
        return ResponseEntity
            .status(e.statusCode)
            .body(ApiResponse.error(code, message))
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException::class)
    fun handleOptimisticLock(e: ObjectOptimisticLockingFailureException): ResponseEntity<ApiResponse<Nothing>> {
        log.warn("[{}] Optimistic lock conflict: {}", rid(), e.message)
        val ec = ErrorCode.CONCURRENT_MODIFICATION
        return ResponseEntity
            .status(ec.status)
            .body(ApiResponse.error(ec.code, ec.message))
    }

    @ExceptionHandler(Exception::class)
    fun handleException(e: Exception): ResponseEntity<ApiResponse<Nothing>> {
        log.error("[{}] Unhandled exception: {}", rid(), e.message, e)
        return ResponseEntity
            .internalServerError()
            .body(ApiResponse.error("G999", "서버 오류가 발생했습니다"))
    }
}
