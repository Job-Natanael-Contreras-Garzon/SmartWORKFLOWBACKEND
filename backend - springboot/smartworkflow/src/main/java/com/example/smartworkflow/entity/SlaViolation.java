package com.example.smartworkflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "sla_violations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SlaViolation {

    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token_id", nullable = false)
    private CaseToken caseToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private WorkflowCase workflowCase;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @Column(name = "actual_hours")
    private Double actualHours;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private ZonedDateTime recordedAt;
}
