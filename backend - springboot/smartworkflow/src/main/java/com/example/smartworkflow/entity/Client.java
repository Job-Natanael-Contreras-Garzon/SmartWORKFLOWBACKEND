package com.example.smartworkflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Perfil de ciudadano/cliente creado por un OFFICER o MANAGER.
 * No tiene acceso al sistema — solo usa el tracking code en /track.
 */
@Entity
@Table(name = "clients")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    @Column
    private String email;

    @Column(length = 50)
    private String phone;

    /** Documento de identidad (cédula, DNI, etc.) */
    @Column(length = 50)
    private String dni;

    /** Usuario (OFFICER o MANAGER) que creó este perfil */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
