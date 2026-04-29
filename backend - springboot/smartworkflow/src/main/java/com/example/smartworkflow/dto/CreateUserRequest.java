package com.example.smartworkflow.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.UUID;

/**
 * DTO para crear un nuevo usuario.
 * Campos calculados (id, createdAt, status) se asignan automáticamente.
 */
@Data
@Schema(description = "Datos requeridos para crear un nuevo usuario")
public class CreateUserRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Schema(description = "Nombre completo del usuario", example = "Carlos Rodríguez", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener formato válido")
    @Schema(description = "Correo electrónico del usuario", example = "carlos@empresa.com", requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;

    @NotBlank(message = "El rol es obligatorio")
    @Pattern(regexp = "ADMIN|MANAGER|OFFICER", message = "El rol debe ser ADMIN, MANAGER u OFFICER")
    @Schema(description = "Rol del usuario en la organización", example = "OFFICER", allowableValues = {"ADMIN", "MANAGER", "OFFICER"}, requiredMode = Schema.RequiredMode.REQUIRED)
    private String role;

    @Schema(description = "ID de la organización (solo para SUPER_ADMIN). Si no se proporciona, se usa la organización del usuario autenticado", example = "550e8400-e29b-41d4-a716-446655440000", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private UUID orgId;

    @Schema(description = "ID del departamento al que pertenece", example = "550e8400-e29b-41d4-a716-446655440001", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private UUID departmentId;

    @Schema(description = "URL del avatar del usuario", example = "https://cdn.empresa.com/avatars/carlos.jpg", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String avatarUrl;

    @NotBlank(message = "La contraseña es obligatoria")
    @Schema(description = "Contraseña inicial del usuario", example = "SecurePass123!", requiredMode = Schema.RequiredMode.REQUIRED)
    private String password;
}
