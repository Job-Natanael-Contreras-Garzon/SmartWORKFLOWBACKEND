package com.example.smartworkflow.security;

import com.example.smartworkflow.security.jwt.JwtUtils;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Filtro JWT que valida el Bearer token en cada petición HTTP,
 * establece el SecurityContext y propaga los claims del token
 * como request attributes para que los controllers puedan usarlos.
 *
 * Attributes inyectados:
 *   userId  → UUID    (siempre presente)
 *   orgId   → UUID    (null para SUPER_ADMIN)
 *   orgSlug → String  (null para SUPER_ADMIN)
 *   role    → String  (SUPER_ADMIN | ADMIN | MANAGER | OFFICER)
 *   deptId  → UUID    (null para ADMIN y SUPER_ADMIN)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (!jwtUtils.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Sólo poblamos el contexto si aún no hay autenticación
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            Claims claims = jwtUtils.extractClaims(token);

            String userId  = claims.getSubject();
            String role    = claims.get("role",    String.class);
            String orgId   = claims.get("orgId",   String.class);
            String orgSlug = claims.get("orgSlug", String.class);
            String deptId  = claims.get("deptId",  String.class);

            // Spring Security authorities
            var authorities = (role != null)
                    ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    : List.<SimpleGrantedAuthority>of();

            var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);

            // Propagar claims como request attributes para los controllers
            request.setAttribute("userId",  UUID.fromString(userId));
            request.setAttribute("role",    role);

            if (orgId != null) {
                request.setAttribute("orgId", UUID.fromString(orgId));
            }
            if (orgSlug != null) {
                request.setAttribute("orgSlug", orgSlug);
            }
            if (deptId != null) {
                request.setAttribute("deptId", UUID.fromString(deptId));
            }
        }

        filterChain.doFilter(request, response);
    }
}
