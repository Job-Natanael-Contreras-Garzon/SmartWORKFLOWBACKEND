package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.Client;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    @EntityGraph(attributePaths = {"organization", "createdBy"})
    List<Client> findByOrganizationId(UUID orgId);

    @EntityGraph(attributePaths = {"organization", "createdBy"})
    List<Client> findByOrganizationIdAndNameContainingIgnoreCase(UUID orgId, String name);

    @EntityGraph(attributePaths = {"organization", "createdBy"})
    @Query("SELECT c FROM Client c WHERE c.id = :id")
    Optional<Client> findByIdWithRelations(@Param("id") UUID id);
}
