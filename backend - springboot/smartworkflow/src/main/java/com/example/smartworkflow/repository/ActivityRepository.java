package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    Optional<Activity> findByPolicyIdAndType(UUID policyId, String type);
    Optional<Activity> findByPolicyIdAndName(UUID policyId, String name);
}
