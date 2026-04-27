package com.example.smartworkflow.event.listener;

import com.example.smartworkflow.entity.Notification;
import com.example.smartworkflow.event.TaskAssignedEvent;
import com.example.smartworkflow.repository.NotificationRepository;
import com.example.smartworkflow.service.WebSocketNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class TaskAssignedEventListener {

    private final WebSocketNotifier webSocketNotifier;
    private final NotificationRepository notificationRepository;

    @Async
    @EventListener
    @Transactional
    public void onTaskAssigned(TaskAssignedEvent event) {
        Notification notification = new Notification();
        notification.setUser(event.getAssignedUser());
        notification.setWorkflowCase(event.getToken().getWorkflowCase());
        notification.setType("NUEVA_TAREA");
        notification.setMessage("Se te ha asignado la tarea: " + event.getToken().getActivity().getName());
        
        notification = notificationRepository.save(notification);
        webSocketNotifier.notifyUser(event.getAssignedUser().getId(), notification);
    }
}