package com.example.smartworkflow.event.listener;

import com.example.smartworkflow.event.NewTaskInDepartmentEvent;
import com.example.smartworkflow.service.WebSocketNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class NewTaskInDepartmentEventEventListener {
    private final WebSocketNotifier webSocketNotifier;

    @Async
    @EventListener
    public void onNewTask(NewTaskInDepartmentEvent event) {
        Map<String, Object> taskData = new HashMap<>(); // Adjust the map values freely!
        taskData.put("tokenId", event.getToken().getId().toString());
        taskData.put("activityName", event.getToken().getActivity().getName());
        taskData.put("caseId", event.getToken().getWorkflowCase().getId().toString());
        
        webSocketNotifier.notifyDepartmentNewTask(event.getDepartment().getId(), taskData);
    }
}