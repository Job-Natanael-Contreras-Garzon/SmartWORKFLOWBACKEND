package com.example.smartworkflow.controller;

import com.example.smartworkflow.dto.ClientResponseDTO;
import com.example.smartworkflow.dto.CreateClientRequest;
import com.example.smartworkflow.entity.Client;
import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.ClientRepository;
import com.example.smartworkflow.repository.OrganizationRepository;
import com.example.smartworkflow.repository.UserRepository;
import jakarta.validation.Valid;
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
    private final UserRepository userRepository;

    /** Helper para convertir Client a ClientResponseDTO */
    private ClientResponseDTO toResponseDTO(Client client) {
        ClientResponseDTO dto = new ClientResponseDTO();
        dto.setId(client.getId());
        dto.setName(client.getName());
        dto.setEmail(client.getEmail());
        dto.setPhone(client.getPhone());
        dto.setDni(client.getDni());
        dto.setCreatedAt(client.getCreatedAt());

        // Cargar datos de organización (ya está inicializada en el contexto de la query)
        if (client.getOrganization() != null) {
            dto.setOrgId(client.getOrganization().getId());
            dto.setOrgName(client.getOrganization().getName());
        }

        // Cargar datos del creador si existe
        if (client.getCreatedBy() != null) {
            dto.setCreatedById(client.getCreatedBy().getId());
            dto.setCreatedByName(client.getCreatedBy().getName());
        }

        return dto;
    }

    // ── Listar clientes de la org del usuario autenticado ──────────────────────
    @GetMapping
    public ResponseEntity<List<ClientResponseDTO>> list(
            @RequestAttribute("orgId") UUID orgId,
            @RequestParam(required = false) String search) {

        List<Client> clients;
        if (search != null && !search.isBlank()) {
            clients = clientRepository.findByOrganizationIdAndNameContainingIgnoreCase(orgId, search);
        } else {
            clients = clientRepository.findByOrganizationId(orgId);
        }

        return ResponseEntity.ok(clients.stream()
                .map(this::toResponseDTO)
                .toList());
    }

    // ── Obtener un cliente por ID ──────────────────────────────────────────────
    @GetMapping("/{clientId}")
    public ResponseEntity<ClientResponseDTO> getById(
            @PathVariable UUID clientId,
            @RequestAttribute("orgId") UUID orgId) {

        return clientRepository.findByIdWithRelations(clientId)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .map(this::toResponseDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Crear nuevo cliente ────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ClientResponseDTO> create(
            @RequestAttribute("orgId") UUID orgId,
            @RequestAttribute("userId") UUID userId,
            @Valid @RequestBody CreateClientRequest request) {

        Organization org = organizationRepository.findById(orgId).orElseThrow();
        User creator = userRepository.findById(userId).orElse(null);

        Client client = new Client();
        client.setOrganization(org);
        client.setName(request.getName());
        client.setEmail(request.getEmail());
        client.setPhone(request.getPhone());
        client.setDni(request.getDni());
        client.setCreatedBy(creator);

        client = clientRepository.save(client);
        return ResponseEntity.ok(toResponseDTO(client));
    }

    // ── Actualizar cliente existente ───────────────────────────────────────────
    @PutMapping("/{clientId}")
    public ResponseEntity<ClientResponseDTO> update(
            @PathVariable UUID clientId,
            @RequestAttribute("orgId") UUID orgId,
            @Valid @RequestBody CreateClientRequest request) {

        return clientRepository.findById(clientId)
                .filter(c -> c.getOrganization().getId().equals(orgId))
                .map(client -> {
                    if (request.getName() != null) client.setName(request.getName());
                    if (request.getEmail() != null) client.setEmail(request.getEmail());
                    if (request.getPhone() != null) client.setPhone(request.getPhone());
                    if (request.getDni() != null) client.setDni(request.getDni());
                    return ResponseEntity.ok(toResponseDTO(clientRepository.save(client)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
