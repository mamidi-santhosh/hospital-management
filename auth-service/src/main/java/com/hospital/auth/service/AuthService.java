package com.hospital.auth.service;

import com.hospital.auth.dto.*;
import com.hospital.auth.entity.RefreshToken;
import com.hospital.auth.entity.User;
import com.hospital.auth.repository.RefreshTokenRepository;
import com.hospital.auth.repository.UserRepository;
import com.hospital.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisCacheStampedeService cacheStampedeService;

    @Value("${jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);

        // Auto-provision domain profile in patient-doctor-service
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            if (savedUser.getRole() == com.hospital.auth.entity.Role.ROLE_PATIENT) {
                java.util.Map<String, Object> patBody = new java.util.HashMap<>();
                patBody.put("userId", savedUser.getId());
                patBody.put("fullName", (savedUser.getFullName() != null && !savedUser.getFullName().trim().isEmpty()) ? savedUser.getFullName() : savedUser.getUsername());
                patBody.put("phoneNumber", savedUser.getPhoneNumber() != null ? savedUser.getPhoneNumber() : "1234567890");
                patBody.put("gender", "Male");
                patBody.put("bloodGroup", "O+");
                restTemplate.postForObject("http://localhost:8082/api/v1/patients", patBody, Object.class);
            } else if (savedUser.getRole() == com.hospital.auth.entity.Role.ROLE_DOCTOR) {
                String docName = (savedUser.getFullName() != null && !savedUser.getFullName().trim().isEmpty()) ? savedUser.getFullName() : savedUser.getUsername();
                if (!docName.toLowerCase().startsWith("dr.")) {
                    docName = "Dr. " + docName;
                }
                java.util.Map<String, Object> docBody = new java.util.HashMap<>();
                docBody.put("userId", savedUser.getId());
                docBody.put("fullName", docName);
                docBody.put("specialization", "General Medicine");
                docBody.put("qualification", "MD");
                docBody.put("experienceYears", 5);
                docBody.put("consultationFee", new java.math.BigDecimal("150.00"));
                docBody.put("availableDays", "Mon-Fri");
                docBody.put("available", true);
                restTemplate.postForObject("http://localhost:8082/api/v1/doctors", docBody, Object.class);
            }
        } catch (Exception e) {
            log.error("Failed to auto-provision domain profile in patient-doctor-service:", e);
        }

        return mapToUserDto(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (refreshToken.isRevoked() || refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token was expired or revoked");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public void logout(String accessToken, String refreshTokenStr) {
        if (accessToken != null && accessToken.startsWith("Bearer ")) {
            String token = accessToken.substring(7);
            cacheStampedeService.blacklistToken(token, Duration.ofMinutes(15));
        }
        if (refreshTokenStr != null) {
            refreshTokenRepository.findByToken(refreshTokenStr).ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
        }
    }

    public UserDto getUserProfileWithStampedeProtection(Long userId) {
        String cacheKey = "user:profile:" + userId;
        String lockKey = "lock:user:profile:" + userId;

        return cacheStampedeService.getOrComputeWithLock(
                cacheKey,
                lockKey,
                UserDto.class,
                Duration.ofMinutes(10),
                () -> userRepository.findById(userId)
                        .map(this::mapToUserDto)
                        .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId))
        );
    }

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user)
                .orElse(RefreshToken.builder().user(user).build());

        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenExpirationMs));
        refreshToken.setRevoked(false);

        return refreshTokenRepository.save(refreshToken);
    }

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .build();
    }
}
