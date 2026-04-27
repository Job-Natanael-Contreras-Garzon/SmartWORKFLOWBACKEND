package com.example.smartworkflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "cases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WorkflowCase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    /**
     * Perfil del ciudadano/cliente al que pertenece el trámite.
     * Puede ser null si el caso fue creado sin asignar cliente aún.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    /**
     * Código legible usado por el ciudadano en /track.
     * Formato: {SLUG_ORG}-{AÑO}-{4 chars aleatorios}  → ej. CRE-2026-A3F7
     */
    @Column(name = "tracking_code", nullable = false, unique = true, updatable = false, length = 20)
    private String trackingCode;

    @Column(nullable = false, length = 20)
    private String status = "OPEN"; // OPEN, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(nullable = false, length = 20)
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private ZonedDateTime startedAt;

    @Column(name = "completed_at")
    private ZonedDateTime completedAt;
}