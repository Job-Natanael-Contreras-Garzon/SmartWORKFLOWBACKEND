package com.example.smartworkflow.email;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.entity.WorkflowCase;
import com.example.smartworkflow.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailEventListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCaseStarted(CaseStartedEvent event) {
        WorkflowCase workflowCase = event.getWorkflowCase();
        String policyName = workflowCase.getPolicy() != null ? workflowCase.getPolicy().getName() : "Trámite";
        String trackingCode = workflowCase.getTrackingCode().toString();
        
        emailService.sendCaseStartedEmail(workflowCase, policyName, trackingCode);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCaseAdvanced(CaseAdvancedEvent event) {
        WorkflowCase workflowCase = event.getWorkflowCase();
        emailService.sendCaseAdvancedEmail(
            workflowCase,
            event.getFromActivity(),
            event.getToActivity(),
            event.getToDepartmentName(),
            event.getTrackingCode()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCaseCompleted(CaseCompletedEvent event) {
        WorkflowCase workflowCase = event.getWorkflowCase();
        String trackingCode = workflowCase.getTrackingCode().toString();
        
        emailService.sendCaseCompletedEmail(workflowCase, trackingCode);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCaseRejected(CaseRejectedEvent event) {
        WorkflowCase workflowCase = event.getWorkflowCase();
        String trackingCode = workflowCase.getTrackingCode().toString();
        
        emailService.sendCaseRejectedEmail(workflowCase, trackingCode, event.getMotivo());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSlaViolated(SlaViolatedEvent event) {
        emailService.sendSlaViolationAlert(
            event.getManager(),
            event.getActivity(),
            event.getWorkflowCase(),
            event.getHorasVencido()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTaskAssigned(TaskAssignedEvent event) {
        User officer = event.getAssignedUser();
        WorkflowCase workflowCase = event.getToken().getWorkflowCase();
        Activity activity = event.getToken().getActivity();
        
        emailService.sendTaskAssignedEmail(officer, workflowCase, activity);
    }
}
