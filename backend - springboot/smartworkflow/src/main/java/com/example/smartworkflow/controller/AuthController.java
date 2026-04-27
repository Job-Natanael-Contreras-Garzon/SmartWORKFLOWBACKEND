package com.example.smartworkflow.controller;

import com.example.smartworkflow.dto.LoginRequest;
import com.example.smartworkflow.dto.LoginResponse;
import com.example.smartworkflow.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Object[] result = authService.authenticateUser(request);
        String setCookieHeader = (String) result[0];
        LoginResponse response = (LoginResponse) result[1];

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, setCookieHeader)
                .body(response);
    }

    @PostMapping("/impersonate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<LoginResponse> impersonate(@RequestBody Map<String, UUID> requestBody) {
        UUID targetUserId = requestBody.get("targetUserId");
        if (targetUserId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Object[] result = authService.impersonateUser(targetUserId);
        String setCookieHeader = (String) result[0];
        LoginResponse response = (LoginResponse) result[1];

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, setCookieHeader)
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "No refresh token cookie presente"));
        }
        String refreshToken = Arrays.stream(request.getCookies())
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);

        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Refresh token no encontrado"));
        }

        Object[] result = authService.refreshFromToken(refreshToken);
        String setCookieHeader = (String) result[0];
        LoginResponse response = (LoginResponse) result[1];

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, setCookieHeader)
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Invalidar la cookie de refresh enviando una vacía y expirada
        String clearCookie = "refreshToken=; HttpOnly; Secure; Path=/api/auth/refresh; Max-Age=0; SameSite=Strict";
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie)
                .body(Map.of("message", "Sesión cerrada correctamente"));
    }
}
