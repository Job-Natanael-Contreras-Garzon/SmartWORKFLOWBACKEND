package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.WorkflowCase;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CaseRejectedEvent extends ApplicationEvent {
    private final WorkflowCase workflowCase;
    private final String trackingCode;
    private final String motivo;

    public CaseRejectedEvent(Object source, WorkflowCase workflowCase, String trackingCode, String motivo) {
        super(source);
        this.workflowCase = workflowCase;
        this.trackingCode = trackingCode;
        this.motivo = motivo;
    }
}
