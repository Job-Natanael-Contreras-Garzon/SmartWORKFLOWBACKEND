package com.example.smartworkflow.dto;

import lombok.Data;

import java.time.ZonedDateTime;
import java.util.List;

@Data
public class CaseTrackingResponse {
    private String trackingCode;
    private String caseStatus;
    private ZonedDateTime startedAt;
    private ZonedDateTime completedAt;
    private List<TokenInfo> history;
    private List<TokenInfo> currentActivities;
    private Integer progressPercentage; // Estimado

    @Data
    public static class TokenInfo {
        private String activityName;
        private String status;
        private ZonedDateTime startedAt;
        private ZonedDateTime completedAt;
        private String departmentName;
    }
}
