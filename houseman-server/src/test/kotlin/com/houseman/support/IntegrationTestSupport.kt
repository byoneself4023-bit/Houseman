package com.houseman.support

import com.fasterxml.jackson.databind.ObjectMapper
import com.houseman.security.JwtProvider
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.transaction.annotation.Transactional

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
abstract class IntegrationTestSupport {

    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @Autowired
    lateinit var jwtProvider: JwtProvider

    /** staffId=1 (박종호 대표, general) 기준 토큰 생성 */
    fun createToken(staffId: Long = 1, roles: List<String> = listOf("general")): String =
        jwtProvider.createAccessToken(staffId, roles)

    fun createRefreshToken(staffId: Long = 1): String =
        jwtProvider.createRefreshToken(staffId)
}
