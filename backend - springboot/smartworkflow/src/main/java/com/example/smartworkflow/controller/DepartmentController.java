package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.Department;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.DepartmentRepository;
import com.example.smartworkflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments(@RequestAttribute("orgId") UUID orgId) {
        return ResponseEntity.ok(departmentRepository.findByOrganizationId(orgId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        return ResponseEntity.ok(departmentRepository.save(department));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> updateDepartment(@PathVariable UUID id, @RequestBody Department details) {
        Department dept = departmentRepository.findById(id).orElseThrow();
        dept.setName(details.getName());
        dept.setCode(details.getCode());
        dept.setParent(details.getParent());
        dept.setManager(details.getManager());
        return ResponseEntity.ok(departmentRepository.save(dept));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable UUID id) {
        departmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<User>> getDepartmentMembers(@PathVariable UUID id) {
        return ResponseEntity.ok(userRepository.findByDepartmentId(id));
    }
}
