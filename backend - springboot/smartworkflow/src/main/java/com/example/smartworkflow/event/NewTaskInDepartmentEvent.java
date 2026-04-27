package com.example.smartworkflow.event;

import com.example.smartworkflow.entity.CaseToken;
import com.example.smartworkflow.entity.Department;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NewTaskInDepartmentEvent extends ApplicationEvent {
    private final CaseToken token;
    private final Department department;

    public NewTaskInDepartmentEvent(Object source, CaseToken token, Department department) {
        super(source);
        this.token = token;
        this.department = department;
    }
}