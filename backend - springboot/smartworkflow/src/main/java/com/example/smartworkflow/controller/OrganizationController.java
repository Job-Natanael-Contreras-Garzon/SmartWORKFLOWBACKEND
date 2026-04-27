package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.OrganizationRepository;
import com.example.smartworkflow.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * CRUD de organizaciones — exclusivo SUPER_ADMIN.
 * También permite crear el primer ADMIN de una org nueva.
 */
@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Listar todas las organizaciones ────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Organization>> listAll() {
        return ResponseEntity.ok(organizationRepository.findAll());
    }

    // ── Obtener una organización por ID ────────────────────────────────────────
    @GetMapping("/{orgId}")
    public ResponseEntity<Organization> getById(@PathVariable UUID orgId) {
        return organizationRepository.findById(orgId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Crear nueva organización ───────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateOrgRequest request) {
        // Validar slug único
        if (organizationRepository.findBySlug(request.getSlug()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Ya existe una organización con el slug: " + request.getSlug()));
        }

        Organization org = new Organization();
        org.setName(request.getName());
        org.setSlug(request.getSlug().toLowerCase().trim());
        org.setLogoUrl(request.getLogoUrl());
        org = organizationRepository.save(org);

        // Si se envió adminEmail, crear el primer ADMIN de la org
        if (request.getAdminEmail() != null && !request.getAdminEmail().isBlank()) {
            User admin = new User();
            admin.setOrganization(org);
            admin.setName(request.getAdminName() != null ? request.getAdminName() : "Admin " + org.getName());
            admin.setEmail(request.getAdminEmail());
            admin.setPasswordHash(passwordEncoder.encode(
                    request.getAdminPassword() != null ? request.getAdminPassword() : "changeme123"
            ));
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");
            userRepository.save(admin);
        }

        return ResponseEntity.ok(org);
    }

    // ── Actualizar organización ────────────────────────────────────────────────
    @PutMapping("/{orgId}")
    public ResponseEntity<?> update(@PathVariable UUID orgId, @RequestBody UpdateOrgRequest request) {
        return organizationRepository.findById(orgId)
                .map(org -> {
                    if (request.getName() != null) org.setName(request.getName());
                    if (request.getLogoUrl() != null) org.setLogoUrl(request.getLogoUrl());
                    return ResponseEntity.ok(organizationRepository.save(org));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Listar usuarios de una org ─────────────────────────────────────────────
    @GetMapping("/{orgId}/users")
    public ResponseEntity<List<User>> listOrgUsers(@PathVariable UUID orgId) {
        return ResponseEntity.ok(userRepository.findByOrganizationId(orgId));
    }

    // ── DTOs internos ──────────────────────────────────────────────────────────
    @Data
    public static class CreateOrgRequest {
        private String name;
        private String slug;
        private String logoUrl;
        // Opcional: crear el primer admin junto con la org
        private String adminName;
        private String adminEmail;
        private String adminPassword;
    }

    @Data
    public static class UpdateOrgRequest {
        private String name;
        private String logoUrl;
    }
}
