package com.houseman.global.exception

class BusinessException(
    val errorCode: ErrorCode
) : RuntimeException(errorCode.message)
