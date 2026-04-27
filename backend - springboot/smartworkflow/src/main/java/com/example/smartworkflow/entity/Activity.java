package com.example.smartworkflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "activities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Activity {

    @Id 
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String type; // TASK, GATEWAY_XOR, GATEWAY_AND, EVENT

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_dept_id")
    private Department responsibleDept;

    @Column(name = "sla_hours")
    private Integer slaHours;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_schema", columnDefinition = "jsonb")
    private Map<String, Object> formSchema;

    @Column(name = "canvas_x")
    private Integer canvasX;

    @Column(name = "canvas_y")
    private Integer canvasY;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}