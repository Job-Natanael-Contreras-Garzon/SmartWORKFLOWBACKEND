package com.example.smartworkflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"email", "org_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * NULL para el SUPER_ADMIN (usuario de sistema sin organización).
     * NOT NULL para ADMIN, MANAGER y OFFICER.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = true)
    private Organization organization;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /**
     * Roles válidos: SUPER_ADMIN | ADMIN | MANAGER | OFFICER
     */
    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    /** Helpers de conveniencia */
    public boolean isSuperAdmin() { return "SUPER_ADMIN".equals(role); }
    public boolean isAdmin()      { return "ADMIN".equals(role); }
    public boolean isManager()    { return "MANAGER".equals(role); }
    public boolean isOfficer()    { return "OFFICER".equals(role); }
    public boolean isActive()     { return "ACTIVE".equals(status); }
}