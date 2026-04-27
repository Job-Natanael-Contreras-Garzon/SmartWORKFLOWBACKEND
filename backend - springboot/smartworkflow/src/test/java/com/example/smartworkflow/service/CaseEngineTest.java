package com.example.smartworkflow.service;

import com.example.smartworkflow.entity.*;
import com.example.smartworkflow.model.graph.Edge;
import com.example.smartworkflow.model.graph.Node;
import com.example.smartworkflow.model.graph.PolicyGraph;
import com.example.smartworkflow.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseEngineTest {

    @Mock private WorkflowCaseRepository workflowCaseRepository;
    @Mock private CaseTokenRepository caseTokenRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private CaseHistoryRepository caseHistoryRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private PolicyDeserializer policyDeserializer;
    @Mock private ConditionEvaluator conditionEvaluator;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private CaseEngine caseEngine;

    private WorkflowCase sampleCase;
    private CaseToken sampleToken;
    private User managerUser;
    private User officerUser;
    private Department department;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(UUID.randomUUID());
        department.setName("IT Dept");

        managerUser = new User();
        managerUser.setId(UUID.randomUUID());
        managerUser.setRole("MANAGER");
        managerUser.setDepartment(department);

        officerUser = new User();
        officerUser.setId(UUID.randomUUID());
        officerUser.setName("Officer John");
        officerUser.setRole("OFFICER");
        officerUser.setDepartment(department);

        sampleCase = new WorkflowCase();
        sampleCase.setId(UUID.randomUUID());
        sampleCase.setStatus("IN_PROGRESS");
        Policy mockPolicy = new Policy();
        mockPolicy.setId(UUID.randomUUID());
        sampleCase.setPolicy(mockPolicy);

        Activity activity = new Activity();
        activity.setId(UUID.randomUUID());
        activity.setName("TASK_1");

        sampleToken = new CaseToken();
        sampleToken.setId(UUID.randomUUID());
        sampleToken.setWorkflowCase(sampleCase);
        sampleToken.setActivity(activity);
        sampleToken.setStatus("IN_PROGRESS");
    }

    @Test
    void rejectCase_ShouldMarkCaseRejectedAndSkipTokens() {
        when(workflowCaseRepository.findById(sampleCase.getId())).thenReturn(Optional.of(sampleCase));
        when(caseTokenRepository.findByWorkflowCaseId(sampleCase.getId())).thenReturn(List.of(sampleToken));

        caseEngine.rejectCase(sampleCase.getId(), managerUser, "Faltan documentos");

        assertEquals("REJECTED", sampleCase.getStatus());
        assertEquals("SKIPPED", sampleToken.getStatus());
        verify(workflowCaseRepository, times(1)).save(sampleCase);
        verify(caseTokenRepository, times(1)).save(sampleToken);
        verify(caseHistoryRepository, times(1)).save(any(CaseHistory.class));
    }

    @Test
    void reassignToken_ShouldReassignWhenManagerBelongsToSameDept() {
        when(caseTokenRepository.findById(sampleToken.getId())).thenReturn(Optional.of(sampleToken));

        caseEngine.reassignToken(sampleToken.getId(), managerUser, officerUser, "Vacaciones");

        assertEquals(officerUser.getId(), sampleToken.getAssignedUser().getId());
        verify(caseTokenRepository, times(1)).save(sampleToken);
        verify(caseHistoryRepository, times(1)).save(any(CaseHistory.class));
    }

    @Test
    void completeActivity_Linear_ThrowsExceptionIfTokenNotFound() {
        when(caseTokenRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> caseEngine.completeActivity(UUID.randomUUID(), null));
    }

    // More complex tests (XOR, AND, JOIN) mock Graph resolution...
    // Coverage requirements focus on methods executing successfully.
    @Test
    void completeActivity_ShouldUpdateTokenStatusAndCallGraphTraversal() throws Exception {
        Activity act = sampleToken.getActivity();
        
        when(caseTokenRepository.findById(sampleToken.getId())).thenReturn(Optional.of(sampleToken));
        when(caseTokenRepository.findByWorkflowCaseId(sampleCase.getId())).thenReturn(List.of(sampleToken));
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        PolicyGraph mockGraph = new PolicyGraph();
        Node endNode = new Node();
        endNode.setId("END_NODE");
        endNode.setType("END");
        
        Edge toEnd = new Edge();
        toEnd.setSource("TASK_1");
        toEnd.setTarget("END_NODE");

        mockGraph.setNodes(Map.of("END_NODE", endNode));
        mockGraph.setEdges(List.of(toEnd));

        when(policyDeserializer.deserializeAndValidate(anyString())).thenReturn(mockGraph);

        caseEngine.completeActivity(sampleToken.getId(), Map.of("key", "val"));

        assertEquals("DONE", sampleToken.getStatus());
        assertEquals("COMPLETED", sampleCase.getStatus());
        verify(caseTokenRepository, times(1)).save(sampleToken);
        verify(workflowCaseRepository, times(1)).save(sampleCase);
    }
}
