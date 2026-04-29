package com.example.smartworkflow.service;

import com.example.smartworkflow.entity.AuditLog;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio para registrar eventos de auditoría.
 * Captura automáticamente IP, User-Agent y otros datos de sesión.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    /** Acciones de auditoría predefinidas */
    public static final String ACTION_LOGIN = "LOGIN";
    public static final String ACTION_LOGOUT = "LOGOUT";
    public static final String ACTION_LOGIN_FAILED = "LOGIN_FAILED";
    public static final String ACTION_REFRESH_TOKEN = "REFRESH_TOKEN";
    public static final String ACTION_IMPERSONATE = "IMPERSONATE";
    public static final String ACTION_CREATE_ORG = "CREATE_ORG";
    public static final String ACTION_UPDATE_ORG = "UPDATE_ORG";
    public static final String ACTION_DELETE_ORG = "DELETE_ORG";
    public static final String ACTION_CREATE_USER = "CREATE_USER";
    public static final String ACTION_UPDATE_USER = "UPDATE_USER";
    public static final String ACTION_DELETE_USER = "DELETE_USER";
    public static final String ACTION_CREATE_CASE = "CREATE_CASE";
    public static final String ACTION_UPDATE_CASE = "UPDATE_CASE";
    public static final String ACTION_DELETE_CASE = "DELETE_CASE";
    public static final String ACTION_LOCATION_CHANGE = "LOCATION_CHANGE";

    /**
     * Registra un evento de auditoría con información de request HTTP.
     * Captura automáticamente: IP real del cliente, User-Agent.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(HttpServletRequest request, User user, String action,
                         String entityType, UUID entityId, Map<String, Object> metadata) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setOrganization(user != null ? user.getOrganization() : null);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setIpAddress(extractClientIp(request));

        // Construir metadata con info del dispositivo
        Map<String, Object> fullMetadata = new HashMap<>();
        if (metadata != null) {
            fullMetadata.putAll(metadata);
        }

        // Agregar info del dispositivo
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && !userAgent.isBlank()) {
            fullMetadata.put("userAgent", userAgent);
        }

        // Geolocalización (si viene en headers de proxy/CDN)
        String cfCountry = request.getHeader("CF-IPCountry"); // Cloudflare
        String cfCity = request.getHeader("CF-IPCity");
        if (cfCountry != null) {
            fullMetadata.put("country", cfCountry);
        }
        if (cfCity != null) {
            fullMetadata.put("city", cfCity);
        }

        log.setMetadata(toJson(fullMetadata));
        auditLogRepository.save(log);
    }

    /**
     * Registra evento de login exitoso.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogin(HttpServletRequest request, User user, String orgSlug) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("success", true);
        metadata.put("role", user.getRole());
        if (orgSlug != null) {
            metadata.put("orgSlug", orgSlug);
        }

        logEvent(request, user, ACTION_LOGIN, "SESSION", user.getId(), metadata);
    }

    /**
     * Registra evento de login fallido.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLoginFailed(HttpServletRequest request, String email, String reason) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("success", false);
        metadata.put("email", email);
        metadata.put("reason", reason);

        AuditLog log = new AuditLog();
        log.setUser(null); // No hay usuario autenticado
        log.setOrganization(null);
        log.setAction(ACTION_LOGIN_FAILED);
        log.setEntityType("SESSION");
        log.setEntityId(null);
        log.setIpAddress(extractClientIp(request));

        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && !userAgent.isBlank()) {
            metadata.put("userAgent", userAgent);
        }

        log.setMetadata(toJson(metadata));
        auditLogRepository.save(log);
    }

    /**
     * Registra evento de logout.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogout(HttpServletRequest request, User user) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("role", user.getRole());

        logEvent(request, user, ACTION_LOGOUT, "SESSION", user.getId(), metadata);
    }

    /**
     * Registra cambio de ubicación (para tracking geográfico).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLocationChange(HttpServletRequest request, User user,
                                   String country, String city, String region) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("country", country);
        metadata.put("city", city);
        if (region != null) {
            metadata.put("region", region);
        }

        logEvent(request, user, ACTION_LOCATION_CHANGE, "SESSION", user.getId(), metadata);
    }

    /**
     * Extrae la IP real del cliente considerando proxies (X-Forwarded-For, etc.)
     */
    private String extractClientIp(HttpServletRequest request) {
        // Headers comunes usados por proxies/CDNs
        String[] headers = {
            "X-Forwarded-For",
            "X-Real-IP",
            "CF-Connecting-IP", // Cloudflare
            "True-Client-IP"
        };

        for (String header : headers) {
            String value = request.getHeader(header);
            if (value != null && !value.isBlank() && !"unknown".equalsIgnoreCase(value)) {
                // X-Forwarded-For puede tener múltiples IPs, tomar la primera (cliente original)
                if (value.contains(",")) {
                    value = value.split(",")[0].trim();
                }
                return value;
            }
        }

        // Fallback a la IP directa
        return request.getRemoteAddr();
    }

    @SneakyThrows
    private String toJson(Map<String, Object> metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            // Fallback: retornar objeto vacío si hay error
            return "{}";
        }
    }
}
