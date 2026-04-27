package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.CaseToken;
import com.example.smartworkflow.entity.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TaskAssignedEvent extends ApplicationEvent {
    private final CaseToken token;
    private final User assignedUser;

    public TaskAssignedEvent(Object source, CaseToken token, User assignedUser) {
        super(source);
        this.token = token;
        this.assignedUser = assignedUser;
    }
}