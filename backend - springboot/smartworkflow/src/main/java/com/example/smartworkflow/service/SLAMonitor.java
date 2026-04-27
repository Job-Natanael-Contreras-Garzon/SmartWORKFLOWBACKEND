package com.example.smartworkflow.service;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.CaseToken;
import com.example.smartworkflow.entity.SlaViolation;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.event.SlaViolatedEvent;
import com.example.smartworkflow.repository.CaseTokenRepository;
import com.example.smartworkflow.repository.SlaViolationRepository;
import com.example.smartworkflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SLAMonitor {

    private static final Logger log = LoggerFactory.getLogger(SLAMonitor.class);

    private final CaseTokenRepository caseTokenRepository;
    private final SlaViolationRepository slaViolationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void monitorTokens() {
        log.info("Iniciando monitoreo de SLA...");

        List<CaseToken> activeTokens = caseTokenRepository.findAllActiveTokensWithSla();

        ZonedDateTime now = ZonedDateTime.now();
        int overdueCount = 0;

        for (CaseToken token : activeTokens) {
            Activity activity = token.getActivity();
            if (activity.getSlaHours() == null) {
                continue;
            }

            ZonedDateTime startedAt = token.getStartedAt() != null ? token.getStartedAt() : token.getWorkflowCase().getStartedAt();
            if (startedAt == null) {
                continue;
            }

            long actualHours = Duration.between(startedAt, now).toHours();

            if (actualHours > activity.getSlaHours()) {
                long hoursOverdue = actualHours - activity.getSlaHours();

                token.setStatus("OVERDUE");
                caseTokenRepository.save(token);

                log.warn("Token {} ha superado el SLA. Departamento: {}", token.getId(), activity.getResponsibleDept() != null ? activity.getResponsibleDept().getName() : "Sin asignar");

                SlaViolation violation = new SlaViolation();
                violation.setCaseToken(token);
                violation.setActivity(activity);
                violation.setWorkflowCase(token.getWorkflowCase());
                violation.setSlaHours(activity.getSlaHours());
                violation.setActualHours((double) actualHours);

                slaViolationRepository.save(violation);
                overdueCount++;

                if (activity.getResponsibleDept() != null) {
                    List<User> managers = userRepository.findByDepartmentIdAndRole(
                        activity.getResponsibleDept().getId(),
                        "MANAGER"
                    );

                    for (User manager : managers) {
                        eventPublisher.publishEvent(new SlaViolatedEvent(
                            this,
                            manager,
                            activity,
                            token.getWorkflowCase(),
                            hoursOverdue
                        ));
                    }
                }
            }
        }

        log.info("Monitoreo SLA finalizado. Tokens marcados como OVERDUE: {}", overdueCount);
    }
}
