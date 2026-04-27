package com.example.smartworkflow.service;

import com.example.smartworkflow.dto.ActivityAnalyticsDTO;
import com.example.smartworkflow.dto.DeptThroughputDTO;
import com.example.smartworkflow.repository.AnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BottleneckAnalyzer {

    private final AnalyticsRepository analyticsRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getBottleneckAnalysis(UUID policyId, UUID departmentId, LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> analysis = new HashMap<>();

        String pId = policyId != null ? policyId.toString() : null;
        String dId = departmentId != null ? departmentId.toString() : null;
        
        // Default to a 10 year range if not provided
        String sDate = startDate != null ? startDate.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "2000-01-01T00:00:00";
        String eDate = endDate != null ? endDate.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : "2100-01-01T00:00:00";

        // 1. Avg duration & count of OVERDUE per activity
        List<Object[]> activityResults = analyticsRepository.getAvgDurationAndOverduePerActivityNative(pId, dId, sDate, eDate);
        List<ActivityAnalyticsDTO> activityAnalytics = new ArrayList<>();
        for (Object[] row : activityResults) {
            ActivityAnalyticsDTO dto = new ActivityAnalyticsDTO();
            dto.setActivityName((String) row[0]);
            
            Number avgVar = (Number) row[1];
            dto.setAvgDurationHours(avgVar != null ? avgVar.doubleValue() : 0.0);
            
            Number countVar = (Number) row[2];
            dto.setOverdueCount(countVar != null ? countVar.longValue() : 0L);
            
            activityAnalytics.add(dto);
        }

        // 2. Throughput per department
        List<Object[]> deptResults = analyticsRepository.getThroughputPerDepartmentNative();
        List<DeptThroughputDTO> deptThroughput = new ArrayList<>();
        for (Object[] row : deptResults) {
            DeptThroughputDTO dto = new DeptThroughputDTO();
            dto.setDepartmentName((String) row[0]);
            
            Number countVar = (Number) row[1];
            dto.setCompletedTasksCount(countVar != null ? countVar.longValue() : 0L);
            
            deptThroughput.add(dto);
        }

        analysis.put("activityAnalytics", activityAnalytics);
        analysis.put("departmentThroughput", deptThroughput);

        return analysis;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGlobalDashboardStats() {
        List<Object[]> result = analyticsRepository.getGlobalDashboardStats();
        Map<String, Object> stats = new HashMap<>();
        
        if (result != null && !result.isEmpty() && result.get(0) != null) {
            Object[] row = result.get(0);
            stats.put("totalCases", row[0] != null ? ((Number) row[0]).longValue() : 0L);
            stats.put("inProgressCases", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            stats.put("completedCases", row[2] != null ? ((Number) row[2]).longValue() : 0L);
            stats.put("rejectedCases", row[3] != null ? ((Number) row[3]).longValue() : 0L);
            stats.put("avgResolutionHours", row[4] != null ? ((Number) row[4]).doubleValue() : null);
        } else {
             stats.put("totalCases", 0L);
             stats.put("inProgressCases", 0L);
             stats.put("completedCases", 0L);
             stats.put("rejectedCases", 0L);
             stats.put("avgResolutionHours", null);
        }
        
        return stats;
    }
}
