package com.houseman.security

import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtProvider(
    @Value("\${jwt.secret}") secret: String,
    @Value("\${jwt.access-expiration}") private val accessExpiration: Long,
    @Value("\${jwt.refresh-expiration}") private val refreshExpiration: Long
) {

    private val log = LoggerFactory.getLogger(javaClass)
    private val key: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray())

    fun createAccessToken(staffId: Long, roles: List<String>): String {
        val now = Date()
        return Jwts.builder()
            .subject(staffId.toString())
            .claim("roles", roles)
            .issuedAt(now)
            .expiration(Date(now.time + accessExpiration))
            .signWith(key)
            .compact()
    }

    fun createRefreshToken(staffId: Long): String {
        val now = Date()
        return Jwts.builder()
            .subject(staffId.toString())
            .claim("type", "refresh")
            .issuedAt(now)
            .expiration(Date(now.time + refreshExpiration))
            .signWith(key)
            .compact()
    }

    fun validateToken(token: String): Boolean {
        return try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token)
            true
        } catch (e: ExpiredJwtException) {
            log.debug("JWT expired: {}", e.message)
            false
        } catch (e: Exception) {
            log.debug("JWT invalid: {}", e.message)
            false
        }
    }

    fun getStaffIdFromToken(token: String): Long {
        val claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
        return claims.subject.toLong()
    }

    @Suppress("UNCHECKED_CAST")
    fun getRolesFromToken(token: String): List<String> {
        val claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload
        return claims.get("roles", List::class.java) as? List<String> ?: emptyList()
    }
}
