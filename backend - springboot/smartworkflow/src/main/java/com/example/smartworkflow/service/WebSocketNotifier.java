package com.example.smartworkflow.service;

import com.example.smartworkflow.entity.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WebSocketNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyUser(UUID userId, Notification notification) {
        // /topic/user/{userId}/notifications
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", notification);
    }

    public void notifyDepartmentNewTask(UUID deptId, Map<String, Object> taskData) {
        // /topic/dept/{deptId}/new-tasks
        messagingTemplate.convertAndSend("/topic/dept/" + deptId + "/new-tasks", taskData);
    }

    public void notifyCaseUpdate(UUID caseId, Map<String, Object> updateData) {
        // /topic/case/{caseId}/updates
        messagingTemplate.convertAndSend("/topic/case/" + caseId + "/updates", updateData);
    }
}
