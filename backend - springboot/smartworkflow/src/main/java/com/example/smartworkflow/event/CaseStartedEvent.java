package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.WorkflowCase;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CaseStartedEvent extends ApplicationEvent {
    private final WorkflowCase workflowCase;

    public CaseStartedEvent(Object source, WorkflowCase workflowCase) {
        super(source);
        this.workflowCase = workflowCase;
    }
}
