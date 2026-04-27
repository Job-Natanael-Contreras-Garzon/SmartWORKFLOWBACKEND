package com.example.smartworkflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private UUID id;
    private String name;
    private String role;
    private UUID departmentId;
    /** Slug de la organización (null para SUPER_ADMIN) */
    private String orgSlug;
    /** Nombre de la organización (null para SUPER_ADMIN) */
    private String orgName;
}
