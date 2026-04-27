package com.example.smartworkflow.controller;

import com.example.smartworkflow.service.BottleneckAnalyzer;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final BottleneckAnalyzer bottleneckAnalyzer;

    @GetMapping("/bottlenecks")
    public ResponseEntity<Map<String, Object>> getBottleneckDashboard(
            @RequestParam(required = false) UUID policyId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        return ResponseEntity.ok(bottleneckAnalyzer.getBottleneckAnalysis(policyId, departmentId, startDate, endDate));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getGlobalDashboard() {
        return ResponseEntity.ok(bottleneckAnalyzer.getGlobalDashboardStats());
    }
}
