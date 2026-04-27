package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.Policy;
import com.example.smartworkflow.repository.PolicyRepository;
import com.example.smartworkflow.service.PolicyDeserializer;
import com.example.smartworkflow.model.graph.PolicyGraph;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class PolicyController {

    private final PolicyRepository policyRepository;
    private final PolicyDeserializer policyDeserializer;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<Policy>> getPolicies(@RequestAttribute("orgId") UUID orgId) {
        return ResponseEntity.ok(policyRepository.findByOrganizationId(orgId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Policy> createPolicy(@RequestBody Policy policy) {
        policy.setStatus("DRAFT");
        policy.setVersion(1);
        return ResponseEntity.ok(policyRepository.save(policy));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Policy> updatePolicyDetails(@PathVariable UUID id, @RequestBody Policy details) {
        Policy policy = policyRepository.findById(id).orElseThrow();
        policy.setName(details.getName());
        policy.setDescription(details.getDescription());
        return ResponseEntity.ok(policyRepository.save(policy));
    }

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Policy> publishPolicy(@PathVariable UUID id) {
        Policy policy = policyRepository.findById(id).orElseThrow();
        policy.setStatus("ACTIVE");
        return ResponseEntity.ok(policyRepository.save(policy));
    }

    @PutMapping("/{id}/deprecate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Policy> deprecatePolicy(@PathVariable UUID id) {
        Policy policy = policyRepository.findById(id).orElseThrow();
        policy.setStatus("DEPRECATED");
        return ResponseEntity.ok(policyRepository.save(policy));
    }

    @PutMapping("/{id}/diagram")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Policy> saveDiagram(@PathVariable UUID id, @RequestBody Map<String, Object> diagramJson) {
        Policy policy = policyRepository.findById(id).orElseThrow();
        policy.setDiagramJson(diagramJson);
        policy.setVersion(policy.getVersion() + 1); // Automatic Versioning
        return ResponseEntity.ok(policyRepository.save(policy));
    }

    @PostMapping("/{id}/validate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> validateGraph(@PathVariable UUID id) {
        Policy policy = policyRepository.findById(id).orElseThrow();
        List<String> messages = new ArrayList<>();
        
        if (policy.getDiagramJson() == null) {
            messages.add("Error: La política no tiene un diagrama asignado.");
            return ResponseEntity.badRequest().body(messages);
        }
        
        try {
            String json = objectMapper.writeValueAsString(policy.getDiagramJson());
            PolicyGraph graph = policyDeserializer.deserializeAndValidate(json); // Esta función ya valida START, END, conexiones y conectividad total.
            
            // Si no soltó excepcion durante deserializeAndValidate, significa que superó la prueba técnica
            messages.add("Éxito: Validado sin problemas.");
            return ResponseEntity.ok(messages);
        } catch (IllegalArgumentException e) {
            messages.add("Warning/Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(messages);
        } catch (Exception e) {
            messages.add("Excepción interna al procesar: " + e.getMessage());
            return ResponseEntity.internalServerError().body(messages);
        }
    }
}
