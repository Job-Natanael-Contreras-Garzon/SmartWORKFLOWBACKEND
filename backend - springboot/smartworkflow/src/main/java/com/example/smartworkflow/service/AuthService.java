package com.example.smartworkflow.service;

import com.example.smartworkflow.dto.LoginRequest;
import com.example.smartworkflow.dto.LoginResponse;
import com.example.smartworkflow.dto.UserProfileDTO;
import com.example.smartworkflow.entity.Organization;
import com.example.smartworkflow.entity.User;
import com.example.smartworkflow.repository.OrganizationRepository;
import com.example.smartworkflow.repository.UserRepository;
import com.example.smartworkflow.security.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtUtils               jwtUtils;

    /**
     * Autentica a un usuario.
     * - Si orgSlug es null o vacío → busca SUPER_ADMIN por email.
     * - Si orgSlug está presente   → busca usuario en esa organización.
     */
    @Transactional(readOnly = true)
    public Object[] authenticateUser(LoginRequest request) {
        User user;

        if (request.getOrgSlug() == null || request.getOrgSlug().isBlank()) {
            // ── Flujo SUPER_ADMIN ──────────────────────────────────────────────
            user = userRepository
                    .findByEmailAndOrganizationIsNullAndRole(request.getEmail(), "SUPER_ADMIN")
                    .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
        } else {
            // ── Flujo org-scoped (ADMIN, MANAGER, OFFICER) ────────────────────
            Organization org = organizationRepository.findBySlug(request.getOrgSlug())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Organización no encontrada: " + request.getOrgSlug()));

            user = userRepository.findByEmailAndOrganization(request.getEmail(), org)
                    .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));
        }

        validateActiveUser(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Credenciales inválidas");
        }

        return generateTokensForUser(user);
    }

    /**
     * Renueva tokens a partir de un refreshToken válido.
     * El token de refresco sólo contiene el userId en su subject.
     */
    @Transactional(readOnly = true)
    public Object[] refreshFromToken(String refreshToken) {
        if (!jwtUtils.validateToken(refreshToken)) {
            throw new IllegalArgumentException("Refresh token inválido o expirado");
        }

        String userId = jwtUtils.extractClaims(refreshToken).getSubject();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));

        validateActiveUser(user);
        return generateTokensForUser(user);
    }

    @Transactional(readOnly = true)
    public Object[] impersonateUser(UUID targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + targetUserId));
        validateActiveUser(user);
        return generateTokensForUser(user);
    }

    // ── Helpers privados ───────────────────────────────────────────────────────

    private void validateActiveUser(User user) {
        if (!user.isActive()) {
            throw new IllegalStateException("El usuario está inactivo o suspendido.");
        }
    }

    private Object[] generateTokensForUser(User user) {
        Organization org    = user.getOrganization();
        UUID orgId          = org   != null ? org.getId()   : null;
        String orgSlug      = org   != null ? org.getSlug() : null;
        UUID deptId         = user.getDepartment() != null ? user.getDepartment().getId() : null;

        String accessToken  = jwtUtils.generateAccessToken(user.getId(), orgId, orgSlug, user.getRole(), deptId);
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false)          // true en producción (HTTPS)
                .path("/api/auth/refresh")
                .maxAge(7 * 24 * 60 * 60L)
                .sameSite("Lax")        // Lax permite cookies en redirecciones de subdominio
                .build();

        UUID profileDeptId = deptId;
        String profileOrgSlug = orgSlug;
        String profileOrgName = org != null ? org.getName() : null;
        UserProfileDTO profile = new UserProfileDTO(user.getId(), user.getName(), user.getRole(), profileDeptId, profileOrgSlug, profileOrgName);
        LoginResponse response = new LoginResponse(accessToken, profile);

        return new Object[]{refreshCookie.toString(), response};
    }
}
