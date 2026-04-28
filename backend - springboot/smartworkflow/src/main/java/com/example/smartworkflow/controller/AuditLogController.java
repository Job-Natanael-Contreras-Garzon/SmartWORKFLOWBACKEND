package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.AuditLog;
import com.example.smartworkflow.repository.AuditLogRepository;
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

import java.util.List;
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
            @Parameter(description = "Paginación y ordenamiento. Ejemplo de sort: createdAt,desc o action,asc")
            Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findAll(createSafePageable(pageable)));
    }

    // ── Logs de nivel sistema sin org (solo SUPER_ADMIN) ───────────────────────
    @GetMapping("/system")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> systemLogs(
            @Parameter(description = "Paginación y ordenamiento. Ejemplo de sort: createdAt,desc o action,asc")
            Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findByOrganizationIsNull(createSafePageable(pageable)));
    }

    // ── Logs de una org específica (SUPER_ADMIN o ADMIN de esa org) ────────────
    @GetMapping("/org/{orgId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Page<AuditLog>> orgLogs(
            @PathVariable UUID orgId,
            @RequestAttribute(value = "orgId", required = false) UUID callerOrgId,
            @RequestAttribute("role") String role,
            @Parameter(description = "Paginación y ordenamiento. Ejemplo de sort: createdAt,desc o action,asc")
            Pageable pageable) {

        // Un ADMIN solo puede ver logs de su propia org
        if ("ADMIN".equals(role) && !orgId.equals(callerOrgId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(
                auditLogRepository.findByOrganizationId(orgId, createSafePageable(pageable)));
    }
}
