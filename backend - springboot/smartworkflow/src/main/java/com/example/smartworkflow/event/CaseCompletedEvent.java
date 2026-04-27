package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.WorkflowCase;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CaseCompletedEvent extends ApplicationEvent {
    private final WorkflowCase workflowCase;
    private final String trackingCode;

    public CaseCompletedEvent(Object source, WorkflowCase workflowCase, String trackingCode) {
        super(source);
        this.workflowCase = workflowCase;
        this.trackingCode = trackingCode;
    }
}
