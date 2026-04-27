package com.example.smartworkflow.controller;

import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() { // Todo: Add role checking/filters
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        user.setStatus("ACTIVE");
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElseThrow();
        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setDepartment(userDetails.getDepartment());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> softDeleteUser(@PathVariable UUID id) {
        User user = userRepository.findById(id).orElseThrow();
        user.setStatus("INACTIVE"); // Soft Delete
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(@RequestAttribute("userId") UUID userId) {
        // En tu interceptor/filtro JWT, debes asignar el 'userId' como un atributo del request
        return ResponseEntity.ok(userRepository.findById(userId).orElseThrow());
    }
}
