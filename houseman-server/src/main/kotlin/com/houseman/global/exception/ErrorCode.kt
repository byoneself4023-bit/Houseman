package com.houseman.global.exception

import org.springframework.http.HttpStatus

enum class ErrorCode(
    val status: HttpStatus,
    val code: String,
    val message: String
) {
    STAFF_NOT_FOUND(HttpStatus.NOT_FOUND, "ST001", "직원을 찾을 수 없습니다"),
    BUILDING_NOT_FOUND(HttpStatus.NOT_FOUND, "B001", "건물을 찾을 수 없습니다"),
    ROOM_NOT_FOUND(HttpStatus.NOT_FOUND, "R001", "호실을 찾을 수 없습니다"),
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "C001", "계약을 찾을 수 없습니다"),
    PAST_CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "C002", "퇴실 기록을 찾을 수 없습니다"),
    TRANSACTION_NOT_FOUND(HttpStatus.NOT_FOUND, "T001", "거래를 찾을 수 없습니다"),
    BILLING_CONFIG_NOT_FOUND(HttpStatus.NOT_FOUND, "BL001", "청구 설정을 찾을 수 없습니다"),
    BILLING_RECORD_NOT_FOUND(HttpStatus.NOT_FOUND, "BL002", "청구 내역을 찾을 수 없습니다"),
    SETTLEMENT_MASTER_NOT_FOUND(HttpStatus.NOT_FOUND, "SM001", "정산 마스터를 찾을 수 없습니다"),
    CALENDAR_EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "CE001", "캘린더 이벤트를 찾을 수 없습니다"),
    VACANCY_NOT_FOUND(HttpStatus.NOT_FOUND, "V001", "공실 정보를 찾을 수 없습니다"),
    SETTLEMENT_EXPENSE_NOT_FOUND(HttpStatus.NOT_FOUND, "SE001", "정산 비용을 찾을 수 없습니다"),
    CASHBOOK_ENTRY_NOT_FOUND(HttpStatus.NOT_FOUND, "CB001", "출납 항목을 찾을 수 없습니다"),
    CASHBOOK_DUPLICATE_SOURCE(HttpStatus.CONFLICT, "CB002", "이미 등록된 출납 항목입니다"),
    PARKING_NOT_FOUND(HttpStatus.NOT_FOUND, "PK001", "주차 정보를 찾을 수 없습니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A001", "연락처 또는 비밀번호가 일치하지 않습니다"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "A002", "토큰이 만료되었습니다"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "A003", "접근 권한이 없습니다"),
    CONCURRENT_MODIFICATION(HttpStatus.CONFLICT, "G002", "다른 사용자가 동시에 수정했습니다. 새로고침 후 다시 시도하세요"),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "G001", "잘못된 입력입니다"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "G999", "서버 오류가 발생했습니다"),
}
