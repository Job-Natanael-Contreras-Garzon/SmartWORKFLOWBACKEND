package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.WorkflowCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkflowCaseRepository extends JpaRepository<WorkflowCase, UUID> {
    Optional<WorkflowCase> findByTrackingCode(String trackingCode);
}
