package com.example.smartworkflow.event.listener;

import com.example.smartworkflow.event.CaseStartedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class CaseStartedEventListener {

    private static final Logger log = LoggerFactory.getLogger(CaseStartedEventListener.class);

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCaseStarted(CaseStartedEvent event) {
        log.info("Recibido evento asíncrono: CaseStartedEvent para case ID {}", event.getWorkflowCase().getId());
        
        // Aquí iría la lógica para enviar notificación al departamento asociado a la actividad
        // de START (por ejemplo, buscar usuarios del Department y enviarles email/notificación en sistema).
        log.info("Disparando notificación al departamento responsable del tracking code: {}", event.getWorkflowCase().getTrackingCode());
    }
}
