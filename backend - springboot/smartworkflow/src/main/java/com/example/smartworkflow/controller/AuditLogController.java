package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.AuditLog;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.AuditLogRepository;
import com.example.smartworkflow.repository.UserRepository;
import com.example.smartworkflow.service.AuditService;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Bitácora de auditoría del sistema.
 * - SUPER_ADMIN: ve logs globales y por organización
 * - ADMIN: ve logs de su propia organización
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final UserRepository userRepository;

    /** Propiedades válidas para ordenar en AuditLog */
    private static final List<String> VALID_SORT_PROPERTIES = List.of(
        "id", "action", "entityType", "entityId", "ipAddress", "createdAt"
    );

    /**
     * Crea un Pageable seguro, validando que las propiedades de sort sean válidas.
     * Si no hay sorts válidos, usa createdAt,desc como default.
     */
    private Pageable createSafePageable(Pageable pageable) {
        if (pageable.getSort().isUnsorted()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        // Filtrar solo sorts válidos
        List<Sort.Order> validOrders = pageable.getSort().stream()
            .filter(order -> VALID_SORT_PROPERTIES.contains(order.getProperty()))
            .toList();

        if (validOrders.isEmpty()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
            Sort.by(validOrders));
    }

    // ── Logs globales (solo SUPER_ADMIN) ───────────────────────────────────────
    @GetMapping("/global")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> globalLogs(
            @RequestParam(required = false) String action,
            @Parameter(description = "Paginación y ordenamiento. Ejemplo de sort: createdAt,desc o action,asc")
            Pageable pageable) {
        Page<AuditLog> logs;
        if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByAction(action, createSafePageable(pageable));
        } else {
            logs = auditLogRepository.findAll(createSafePageable(pageable));
        }
        return ResponseEntity.ok(logs);
    }

    // ── Logs de nivel sistema sin org (solo SUPER_ADMIN) ───────────────────────
    @GetMapping("/system")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> systemLogs(
            @RequestParam(required = false) String action,
            @Parameter(description = "Paginación y ordenamiento. Ejemplo de sort: createdAt,desc o action,asc")
            Pageable pageable) {
        Page<AuditLog> logs;
        if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByOrganizationIsNullAndAction(action, createSafePageable(pageable));
        } else {
            logs = auditLogRepository.findByOrganizationIsNull(createSafePageable(pageable));
        }
        return ResponseEntity.ok(logs);
    }

    // ── Logs de una org específica (SUPER_ADMIN o ADMIN de esa org) ────────────
    @GetMapping("/org/{orgId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Page<AuditLog>> orgLogs(
            @PathVariable UUID orgId,
            @RequestParam(required = false) String action,
            @RequestAttribute(value = "orgId", required = false) UUID callerOrgId,
            @RequestAttribute("role") String role,
            @Parameter(description = "Paginación y ordenamiento. Ejemplo de sort: createdAt,desc o action,asc")
            Pageable pageable) {

        // Un ADMIN solo puede ver logs de su propia org
        if ("ADMIN".equals(role) && !orgId.equals(callerOrgId)) {
            return ResponseEntity.status(403).build();
        }

        Page<AuditLog> logs;
        if (action != null && !action.isBlank()) {
            logs = auditLogRepository.findByOrganizationIdAndAction(orgId, action, createSafePageable(pageable));
        } else {
            logs = auditLogRepository.findByOrganizationId(orgId, createSafePageable(pageable));
        }
        return ResponseEntity.ok(logs);
    }

    // ── Reportar ubicación desde el dispositivo ────────────────────────────────
    @PostMapping("/location")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','MANAGER','OFFICER')")
    @Transactional
    public ResponseEntity<?> reportLocation(
            HttpServletRequest request,
            @RequestAttribute("userId") UUID userId,
            @RequestBody Map<String, String> locationData) {

        User user = userRepository.findById(userId).orElseThrow();

        String country = locationData.get("country");
        String city = locationData.get("city");
        String region = locationData.get("region");

        auditService.logLocationChange(request, user, country, city, region);

        return ResponseEntity.ok(Map.of(
            "message", "Ubicación registrada",
            "country", country != null ? country : "unknown",
            "city", city != null ? city : "unknown"
        ));
    }

    // ── Lista de acciones disponibles ───────────────────────────────────────────
    @GetMapping("/actions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<String>> getAvailableActions() {
        return ResponseEntity.ok(List.of(
            AuditService.ACTION_LOGIN,
            AuditService.ACTION_LOGOUT,
            AuditService.ACTION_LOGIN_FAILED,
            AuditService.ACTION_REFRESH_TOKEN,
            AuditService.ACTION_IMPERSONATE,
            AuditService.ACTION_CREATE_ORG,
            AuditService.ACTION_UPDATE_ORG,
            AuditService.ACTION_DELETE_ORG,
            AuditService.ACTION_CREATE_USER,
            AuditService.ACTION_UPDATE_USER,
            AuditService.ACTION_DELETE_USER,
            AuditService.ACTION_CREATE_CASE,
            AuditService.ACTION_UPDATE_CASE,
            AuditService.ACTION_DELETE_CASE,
            AuditService.ACTION_LOCATION_CHANGE
        ));
    }
}
