package com.example.smartworkflow.email;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.Client;
import com.example.smartworkflow.entity.Department;
import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.Policy;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.entity.WorkflowCase;
import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.mail.host=localhost",
    "spring.mail.port=3025",
    "spring.mail.username=test",
    "spring.mail.password=test",
    "app.mail.from=FlowDesk <test@flowdesk.app>",
    "app.mail.base-url=https://test.flowdesk.app",
    "app.mail.org-name=TestOrg"
})
public class EmailServiceTest {

    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP)
            .withConfiguration(GreenMailConfiguration.aConfig().withUser("test", "test"))
            .withPerMethodLifecycle(false);

    @Autowired
    private EmailService emailService;

    @Autowired
    private JavaMailSender javaMailSender;

    @Test
    public void testSendCaseStartedEmail() throws Exception {
        Organization org = new Organization();
        org.setId(UUID.randomUUID());
        org.setName("Test Organization");
        org.setSlug("test");

        Policy policy = new Policy();
        policy.setId(UUID.randomUUID());
        policy.setName("Test Policy");

        // Ahora el caso usa un Client en lugar de campos requester inline
        Client client = new Client();
        client.setId(UUID.randomUUID());
        client.setName("John Doe");
        client.setEmail("john@example.com");
        client.setOrganization(org);

        WorkflowCase workflowCase = new WorkflowCase();
        workflowCase.setId(UUID.randomUUID());
        workflowCase.setPolicy(policy);
        workflowCase.setOrganization(org);
        workflowCase.setClient(client);
        workflowCase.setTrackingCode("TEST-2026-A1B2");

        emailService.sendCaseStartedEmail(workflowCase, "Test Policy", workflowCase.getTrackingCode());

        Thread.sleep(2000);

        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertEquals(1, receivedMessages.length);

        MimeMessage message = receivedMessages[0];
        assertTrue(GreenMailUtil.getAddressList(message.getAllRecipients()).contains("john@example.com"));
        assertTrue(message.getSubject().contains("Trámite recibido"));
        assertTrue(message.getSubject().contains(workflowCase.getTrackingCode()));
    }

    @Test
    public void testSlaViolationAlert() throws Exception {
        Organization org = new Organization();
        org.setId(UUID.randomUUID());
        org.setName("Test Organization");
        org.setSlug("test");

        Department dept = new Department();
        dept.setId(UUID.randomUUID());
        dept.setName("Test Department");

        User manager = new User();
        manager.setId(UUID.randomUUID());
        manager.setName("Manager User");
        manager.setEmail("manager@example.com");
        manager.setRole("MANAGER");
        manager.setDepartment(dept);

        Policy policy = new Policy();
        policy.setId(UUID.randomUUID());
        policy.setName("Test Policy");

        Activity activity = new Activity();
        activity.setId(UUID.randomUUID());
        activity.setName("Test Activity");
        activity.setResponsibleDept(dept);
        activity.setSlaHours(24);

        Client client = new Client();
        client.setId(UUID.randomUUID());
        client.setName("John Doe");
        client.setEmail("john@example.com");
        client.setOrganization(org);

        WorkflowCase workflowCase = new WorkflowCase();
        workflowCase.setId(UUID.randomUUID());
        workflowCase.setPolicy(policy);
        workflowCase.setOrganization(org);
        workflowCase.setClient(client);
        workflowCase.setTrackingCode("TEST-2026-C3D4");

        emailService.sendSlaViolationAlert(manager, activity, workflowCase, 5);

        Thread.sleep(2000);

        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertEquals(1, receivedMessages.length);

        MimeMessage message = receivedMessages[0];
        assertTrue(GreenMailUtil.getAddressList(message.getAllRecipients()).contains("manager@example.com"));
        assertTrue(message.getSubject().contains("🚨"));
        assertTrue(message.getSubject().contains("ALERTA"));
    }
}
