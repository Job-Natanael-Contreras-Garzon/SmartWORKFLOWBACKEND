package com.example.smartworkflow.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * DTO para devolver información de un cliente en las APIs.
 * Excluye relaciones lazy (organization, createdBy) mostrando solo IDs.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Información de un cliente/ciudadano")
public class ClientResponseDTO {

    @Schema(description = "ID único del cliente", example = "550e8400-e29b-41d4-a716-446655440000")
    private UUID id;

    @Schema(description = "Nombre completo del cliente", example = "Juan Pérez")
    private String name;

    @Schema(description = "Correo electrónico", example = "juan.perez@email.com")
    private String email;

    @Schema(description = "Teléfono de contacto", example = "+591 71234567")
    private String phone;

    @Schema(description = "Documento de identidad (DNI/CI)", example = "1234567")
    private String dni;

    @Schema(description = "ID de la organización a la que pertenece", example = "550e8400-e29b-41d4-a716-446655440001")
    private UUID orgId;

    @Schema(description = "Nombre de la organización")
    private String orgName;

    @Schema(description = "ID del usuario que creó el cliente", example = "550e8400-e29b-41d4-a716-446655440002")
    private UUID createdById;

    @Schema(description = "Nombre del usuario que creó el cliente")
    private String createdByName;

    @Schema(description = "Fecha de creación", example = "2026-04-29T14:30:00Z")
    private ZonedDateTime createdAt;
}
