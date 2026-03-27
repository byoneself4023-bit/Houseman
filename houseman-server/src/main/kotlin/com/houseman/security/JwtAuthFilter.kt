package com.houseman.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthFilter(
    private val jwtProvider: JwtProvider
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val token = resolveToken(request)

        if (token != null && jwtProvider.validateToken(token)) {
            val staffId = jwtProvider.getStaffIdFromToken(token)
            val roles = jwtProvider.getRolesFromToken(token)
            val principal = UserPrincipal(staffId, roles)
            val auth = UsernamePasswordAuthenticationToken(principal, null, principal.authorities)
            SecurityContextHolder.getContext().authentication = auth
        }

        filterChain.doFilter(request, response)
    }

    private fun resolveToken(request: HttpServletRequest): String? {
        val bearer = request.getHeader("Authorization")
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7)
        }
        // SSE 경로: EventSource API는 커스텀 헤더 불가 → query param fallback
        if (request.requestURI.startsWith("/api/sse/")) {
            return request.getParameter("token")
        }
        return null
    }
}
