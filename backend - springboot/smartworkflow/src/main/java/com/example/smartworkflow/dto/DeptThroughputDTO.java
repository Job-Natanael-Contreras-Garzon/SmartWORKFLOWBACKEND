package com.example.smartworkflow.dto;

import lombok.Data;

@Data
public class DeptThroughputDTO {
    private String departmentName;
    private Long completedTasksCount;
}
