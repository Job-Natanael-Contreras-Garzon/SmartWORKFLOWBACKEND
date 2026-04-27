package com.example.smartworkflow.dto;

import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class CaseStartRequest {
    private UUID policyId;
    private UUID orgId;
    /** ID del cliente ya registrado en el sistema */
    private UUID clientId;
    private Map<String, Object> initialFormData;
}
