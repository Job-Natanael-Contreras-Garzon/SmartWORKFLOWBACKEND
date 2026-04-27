package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.entity.WorkflowCase;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class SlaViolatedEvent extends ApplicationEvent {
    private final User manager;
    private final Activity activity;
    private final WorkflowCase workflowCase;
    private final long horasVencido;

    public SlaViolatedEvent(Object source, User manager, Activity activity, 
                             WorkflowCase workflowCase, long horasVencido) {
        super(source);
        this.manager = manager;
        this.activity = activity;
        this.workflowCase = workflowCase;
        this.horasVencido = horasVencido;
    }
}
