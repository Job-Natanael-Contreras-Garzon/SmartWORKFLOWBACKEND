package com.example.smartworkflow.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * DTO para crear un nuevo cliente/ciudadano.
 */
@Data
@Schema(description = "Datos requeridos para crear un nuevo cliente")
public class CreateClientRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Schema(description = "Nombre completo del cliente", example = "Juan Pérez", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Email(message = "El email debe tener formato válido")
    @Schema(description = "Correo electrónico del cliente", example = "juan.perez@email.com", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String email;

    @Schema(description = "Teléfono de contacto", example = "+591 71234567", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String phone;

    @Schema(description = "Documento de identidad (DNI/CI)", example = "1234567", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    private String dni;
}
