package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    /** Bitácora de una org específica, ordenada por fecha desc */
    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID orgId, Pageable pageable);
    /** Acciones de nivel sistema (sin org) — solo SUPER_ADMIN */
    Page<AuditLog> findByOrganizationIsNullOrderByCreatedAtDesc(Pageable pageable);
    /** Todas las entradas (SUPER_ADMIN global view) */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
