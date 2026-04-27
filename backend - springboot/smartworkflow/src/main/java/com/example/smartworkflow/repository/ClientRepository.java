package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {
    List<Client> findByOrganizationId(UUID orgId);
    List<Client> findByOrganizationIdAndNameContainingIgnoreCase(UUID orgId, String name);
}
