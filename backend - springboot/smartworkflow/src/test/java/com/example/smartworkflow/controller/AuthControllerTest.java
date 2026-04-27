package com.example.smartworkflow.controller;

import com.example.smartworkflow.dto.LoginRequest;
import com.example.smartworkflow.dto.LoginResponse;
import com.example.smartworkflow.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    void testLogin_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@empresa.com");
        loginRequest.setPassword("password123");
        loginRequest.setOrgSlug("empresa-sa");

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setAccessToken("fake-jwt-token");
        // Simulated UserProfile in response here if set.

        String fakeCookie = "accessToken=fake-jwt-token; HttpOnly; Path=/";

        Object[] serviceResult = new Object[]{fakeCookie, loginResponse};

        when(authService.authenticateUser(any(LoginRequest.class))).thenReturn(serviceResult);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, fakeCookie))
                .andExpect(jsonPath("$.accessToken").value("fake-jwt-token"));
    }

    @Test
    void testImpersonate_Success() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        Map<String, UUID> requestBody = new HashMap<>();
        requestBody.put("targetUserId", targetUserId);

        LoginResponse impersonationResponse = new LoginResponse();
        impersonationResponse.setAccessToken("impersonated-jwt-token");

        String fakeCookie = "accessToken=impersonated-jwt-token; HttpOnly; Path=/";

        Object[] serviceResult = new Object[]{fakeCookie, impersonationResponse};

        when(authService.impersonateUser(targetUserId)).thenReturn(serviceResult);

        mockMvc.perform(post("/api/auth/impersonate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, fakeCookie))
                .andExpect(jsonPath("$.accessToken").value("impersonated-jwt-token"));
    }

    @Test
    void testImpersonate_BadRequest_NoTargetId() throws Exception {
        Map<String, UUID> requestBody = new HashMap<>(); // missing targetUserId

        mockMvc.perform(post("/api/auth/impersonate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestBody)))
                .andExpect(status().isBadRequest());
    }
}
