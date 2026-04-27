package com.example.smartworkflow.service;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.CaseHistory;
import com.example.smartworkflow.entity.CaseToken;
import com.example.smartworkflow.entity.Client;
import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.Policy;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.entity.WorkflowCase;
import com.example.smartworkflow.event.CaseAdvancedEvent;
import com.example.smartworkflow.event.CaseCompletedEvent;
import com.example.smartworkflow.event.CaseRejectedEvent;
import com.example.smartworkflow.event.CaseStartedEvent;
import com.example.smartworkflow.event.NewTaskInDepartmentEvent;
import com.example.smartworkflow.event.TaskAssignedEvent;
import com.example.smartworkflow.model.graph.Edge;
import com.example.smartworkflow.model.graph.Node;
import com.example.smartworkflow.model.graph.PolicyGraph;
import com.example.smartworkflow.repository.ActivityRepository;
import com.example.smartworkflow.repository.CaseHistoryRepository;
import com.example.smartworkflow.repository.CaseTokenRepository;
import com.example.smartworkflow.repository.WorkflowCaseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CaseEngine {

    private final WorkflowCaseRepository workflowCaseRepository;
    private final CaseTokenRepository caseTokenRepository;
    private final ActivityRepository activityRepository;
    private final CaseHistoryRepository caseHistoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PolicyDeserializer policyDeserializer;
    private final ConditionEvaluator conditionEvaluator;
    private final ObjectMapper objectMapper;

    /**
     * Crea un nuevo registro en cases, genera un tracking_code único,
     * crea el primer token en la actividad START y dispara un evento CaseStartedEvent.
     */
    @Transactional
    public WorkflowCase startCase(Policy policy, Organization organization, Client client) {
        
        // 1. Crear el caso con tracking code legible: {SLUG}-{AÑO}-{RANDOM 4 chars}
        WorkflowCase newCase = new WorkflowCase();
        newCase.setPolicy(policy);
        newCase.setOrganization(organization);
        newCase.setClient(client);
        newCase.setStatus("OPEN");
        newCase.setTrackingCode(generateTrackingCode(organization.getSlug()));

        newCase = workflowCaseRepository.save(newCase);

        // 2. Buscar la actividad de tipo START para la Política dada
        Activity startActivity = activityRepository.findByPolicyIdAndType(policy.getId(), "START")
                .orElseGet(() -> activityRepository.findByPolicyIdAndType(policy.getId(), "EVENT") // fallback en caso de EVENT si así está modelado
                        .orElseThrow(() -> new IllegalStateException("No se encontró una actividad START para la política: " + policy.getId())));

        // 3. Crear el primer token asociado a la actividad START
        CaseToken startToken = new CaseToken();
        startToken.setWorkflowCase(newCase);
        startToken.setActivity(startActivity);
        startToken.setStatus("PENDING");
        
        caseTokenRepository.save(startToken);
        
        if (startActivity.getResponsibleDept() != null) {
            eventPublisher.publishEvent(new NewTaskInDepartmentEvent(this, startToken, startActivity.getResponsibleDept()));
        }

        // 4. Emitir el evento de CaseStartedEvent.
        // Listeners asíncronos (como NotificationListener) procesarán la notificación al departamento
        eventPublisher.publishEvent(new CaseStartedEvent(this, newCase));

        return newCase;
    }

    /**
     * Marca un token actual como DONE, guarda sus datos (formData) 
     * y evalúa el diagrama de política para crear los siguientes tokens (SEQUENTIAL, XOR, AND, JOIN).
     */
    @Transactional
    public void completeActivity(UUID tokenId, Map<String, Object> formData) {
        CaseToken token = caseTokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token no encontrado: " + tokenId));

        if (!"PENDING".equalsIgnoreCase(token.getStatus()) && !"IN_PROGRESS".equalsIgnoreCase(token.getStatus())) {
            throw new IllegalStateException("El token no puede ser completado en su estado actual: " + token.getStatus());
        }

        // Marcar tarea completada
        token.setStatus("DONE");
        token.setCompletedAt(ZonedDateTime.now());
        token.setFormData(formData);
        caseTokenRepository.save(token);

        WorkflowCase wCase = token.getWorkflowCase();

        // 1. Recopilar todas las variables del caso para evaluar condiciones
        Map<String, Object> caseVariables = new HashMap<>();
        List<CaseToken> allTokens = caseTokenRepository.findByWorkflowCaseId(wCase.getId());
        for (CaseToken t : allTokens) {
            if (t.getFormData() != null) {
                caseVariables.putAll(t.getFormData());
            }
        }

        // Si se pasó formdata nuevo (sobrescribe previos)
        if (formData != null) {
            caseVariables.putAll(formData);
        }

        // 2. Extraer el diagrama mapeado a memoria
        String diagramStr;
        try {
            diagramStr = objectMapper.writeValueAsString(wCase.getPolicy().getDiagramJson());
        } catch (Exception e) {
            throw new RuntimeException("Error al serializar diagrama para procesar siguientes pasos del Workflow", e);
        }
        
        PolicyGraph graph = policyDeserializer.deserializeAndValidate(diagramStr);

        // 3. Procesar las salidas del nodo que acabamos de completar
        processOutgoingEdges(wCase, token.getActivity().getName(), graph, caseVariables);
    }

    private void processOutgoingEdges(WorkflowCase wCase, String currentNodeId, PolicyGraph graph, Map<String, Object> variables) {
        List<Edge> outgoing = graph.getEdges().stream()
                .filter(e -> e.getSource().equals(currentNodeId))
                .toList();

        // Si no hay salidas, verificar si terminamos el flujo (no debería pasar a menos que current fuera END)
        if (outgoing.isEmpty()) {
            return; // Fin de rama o camino sin salida
        }

        for (Edge outEdge : outgoing) {
            Node targetNode = graph.getNodes().get(outEdge.getTarget());
            traverseGatewayOrActivity(wCase, targetNode, graph, variables);
        }
    }

    private void traverseGatewayOrActivity(WorkflowCase wCase, Node targetNode, PolicyGraph graph, Map<String, Object> variables) {
        String type = targetNode.getType() != null ? targetNode.getType().toUpperCase() : "TASK";

        if (type.equals("TASK") || type.equals("EVENT")) {
            createTokenForActivity(wCase, targetNode.getId());
            return;
        }

        if (type.equals("END")) {
            wCase.setStatus("COMPLETED");
            wCase.setCompletedAt(ZonedDateTime.now());
            workflowCaseRepository.save(wCase);
            eventPublisher.publishEvent(new CaseCompletedEvent(this, wCase, wCase.getTrackingCode()));
            return;
        }

        // Es un GATEWAY
        List<Edge> gatewayOutgoing = graph.getEdges().stream()
                .filter(e -> e.getSource().equals(targetNode.getId()))
                .toList();

        if (type.equals("GATEWAY_XOR")) {
            for (Edge edge : gatewayOutgoing) {
                if (conditionEvaluator.evaluate(edge.getConditionExpression(), variables)) {
                    Node next = graph.getNodes().get(edge.getTarget());
                    traverseGatewayOrActivity(wCase, next, graph, variables);
                    return; // Toma solo el primer camino válido (XOR)
                }
            }
            throw new IllegalStateException("Ninguna condición (XOR) se cumplió para el gateway " + targetNode.getId());
        }

        if (type.equals("GATEWAY_AND")) {
            for (Edge edge : gatewayOutgoing) {
                Node next = graph.getNodes().get(edge.getTarget());
                traverseGatewayOrActivity(wCase, next, graph, variables); // Procesa Múltiples Caminos a la vez
            }
            return;
        }

        if (type.equals("GATEWAY_JOIN")) {
            handleJoinGateway(wCase, targetNode, graph, variables);
        }
    }

    private void handleJoinGateway(WorkflowCase wCase, Node joinNode, PolicyGraph graph, Map<String, Object> variables) {
        Activity joinActivity = activityRepository.findByPolicyIdAndName(wCase.getPolicy().getId(), joinNode.getId())
                .orElseThrow(() -> new IllegalStateException("Actividad JOIN no encontrada en DB para nodo: " + joinNode.getId()));

        // Registramos la "llegada" de la rama actual creando un token de JOIN resuelto
        CaseToken arrivalToken = new CaseToken();
        arrivalToken.setWorkflowCase(wCase);
        arrivalToken.setActivity(joinActivity);
        arrivalToken.setStatus("JOIN_ARRIVED"); // Estado especial de espera
        caseTokenRepository.save(arrivalToken);

        // Cuántas ramas (enlaces) originalmente entran en el JOIN
        long requiredBranches = graph.getEdges().stream()
                .filter(e -> e.getTarget().equals(joinNode.getId()))
                .count();

        // Cuántas han llegado
        long arrivedBranches = caseTokenRepository.countByWorkflowCaseAndActivityAndStatus(wCase, joinActivity, "JOIN_ARRIVED");

        if (arrivedBranches >= requiredBranches) {
            // Se sincronizaron todas las ramas: liberamos
            List<CaseToken> joinTokens = caseTokenRepository.findByWorkflowCaseAndActivity(wCase, joinActivity);
            for (CaseToken t : joinTokens) {
                t.setStatus("DONE");
                caseTokenRepository.save(t);
            }

            // Continuar flujo tras el JOIN
            processOutgoingEdges(wCase, joinNode.getId(), graph, variables);
        }
    }

    private void createTokenForActivity(WorkflowCase wCase, String nodeNameId) {
        Activity targetActivity = activityRepository.findByPolicyIdAndName(wCase.getPolicy().getId(), nodeNameId)
                .orElseThrow(() -> new IllegalStateException("Actividad '" + nodeNameId + "' no encontrada en DB para la política."));

        CaseToken newToken = new CaseToken();
        newToken.setWorkflowCase(wCase);
        newToken.setActivity(targetActivity);
        newToken.setStatus("PENDING");
        caseTokenRepository.save(newToken);

        if (targetActivity.getResponsibleDept() != null) {
            eventPublisher.publishEvent(new NewTaskInDepartmentEvent(this, newToken, targetActivity.getResponsibleDept()));
        }

        eventPublisher.publishEvent(new CaseAdvancedEvent(
            this,
            wCase,
            nodeNameId,
            targetActivity.getName(),
            targetActivity.getResponsibleDept() != null ? targetActivity.getResponsibleDept().getName() : "Sin asignar",
            wCase.getTrackingCode()
        ));
    }

    /** Genera un código de seguimiento legible: {SLUG_UPPER}-{AÑO}-{4 hex random} */
    private String generateTrackingCode(String orgSlug) {
        String slug = orgSlug.toUpperCase();
        int year = java.time.Year.now().getValue();
        String random = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return slug + "-" + year + "-" + random;
    }

    /**
     * Marca el caso como REJECTED y todos los tokens pendientes/en progreso como SKIPPED.
     * Notifica al solicitante y guarda el motivo en case_history.
     */
    @Transactional
    public void rejectCase(UUID caseId, User rejector, String reason) {
        WorkflowCase wCase = workflowCaseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Caso no encontrado: " + caseId));
        
        if (!"OPEN".equals(wCase.getStatus()) && !"IN_PROGRESS".equals(wCase.getStatus())) {
            throw new IllegalStateException("Solo se pueden rechazar casos abiertos o en progreso.");
        }
        
        String oldStatus = wCase.getStatus();
        wCase.setStatus("REJECTED");
        wCase.setCompletedAt(ZonedDateTime.now());
        workflowCaseRepository.save(wCase);

        List<CaseToken> tokens = caseTokenRepository.findByWorkflowCaseId(wCase.getId());
        for (CaseToken token : tokens) {
            String ts = token.getStatus();
            if ("PENDING".equals(ts) || "IN_PROGRESS".equals(ts)) {
                token.setStatus("SKIPPED");
                caseTokenRepository.save(token);
            }
        }

        CaseHistory history = new CaseHistory();
        history.setWorkflowCase(wCase);
        history.setUser(rejector);
        history.setAction("REJECT");
        history.setOldStatus(oldStatus);
        history.setNewStatus("REJECTED");
        history.setComment(reason);
        caseHistoryRepository.save(history);

        eventPublisher.publishEvent(new CaseRejectedEvent(this, wCase, wCase.getTrackingCode(), reason));
    }

    /**
     * Permite a un MANAGER reasignar un token a otro OFFICER del mismo departamento.
     */
    @Transactional
    public void reassignToken(UUID tokenId, User managerUser, User targetOfficer, String reason) {
        CaseToken token = caseTokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token no encontrado: " + tokenId));
                
        if (!"MANAGER".equals(managerUser.getRole())) {
            throw new SecurityException("Solo un MANAGER puede reasignar tareas.");
        }
        
        if (targetOfficer.getDepartment() == null || managerUser.getDepartment() == null || 
            !targetOfficer.getDepartment().getId().equals(managerUser.getDepartment().getId())) {
            throw new IllegalArgumentException("El manager y el oficial deben pertenecer al mismo departamento.");
        }
        
        token.setAssignedUser(targetOfficer);
        caseTokenRepository.save(token);
        
        CaseHistory history = new CaseHistory();
        history.setWorkflowCase(token.getWorkflowCase());
        history.setActivity(token.getActivity());
        history.setUser(managerUser);
        history.setAction("REASSIGN_TOKEN");
        history.setComment("Reasignado a: " + targetOfficer.getName() + " - Motivo: " + reason);
        caseHistoryRepository.save(history);
        
        eventPublisher.publishEvent(new TaskAssignedEvent(this, token, targetOfficer));
    }
}

