package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.Client;
import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.repository.ClientRepository;
import com.example.smartworkflow.repository.OrganizationRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Gestión de clientes (ciudadanos) dentro de una organización.
 * Solo OFFICER y MANAGER pueden crear/listar clientes de su org.
 */
@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OFFICER','MANAGER','ADMIN')")
public class ClientController {

    private final ClientRepository clientRepository;
    private final OrganizationRepository organizationRepository;

    // ── Listar clientes de la org del usuario autenticado ──────────────────────
    @GetMapping
    public ResponseEntity<List<Client>> list(
            @RequestAttribute("orgId") UUID orgId,
            @RequestParam(required = false) String search) {

        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(
                    clientRepository.findByOrganizationIdAndNameContainingIgnoreCase(orgId, search));
        }
        return ResponseEntity.ok(clientRepository.findByOrganizationId(orgId));
    }

    // ── Obtener un cliente por ID ──────────────────────────────────────────────
    @GetMapping("/{clientId}")
    public ResponseEntity<Client> getById(
            @PathVariable UUID clientId,
            @RequestAttribute("orgId") UUID orgId) {

        return clientRepository.findById(clientId)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Crear nuevo cliente ────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Client> create(
            @RequestAttribute("orgId") UUID orgId,
            @RequestAttribute("userId") UUID userId,
            @RequestBody CreateClientRequest request) {

        Organization org = organizationRepository.findById(orgId).orElseThrow();

        Client client = new Client();
        client.setOrganization(org);
        client.setName(request.getName());
        client.setEmail(request.getEmail());
        client.setPhone(request.getPhone());
        client.setDni(request.getDni());
        // createdBy se establece como UUID directo del usuario que lo crea
        // (la entidad tiene un campo createdBy tipo User, se resuelve abajo)

        client = clientRepository.save(client);
        return ResponseEntity.ok(client);
    }

    // ── Actualizar cliente existente ───────────────────────────────────────────
    @PutMapping("/{clientId}")
    public ResponseEntity<?> update(
            @PathVariable UUID clientId,
            @RequestAttribute("orgId") UUID orgId,
            @RequestBody CreateClientRequest request) {

        return clientRepository.findById(clientId)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .map(client -> {
                    if (request.getName() != null) client.setName(request.getName());
                    if (request.getEmail() != null) client.setEmail(request.getEmail());
                    if (request.getPhone() != null) client.setPhone(request.getPhone());
                    if (request.getDni() != null) client.setDni(request.getDni());
                    return ResponseEntity.ok(clientRepository.save(client));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @Data
    public static class CreateClientRequest {
        private String name;
        private String email;
        private String phone;
        private String dni;
    }
}
