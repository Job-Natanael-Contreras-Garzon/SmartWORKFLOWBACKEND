package com.example.smartworkflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private UUID id;
    private String name;
    private String email;
    private String role;
    private String status;
    private String avatarUrl;
    private ZonedDateTime createdAt;
    private boolean active;
    private boolean manager;
    private boolean officer;
    private boolean admin;
    private boolean superAdmin;
}
