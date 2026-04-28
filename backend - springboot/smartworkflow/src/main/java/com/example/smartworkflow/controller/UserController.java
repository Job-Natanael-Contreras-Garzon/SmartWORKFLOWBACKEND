package com.example.smartworkflow.controller;

import com.example.smartworkflow.dto.UserResponseDTO;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /** Helper para convertir User a UserResponseDTO */
    private UserResponseDTO toUserResponseDTO(User user) {
        return new UserResponseDTO(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getAvatarUrl(),
            user.getCreatedAt(),
            user.isActive(),
            user.isManager(),
            user.isOfficer(),
            user.isAdmin(),
            user.isSuperAdmin()
        );
    }

    /**
     * Obtener perfil del usuario autenticado
     * Disponible para cualquier usuario autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getMyProfile(@RequestAttribute("userId") UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return ResponseEntity.ok(toUserResponseDTO(user));
    }

    /**
     * Obtener todos los usuarios con filtros opcionales
     * SUPER_ADMIN: puede ver todos los usuarios sin restricción
     * ADMIN/MANAGER: solo usuarios de su organización
     */
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers(
            @RequestParam(required = false) UUID orgId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestAttribute(value = "orgId", required = false) UUID requestOrgId,
            @RequestAttribute(value = "role", required = false) String userRole) {
        
        List<User> users;
        
        // SUPER_ADMIN puede ver todos los usuarios sin restricción
        if ("SUPER_ADMIN".equals(userRole)) {
            if (orgId != null && role != null && status != null) {
                users = userRepository.findByOrganizationIdAndRoleAndStatus(orgId, role, status);
            } else if (orgId != null && role != null) {
                users = userRepository.findByOrganizationIdAndRole(orgId, role);
            } else if (orgId != null && status != null) {
                users = userRepository.findByOrganizationIdAndStatus(orgId, status);
            } else if (orgId != null) {
                users = userRepository.findByOrganizationId(orgId);
            } else {
                users = userRepository.findAll();
            }
        } else {
            // ADMIN/MANAGER/OFFICER solo pueden ver usuarios de su organización
            UUID effectiveOrgId = (orgId != null) ? orgId : requestOrgId;
            
            if (role != null && status != null) {
                users = userRepository.findByOrganizationIdAndRoleAndStatus(effectiveOrgId, role, status);
            } else if (role != null) {
                users = userRepository.findByOrganizationIdAndRole(effectiveOrgId, role);
            } else if (status != null) {
                users = userRepository.findByOrganizationIdAndStatus(effectiveOrgId, status);
            } else {
                users = userRepository.findByOrganizationId(effectiveOrgId);
            }
        }
        
        return ResponseEntity.ok(users.stream()
            .map(this::toUserResponseDTO)
            .collect(Collectors.toList()));
    }

    /**
     * Obtener un usuario específico por ID
     * SUPER_ADMIN: puede ver cualquier usuario
     * ADMIN/MANAGER: solo usuarios de su organización
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(
            @PathVariable UUID id,
            @RequestAttribute(value = "orgId", required = false) UUID requestOrgId,
            @RequestAttribute(value = "role", required = false) String userRole) {
        
        User user = userRepository.findById(id).orElseThrow();
        
        // Verificar permisos: si no es SUPER_ADMIN, solo puede ver usuarios de su org
        if (!"SUPER_ADMIN".equals(userRole) && requestOrgId != null) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(requestOrgId)) {
                return ResponseEntity.status(403).build();
            }
        }
        
        return ResponseEntity.ok(toUserResponseDTO(user));
    }

    /**
     * Crear un nuevo usuario
     * SUPER_ADMIN: puede crear cualquier usuario
     * ADMIN: puede crear usuarios en su organización
     */
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> createUser(
            @RequestBody User user,
            @RequestAttribute(value = "orgId", required = false) UUID requestOrgId,
            @RequestAttribute(value = "role", required = false) String userRole) {
        
        // Si no es SUPER_ADMIN, asegurar que el usuario se cree en su organización
        if (!"SUPER_ADMIN".equals(userRole) && requestOrgId != null) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(requestOrgId)) {
                return ResponseEntity.status(403).build();
            }
        }
        
        user.setStatus("ACTIVE");
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(toUserResponseDTO(savedUser));
    }

    /**
     * Actualizar un usuario
     * SUPER_ADMIN: puede actualizar cualquier usuario
     * ADMIN: puede actualizar usuarios de su organización
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> updateUser(
            @PathVariable UUID id,
            @RequestBody User userDetails,
            @RequestAttribute(value = "orgId", required = false) UUID requestOrgId,
            @RequestAttribute(value = "role", required = false) String userRole) {
        
        User user = userRepository.findById(id).orElseThrow();
        
        // Verificar permisos
        if (!"SUPER_ADMIN".equals(userRole) && requestOrgId != null) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(requestOrgId)) {
                return ResponseEntity.status(403).build();
            }
        }
        
        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setDepartment(userDetails.getDepartment());
        user.setAvatarUrl(userDetails.getAvatarUrl());
        
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(toUserResponseDTO(updatedUser));
    }

    /**
     * Soft delete de un usuario
     * SUPER_ADMIN: puede eliminar cualquier usuario
     * ADMIN: puede eliminar usuarios de su organización
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Void> softDeleteUser(
            @PathVariable UUID id,
            @RequestAttribute(value = "orgId", required = false) UUID requestOrgId,
            @RequestAttribute(value = "role", required = false) String userRole) {
        
        User user = userRepository.findById(id).orElseThrow();
        
        // Verificar permisos
        if (!"SUPER_ADMIN".equals(userRole) && requestOrgId != null) {
            if (user.getOrganization() == null || !user.getOrganization().getId().equals(requestOrgId)) {
                return ResponseEntity.status(403).build();
            }
        }
        
        user.setStatus("INACTIVE");
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }
}
