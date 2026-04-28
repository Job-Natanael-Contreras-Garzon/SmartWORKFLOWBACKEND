package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /** Busca usuario dentro de una org específica (ADMIN, MANAGER, OFFICER) */
    Optional<User> findByEmailAndOrganization(String email, Organization organization);

    /** Busca SUPER_ADMIN por email (org_id IS NULL, role = SUPER_ADMIN) */
    Optional<User> findByEmailAndOrganizationIsNullAndRole(String email, String role);

    /** Todos los usuarios de un departamento */
    List<User> findByDepartmentId(UUID departmentId);

    List<User> findByDepartmentIdAndRole(UUID departmentId, String role);

    /** Todos los usuarios de una organización */
    List<User> findByOrganizationId(UUID orgId);

    List<User> findByOrganizationIdAndRole(UUID orgId, String role);

    /** Filtros combinados */
    List<User> findByOrganizationIdAndStatus(UUID orgId, String status);
    List<User> findByOrganizationIdAndRoleAndStatus(UUID orgId, String role, String status);
}
