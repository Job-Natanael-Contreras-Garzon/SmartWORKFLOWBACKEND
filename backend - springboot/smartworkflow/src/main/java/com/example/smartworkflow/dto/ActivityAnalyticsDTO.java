package com.example.smartworkflow.dto;

import lombok.Data;

@Data
public class ActivityAnalyticsDTO {
    private String activityName;
    private Double avgDurationHours;
    private Long overdueCount;
}
