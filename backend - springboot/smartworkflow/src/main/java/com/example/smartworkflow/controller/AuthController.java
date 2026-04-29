package com.example.smartworkflow.controller;

import com.example.smartworkflow.dto.LoginRequest;
import com.example.smartworkflow.dto.LoginResponse;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.UserRepository;
import com.example.smartworkflow.service.AuditService;
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
    private final AuditService auditService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            Object[] result = authService.authenticateUser(request);
            String setCookieHeader = (String) result[0];
            LoginResponse response = (LoginResponse) result[1];

            // Registrar login exitoso
            User user = userRepository.findById(response.getUserProfile().getId()).orElse(null);
            if (user != null) {
                auditService.logLogin(httpRequest, user, request.getOrgSlug());
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, setCookieHeader)
                    .body(response);
        } catch (IllegalArgumentException | IllegalStateException e) {
            // Registrar login fallido
            auditService.logLoginFailed(httpRequest, request.getEmail(), e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", "Credenciales inválidas"));
        }
    }

    @PostMapping("/impersonate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<LoginResponse> impersonate(@RequestBody Map<String, UUID> requestBody,
                                                      HttpServletRequest httpRequest,
                                                      @RequestAttribute(value = "userId", required = false) UUID adminUserId) {
        UUID targetUserId = requestBody.get("targetUserId");
        if (targetUserId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Object[] result = authService.impersonateUser(targetUserId);
        String setCookieHeader = (String) result[0];
        LoginResponse response = (LoginResponse) result[1];

        // Registrar impersonación
        User targetUser = userRepository.findById(targetUserId).orElse(null);
        User adminUser = adminUserId != null ? userRepository.findById(adminUserId).orElse(null) : null;
        if (targetUser != null && adminUser != null) {
            auditService.logEvent(httpRequest, adminUser, AuditService.ACTION_IMPERSONATE,
                "USER", targetUserId, Map.of(
                    "targetUserEmail", targetUser.getEmail(),
                    "targetUserName", targetUser.getName(),
                    "targetRole", targetUser.getRole()
                ));
        }

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
    public ResponseEntity<?> logout(HttpServletRequest request,
                                    @RequestAttribute(value = "userId", required = false) UUID userId) {
        // Registrar logout si tenemos el usuario
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user ->
                auditService.logLogout(request, user)
            );
        }

        // Invalidar la cookie de refresh enviando una vacía y expirada
        String clearCookie = "refreshToken=; HttpOnly; Secure; Path=/api/auth/refresh; Max-Age=0; SameSite=Strict";
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie)
                .body(Map.of("message", "Sesión cerrada correctamente"));
    }
}
