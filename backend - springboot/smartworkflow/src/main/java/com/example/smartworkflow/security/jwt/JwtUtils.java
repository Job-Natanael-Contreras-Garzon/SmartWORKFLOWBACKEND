package com.example.smartworkflow.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    /** 15 minutos para el Access Token */
    private final long ACCESS_TOKEN_EXPIRATION  = 15 * 60 * 1000L;
    /** 7 días para el Refresh Token */
    private final long REFRESH_TOKEN_EXPIRATION = 7L * 24 * 60 * 60 * 1000;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Genera el Access Token con todos los claims necesarios para el frontend.
     *
     * @param userId  ID del usuario
     * @param orgId   ID de la organización (null para SUPER_ADMIN)
     * @param orgSlug Slug de la organización (null para SUPER_ADMIN)
     * @param role    Rol del usuario (SUPER_ADMIN, ADMIN, MANAGER, OFFICER)
     * @param deptId  ID del departamento (null para ADMIN y SUPER_ADMIN)
     */
    public String generateAccessToken(UUID userId, UUID orgId, String orgSlug, String role, UUID deptId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("orgId",   orgId   != null ? orgId.toString()   : null)
                .claim("orgSlug", orgSlug)
                .claim("role",    role)
                .claim("deptId",  deptId  != null ? deptId.toString()  : null)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}