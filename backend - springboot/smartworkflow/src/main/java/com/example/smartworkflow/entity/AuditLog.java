package com.example.smartworkflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Bitácora de acciones del sistema. Visible únicamente para el SUPER_ADMIN.
 * org_id = NULL indica una acción de nivel sistema (crear org, asignar admin, etc.)
 */
@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** NULL para acciones de nivel sistema (sin organización) */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organization organization;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Acción realizada. Ejemplos:
     * CREATE_ORG, CREATE_USER, LOGIN, CREATE_CASE, UPDATE_POLICY, etc.
     */
    @Column(nullable = false, length = 100)
    private String action;

    /** Tipo de entidad afectada: ORGANIZATION, USER, CASE, POLICY, etc. */
    @Column(name = "entity_type", length = 50)
    private String entityType;

    /** ID de la entidad afectada */
    @Column(name = "entity_id")
    private UUID entityId;

    /** IP del cliente que realizó la acción */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** Datos adicionales en formato JSON (antes/después, parámetros, etc.) */
    @Column(columnDefinition = "jsonb")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
