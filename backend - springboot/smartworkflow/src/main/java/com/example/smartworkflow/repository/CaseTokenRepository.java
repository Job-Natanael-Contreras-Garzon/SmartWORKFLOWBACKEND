package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.Activity;
import com.example.smartworkflow.entity.CaseToken;
import com.example.smartworkflow.entity.WorkflowCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaseTokenRepository extends JpaRepository<CaseToken, UUID> {
    List<CaseToken> findByWorkflowCaseId(UUID workflowCaseId);
    List<CaseToken> findByWorkflowCaseAndActivity(WorkflowCase workflowCase, Activity activity);
    long countByWorkflowCaseAndActivityAndStatus(WorkflowCase workflowCase, Activity activity, String status);

    @Query("SELECT c FROM CaseToken c JOIN FETCH c.activity a WHERE c.status IN ('PENDING', 'IN_PROGRESS') AND a.slaHours IS NOT NULL")
    List<CaseToken> findAllActiveTokensWithSla();

    @Query("SELECT t FROM CaseToken t JOIN t.workflowCase w " +
           "WHERE t.assignedUser.id = :userId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:priority IS NULL OR w.priority = :priority) " +
           "ORDER BY t.startedAt DESC")
    Page<CaseToken> findMyTasks(
            @Param("userId") UUID userId,
            @Param("status") String status,
            @Param("priority") String priority,
            Pageable pageable);

    @Query("SELECT t FROM CaseToken t JOIN t.activity a " +
           "WHERE a.responsibleDept.id = :deptId " +
           "AND (:status IS NULL OR t.status = :status) " +
           "ORDER BY t.startedAt DESC")
    List<CaseToken> findDepartmentTasks(
            @Param("deptId") UUID deptId,
            @Param("status") String status);
}
