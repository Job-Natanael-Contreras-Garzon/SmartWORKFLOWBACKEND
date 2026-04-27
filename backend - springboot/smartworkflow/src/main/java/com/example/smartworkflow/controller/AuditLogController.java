package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.AuditLog;
import com.example.smartworkflow.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

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

    // ── Logs globales (solo SUPER_ADMIN) ───────────────────────────────────────
    @GetMapping("/global")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> globalLogs(Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    // ── Logs de nivel sistema sin org (solo SUPER_ADMIN) ───────────────────────
    @GetMapping("/system")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<AuditLog>> systemLogs(Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findByOrganizationIsNullOrderByCreatedAtDesc(pageable));
    }

    // ── Logs de una org específica (SUPER_ADMIN o ADMIN de esa org) ────────────
    @GetMapping("/org/{orgId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Page<AuditLog>> orgLogs(
            @PathVariable UUID orgId,
            @RequestAttribute(value = "orgId", required = false) UUID callerOrgId,
            @RequestAttribute("role") String role,
            Pageable pageable) {

        // Un ADMIN solo puede ver logs de su propia org
        if ("ADMIN".equals(role) && !orgId.equals(callerOrgId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(
                auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId, pageable));
    }
}
