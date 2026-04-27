package com.example.smartworkflow.repository;

import com.example.smartworkflow.entity.CaseHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CaseHistoryRepository extends JpaRepository<CaseHistory, UUID> {
}
