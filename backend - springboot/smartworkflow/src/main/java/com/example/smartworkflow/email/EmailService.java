package com.example.smartworkflow.email;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.entity.WorkflowCase;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.time.Year;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from:FlowDesk <noreply@flowdesk.app>}")
    private String fromEmail;

    @Value("${app.mail.base-url:https://app.flowdesk.app}")
    private String baseUrl;

    @Value("${app.mail.org-name:FlowDesk}")
    private String orgName;

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendWelcomeEmail(User user, String tempPassword) {
        try {
            Context context = buildContext(Map.of(
                "userName", user.getName(),
                "userEmail", user.getEmail(),
                "tempPassword", tempPassword,
                "orgName", user.getOrganization() != null ? user.getOrganization().getName() : orgName,
                "loginUrl", baseUrl + "/login"
            ));

            String content = templateEngine.process("email/welcome", context);
            sendEmail(user.getEmail(), "Bienvenido a FlowDesk", content);

            log.info("Welcome email sent to: {} for user: {}", user.getEmail(), user.getName());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {} after 3 retries", user.getEmail(), e);
            throw new RuntimeException("Failed to send welcome email", e);
        }
    }

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendCaseStartedEmail(WorkflowCase workflowCase, String policyName, String trackingCode) {
        try {
            String qrCodeBase64 = generateQRCode(trackingCode);

            Context context = buildContext(Map.of(
                "requesterName", clientName(workflowCase),
                "policyName", policyName,
                "trackingCode", trackingCode,
                "trackingUrl", baseUrl + "/track/" + trackingCode,
                "qrCode", qrCodeBase64
            ));

            String content = templateEngine.process("email/case-started", context);
            sendEmail(clientEmail(workflowCase), "Trámite recibido - Código: " + trackingCode, content);

            log.info("Case started email sent to: {} for case: {}", clientEmail(workflowCase), trackingCode);
        } catch (Exception e) {
            log.error("Failed to send case started email to: {} for case: {} after 3 retries",
                clientEmail(workflowCase), trackingCode, e);
            throw new RuntimeException("Failed to send case started email", e);
        }
    }

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendCaseAdvancedEmail(WorkflowCase workflowCase, String fromActivity, String toActivity, 
                                       String toDepartmentName, String trackingCode) {
        try {
            Context context = buildContext(Map.of(
                "requesterName", clientName(workflowCase),
                "fromActivity", fromActivity,
                "toActivity", toActivity,
                "toDepartmentName", toDepartmentName,
                "trackingCode", trackingCode,
                "trackingUrl", baseUrl + "/track/" + trackingCode
            ));

            String content = templateEngine.process("email/case-advanced", context);
            sendEmail(clientEmail(workflowCase), "Tu trámite avanzó - " + trackingCode, content);

            log.info("Case advanced email sent to: {} for case: {}", clientEmail(workflowCase), trackingCode);
        } catch (Exception e) {
            log.error("Failed to send case advanced email to: {} for case: {} after 3 retries",
                clientEmail(workflowCase), trackingCode, e);
            throw new RuntimeException("Failed to send case advanced email", e);
        }
    }

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendCaseCompletedEmail(WorkflowCase workflowCase, String trackingCode) {
        try {
            Context context = buildContext(Map.of(
                "requesterName", clientName(workflowCase),
                "trackingCode", trackingCode,
                "pdfUrl", baseUrl + "/public/cases/" + trackingCode + "/pdf"
            ));

            String content = templateEngine.process("email/case-completed", context);
            sendEmail(clientEmail(workflowCase), "Trámite completado - " + trackingCode, content);

            log.info("Case completed email sent to: {} for case: {}", clientEmail(workflowCase), trackingCode);
        } catch (Exception e) {
            log.error("Failed to send case completed email to: {} for case: {} after 3 retries",
                clientEmail(workflowCase), trackingCode, e);
            throw new RuntimeException("Failed to send case completed email", e);
        }
    }

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendCaseRejectedEmail(WorkflowCase workflowCase, String trackingCode, String motivo) {
        try {
            String orgContact = workflowCase.getOrganization() != null ? 
                workflowCase.getOrganization().getName() : orgName;

            Context context = buildContext(Map.of(
                "requesterName", clientName(workflowCase),
                "trackingCode", trackingCode,
                "motivo", motivo,
                "orgName", orgContact
            ));

            String content = templateEngine.process("email/case-rejected", context);
            sendEmail(clientEmail(workflowCase), "Trámite rechazado - " + trackingCode, content);

            log.info("Case rejected email sent to: {} for case: {}", clientEmail(workflowCase), trackingCode);
        } catch (Exception e) {
            log.error("Failed to send case rejected email to: {} for case: {} after 3 retries",
                clientEmail(workflowCase), trackingCode, e);
            throw new RuntimeException("Failed to send case rejected email", e);
        }
    }

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendSlaViolationAlert(User manager, Activity activity, WorkflowCase workflowCase, long horasVencido) {
        try {
            Context context = buildContext(Map.of(
                "managerName", manager.getName(),
                "activityName", activity.getName(),
                "trackingCode", workflowCase.getTrackingCode(),
                "horasVencido", horasVencido,
                "caseUrl", baseUrl + "/admin/cases?tracking=" + workflowCase.getTrackingCode()
            ));

            String content = templateEngine.process("email/sla-violation", context);
            sendEmail(manager.getEmail(), "🚨 ALERTA: SLA vencido - " + activity.getName(), content);

            log.info("SLA violation alert sent to: {} for activity: {}", manager.getEmail(), activity.getName());
        } catch (Exception e) {
            log.error("Failed to send SLA violation alert to: {} for activity: {} after 3 retries", 
                manager.getEmail(), activity.getName(), e);
            throw new RuntimeException("Failed to send SLA violation alert", e);
        }
    }

    @Async("emailTaskExecutor")
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 2000))
    public void sendTaskAssignedEmail(User officer, WorkflowCase workflowCase, Activity activity) {
        try {
            int slaHours = activity.getSlaHours() != null ? activity.getSlaHours() : 24;

            Context context = buildContext(Map.of(
                "officerName", officer.getName(),
                "activityName", activity.getName(),
                "trackingCode", workflowCase.getTrackingCode(),
                "requesterName", clientName(workflowCase),
                "slaHours", slaHours,
                "taskUrl", baseUrl + "/officer/tasks/" + workflowCase.getTrackingCode()
            ));

            String content = templateEngine.process("email/task-assigned", context);
            sendEmail(officer.getEmail(), "Nueva tarea asignada - " + activity.getName(), content);

            log.info("Task assigned email sent to: {} for case: {}", officer.getEmail(), workflowCase.getTrackingCode());
        } catch (Exception e) {
            log.error("Failed to send task assigned email to: {} for case: {} after 3 retries", 
                officer.getEmail(), workflowCase.getTrackingCode(), e);
            throw new RuntimeException("Failed to send task assigned email", e);
        }
    }

    // ── Helpers para acceder al cliente del caso de forma segura ──────────────
    private String clientName(WorkflowCase wCase) {
        return wCase.getClient() != null ? wCase.getClient().getName() : "Cliente";
    }

    private String clientEmail(WorkflowCase wCase) {
        if (wCase.getClient() != null && wCase.getClient().getEmail() != null) {
            return wCase.getClient().getEmail();
        }
        return null; // El llamador debe verificar antes de enviar
    }

    private Context buildContext(Map<String, Object> variables) {
        Context context = new Context();
        context.setVariable("orgName", orgName);
        context.setVariable("baseUrl", baseUrl);
        context.setVariable("year", Year.now().getValue());
        context.setVariables(variables);
        return context;
    }

    private String generateQRCode(String text) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 200, 200);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

        return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
    }

    private void sendEmail(String to, String subject, String content) throws Exception {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, true);

        javaMailSender.send(message);
    }
}
