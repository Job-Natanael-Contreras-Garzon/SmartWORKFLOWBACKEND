package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.CaseToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsRepository extends JpaRepository<CaseToken, UUID> {

    @Query(value = "SELECT a.name as activityName, " +
           "AVG(EXTRACT(EPOCH FROM (COALESCE(c.completed_at, NOW()) - c.started_at)) / 3600.0) as avgDurationHours, " +
           "SUM(CASE WHEN c.status = 'OVERDUE' THEN 1 ELSE 0 END) as overdueCount " +
           "FROM case_tokens c JOIN activities a ON c.activity_id = a.id " +
           "WHERE (:policyId IS NULL OR a.policy_id = cast(cast(:policyId as text) as uuid)) " +
           "AND (:deptId IS NULL OR a.responsible_dept_id = cast(cast(:deptId as text) as uuid)) " +
           "AND c.started_at >= cast(:startDate as timestamp) AND c.started_at <= cast(:endDate as timestamp) " +
           "GROUP BY a.name " +
           "ORDER BY avgDurationHours DESC", nativeQuery = true)
    List<Object[]> getAvgDurationAndOverduePerActivityNative(
            @Param("policyId") String policyId,
            @Param("deptId") String deptId,
            @Param("startDate") String startDate,
            @Param("endDate") String endDate);

    @Query(value = "SELECT d.name as departmentName, COUNT(c.id) as completedTasksCount " +
           "FROM case_tokens c JOIN activities a ON c.activity_id = a.id " +
           "JOIN departments d ON a.responsible_dept_id = d.id " +
           "WHERE c.status = 'DONE' " +
           "GROUP BY d.name", nativeQuery = true)
    List<Object[]> getThroughputPerDepartmentNative();

    @Query(value = "SELECT " + 
           "COUNT(w.id) as totalCases, " +
           "SUM(CASE WHEN w.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as inProgressCases, " +
           "SUM(CASE WHEN w.status = 'COMPLETED' THEN 1 ELSE 0 END) as completedCases, " +
           "SUM(CASE WHEN w.status = 'REJECTED' THEN 1 ELSE 0 END) as rejectedCases, " +
           "AVG(CASE WHEN w.status = 'COMPLETED' THEN EXTRACT(EPOCH FROM (w.completed_at - w.started_at)) / 3600.0 ELSE NULL END) as avgResolutionHours " +
           "FROM cases w", nativeQuery = true)
    List<Object[]> getGlobalDashboardStats();
}
