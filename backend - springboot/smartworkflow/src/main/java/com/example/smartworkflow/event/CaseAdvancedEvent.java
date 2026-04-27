package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.WorkflowCase;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CaseAdvancedEvent extends ApplicationEvent {
    private final WorkflowCase workflowCase;
    private final String fromActivity;
    private final String toActivity;
    private final String toDepartmentName;
    private final String trackingCode;

    public CaseAdvancedEvent(Object source, WorkflowCase workflowCase, String fromActivity, 
                              String toActivity, String toDepartmentName, String trackingCode) {
        super(source);
        this.workflowCase = workflowCase;
        this.fromActivity = fromActivity;
        this.toActivity = toActivity;
        this.toDepartmentName = toDepartmentName;
        this.trackingCode = trackingCode;
    }
}
