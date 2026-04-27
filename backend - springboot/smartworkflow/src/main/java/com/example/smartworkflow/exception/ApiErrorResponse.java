package com.example.smartworkflow.exception;

import lombok.Builder;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.List;

@Data
@Builder
public class ApiErrorResponse {
    private int status;
    private String message;
    private List<String> errors;
    private ZonedDateTime timestamp;
    private String traceId;
}