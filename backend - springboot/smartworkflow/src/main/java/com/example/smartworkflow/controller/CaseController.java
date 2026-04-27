package com.example.smartworkflow.controller;

import com.example.smartworkflow.dto.CaseStartRequest;
import com.example.smartworkflow.dto.CaseTrackingResponse;
import com.example.smartworkflow.entity.CaseToken;
import com.example.smartworkflow.entity.Client;
import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.Policy;
import com.example.smartworkflow.entity.WorkflowCase;
import com.example.smartworkflow.repository.CaseTokenRepository;
import com.example.smartworkflow.repository.ClientRepository;
import com.example.smartworkflow.repository.OrganizationRepository;
import com.example.smartworkflow.repository.PolicyRepository;
import com.example.smartworkflow.repository.WorkflowCaseRepository;
import com.example.smartworkflow.repository.UserRepository;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.service.CaseEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseEngine caseEngine;
    private final PolicyRepository policyRepository;
    private final OrganizationRepository organizationRepository;
    private final WorkflowCaseRepository workflowCaseRepository;
    private final CaseTokenRepository caseTokenRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @PostMapping
    public ResponseEntity<Map<String, String>> startNewCase(
            @RequestAttribute(value = "orgId", required = false) UUID orgIdHeader,
            @RequestBody CaseStartRequest request) {

        UUID targetOrgId = request.getOrgId() != null ? request.getOrgId() : orgIdHeader;
        if (targetOrgId == null) {
            return ResponseEntity.badRequest().build();
        }

        Policy policy = policyRepository.findById(request.getPolicyId()).orElseThrow();
        Organization org = organizationRepository.findById(targetOrgId).orElseThrow();

        // Resolver cliente: si viene clientId lo usamos, si no, buscamos por nombre en la org
        Client client = request.getClientId() != null
                ? clientRepository.findById(request.getClientId()).orElseThrow()
                : null;

        WorkflowCase newCase = caseEngine.startCase(policy, org, client);

        if (request.getInitialFormData() != null && !request.getInitialFormData().isEmpty()) {
            java.util.List<CaseToken> startTokens = caseTokenRepository.findByWorkflowCaseId(newCase.getId());
            if (!startTokens.isEmpty()) {
                caseEngine.completeActivity(startTokens.get(0).getId(), request.getInitialFormData());
            }
        }

        return ResponseEntity.ok(Map.of("trackingCode", newCase.getTrackingCode()));
    }

    @GetMapping("/track/{trackingCode}")
    public ResponseEntity<CaseTrackingResponse> trackCase(@PathVariable String trackingCode) {
        WorkflowCase wCase = workflowCaseRepository.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new IllegalArgumentException("Trámite no encontrado con código: " + trackingCode));

        List<CaseToken> allTokens = caseTokenRepository.findByWorkflowCaseId(wCase.getId());

        List<CaseTrackingResponse.TokenInfo> history = new ArrayList<>();
        List<CaseTrackingResponse.TokenInfo> current = new ArrayList<>();
        int total = allTokens.size();
        int completed = 0;

        for (CaseToken t : allTokens) {
            CaseTrackingResponse.TokenInfo info = new CaseTrackingResponse.TokenInfo();
            info.setActivityName(t.getActivity().getName());
            info.setStatus(t.getStatus());
            info.setStartedAt(t.getStartedAt());
            info.setCompletedAt(t.getCompletedAt());
            if (t.getActivity().getResponsibleDept() != null) {
                info.setDepartmentName(t.getActivity().getResponsibleDept().getName());
            }

            if ("DONE".equals(t.getStatus()) || "SKIPPED".equals(t.getStatus())) {
                history.add(info);
                completed++;
            } else {
                current.add(info);
            }
        }

        CaseTrackingResponse response = new CaseTrackingResponse();
        response.setTrackingCode(wCase.getTrackingCode());
        response.setCaseStatus(wCase.getStatus());
        response.setStartedAt(wCase.getStartedAt());
        response.setCompletedAt(wCase.getCompletedAt());
        response.setHistory(history);
        response.setCurrentActivities(current);
        
        response.setProgressPercentage(total > 0 ? (completed * 100) / total : 0);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<Page<CaseToken>> getMyTasks(
            @RequestAttribute("userId") UUID userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            Pageable pageable) {

        Page<CaseToken> tasks = caseTokenRepository.findMyTasks(userId, status, priority, pageable);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/department-tasks")
    public ResponseEntity<List<CaseToken>> getDepartmentTasks(
            @RequestAttribute("userId") UUID userId,
            @RequestParam(required = false) String status) {

        User manager = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found"));
        
        if (manager.getDepartment() == null) {
            return ResponseEntity.badRequest().build();
        }

        List<CaseToken> tasks = caseTokenRepository.findDepartmentTasks(manager.getDepartment().getId(), status);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/{caseId}/tokens/{tokenId}/complete")
    public ResponseEntity<Void> completeTask(
            @PathVariable UUID caseId,
            @PathVariable UUID tokenId,
            @RequestBody Map<String, Object> formData) {

        // Validar que el token corresponda al case
        CaseToken token = caseTokenRepository.findById(tokenId).orElseThrow();
        if (!token.getWorkflowCase().getId().equals(caseId)) {
            return ResponseEntity.badRequest().build();
        }

        caseEngine.completeActivity(tokenId, formData);

        // Notificación WebSocket se emitiría asíncronamente vía application events
        // eventPublisher.publishEvent(new TaskCompletedEvent(this, token));

        return ResponseEntity.ok().build();
    }

    public static class ReassignRequest {
        private UUID targetUserId;
        private String reason;

        public UUID getTargetUserId() { return targetUserId; }
        public void setTargetUserId(UUID targetUserId) { this.targetUserId = targetUserId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    @PutMapping("/{caseId}/tokens/{tokenId}/reassign")
    public ResponseEntity<Void> reassignTask(
            @PathVariable UUID caseId,
            @PathVariable UUID tokenId,
            @RequestAttribute("userId") UUID managerId,
            @RequestBody ReassignRequest request) {

        User managerUser = userRepository.findById(managerId).orElseThrow();
        User targetOfficer = userRepository.findById(request.getTargetUserId()).orElseThrow();

        caseEngine.reassignToken(tokenId, managerUser, targetOfficer, request.getReason());

        return ResponseEntity.ok().build();
    }
}
